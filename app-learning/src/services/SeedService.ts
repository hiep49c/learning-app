/**
 * SeedService — loads bundled JSON seed data into WatermelonDB on first launch.
 *
 * Strategy:
 * - Seeds one module at a time (module → its lessons → keywords → code_examples → quizzes → quiz_questions)
 * - After each module batch, saves progress to AsyncStorage (`@seed_last_module`)
 * - After all modules + cross-cutting data, saves `@seed_version`
 * - Supports resume from last completed module if interrupted
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database, Collection } from '@nozbe/watermelondb';
import type { Model } from '@nozbe/watermelondb';

import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';

// ─── Seed data JSON imports (bundled with app) ───

const modulesData: ModuleSeed[] = require('../../assets/seed-data/modules.json');
const lessonsData: LessonSeed[] = require('../../assets/seed-data/lessons.json');
const keywordsData: KeywordSeed[] = require('../../assets/seed-data/keywords.json');
const keywordRelationsData: KeywordRelationSeed[] = require('../../assets/seed-data/keyword_relations.json');
const codeExamplesData: CodeExampleSeed[] = require('../../assets/seed-data/code_examples.json');
const quizzesData: QuizSeed[] = require('../../assets/seed-data/quizzes.json');
const quizQuestionsData: QuizQuestionSeed[] = require('../../assets/seed-data/quiz_questions.json');
const modulePrerequisitesData: ModulePrerequisiteSeed[] = require('../../assets/seed-data/module_prerequisites.json');

// English Vocabulary data
const vocabModulesData: ModuleSeed[] = require('../../assets/seed-data/vocab-modules.json');
const vocabLessonsData: LessonSeed[] = require('../../assets/seed-data/vocab-lessons.json');
const vocabKeywordsData: KeywordSeed[] = require('../../assets/seed-data/vocab-keywords.json');
const vocabCodeExamplesData: CodeExampleSeed[] = require('../../assets/seed-data/vocab-code-examples.json');
const vocabQuizzesData: QuizSeed[] = require('../../assets/seed-data/vocab-quizzes.json');
const vocabQuizQuestionsData: QuizQuestionSeed[] = require('../../assets/seed-data/vocab-quiz-questions.json');

// ─── AsyncStorage keys ───

const SEED_VERSION_KEY = '@seed_version';
const SEED_LAST_MODULE_KEY = '@seed_last_module';

/** Current seed data version. Bump when seed data changes. */
const CURRENT_SEED_VERSION = 3;

// ─── Seed data types (snake_case matching JSON files) ───

interface ModuleSeed {
  id: string;
  title: string;
  title_vi: string;
  description: string;
  order_index: number;
  difficulty_level: string;
  icon_name: string;
  lesson_count: number;
}

interface LessonSeed {
  id: string;
  module_id: string;
  title: string;
  title_vi: string;
  description: string;
  order_index: number;
  content_json: string;
  source_file: string;
  estimated_minutes: number;
}

interface KeywordSeed {
  id: string;
  lesson_id: string;
  name: string;
  definition: string;
  explanation: string;
  code_example: string | null;
  category: string;
}

interface KeywordRelationSeed {
  id: string;
  keyword_id: string;
  related_keyword_id: string;
}

interface CodeExampleSeed {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  file_name: string | null;
  order_index: number;
}

interface QuizSeed {
  id: string;
  lesson_id: string;
  title: string;
  question_count: number;
}

interface QuizQuestionSeed {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options_json: string;
  correct_answer: string;
  explanation: string;
  related_keyword_id: string | null;
  order_index: number;
}

interface ModulePrerequisiteSeed {
  id: string;
  module_id: string;
  prerequisite_module_id: string;
}

// ─── Helper: batch create records ───

type RawFieldSetter = (record: Model) => void;

async function batchCreate<T extends { id: string }>(
  db: Database,
  collection: Collection<Model>,
  items: T[],
  setFields: (record: Model, item: T) => void,
): Promise<void> {
  if (items.length === 0) return;

  // Batch in chunks of 200 to avoid memory pressure on low-end devices
  for (let i = 0; i < items.length; i += 200) {
    const chunk = items.slice(i, i + 200);
    try {
      await db.write(async () => {
        const batch = chunk.map((item) =>
          collection.prepareCreate((record) => {
            record._raw.id = item.id;
            setFields(record, item);
          }),
        );
        await db.batch(...batch);
      });
    } catch {
      // If batch fails (likely duplicate IDs from partial previous seed),
      // insert one by one, skipping existing
      for (const item of chunk) {
        try {
          await collection.find(item.id);
        } catch {
          await db.write(async () => {
            await collection.create((record) => {
              record._raw.id = item.id;
              setFields(record, item);
            });
          });
        }
      }
    }
  }
}

// ─── Field setters per table ───

function setModuleFields(record: Model, item: ModuleSeed): void {
  const raw = record._raw as Record<string, unknown>;
  raw.title = item.title;
  raw.title_vi = item.title_vi;
  raw.description = item.description;
  raw.order_index = item.order_index;
  raw.difficulty_level = item.difficulty_level;
  raw.icon_name = item.icon_name;
  raw.lesson_count = item.lesson_count;
}

function setLessonFields(record: Model, item: LessonSeed): void {
  const raw = record._raw as Record<string, unknown>;
  raw.module_id = item.module_id;
  raw.title = item.title;
  raw.title_vi = item.title_vi;
  raw.description = item.description;
  raw.order_index = item.order_index;
  raw.content_json = item.content_json;
  raw.source_file = item.source_file;
  raw.estimated_minutes = item.estimated_minutes;
}

function setKeywordFields(record: Model, item: KeywordSeed): void {
  const raw = record._raw as Record<string, unknown>;
  raw.lesson_id = item.lesson_id;
  raw.name = item.name;
  raw.definition = item.definition;
  raw.explanation = item.explanation;
  raw.code_example = item.code_example ?? '';
  raw.category = item.category;
}

function setKeywordRelationFields(record: Model, item: KeywordRelationSeed): void {
  const raw = record._raw as Record<string, unknown>;
  raw.keyword_id = item.keyword_id;
  raw.related_keyword_id = item.related_keyword_id;
}

function setCodeExampleFields(record: Model, item: CodeExampleSeed): void {
  const raw = record._raw as Record<string, unknown>;
  raw.lesson_id = item.lesson_id;
  raw.title = item.title;
  raw.description = item.description;
  raw.code = item.code;
  raw.language = item.language;
  raw.file_name = item.file_name ?? '';
  raw.order_index = item.order_index;
}

function setQuizFields(record: Model, item: QuizSeed): void {
  const raw = record._raw as Record<string, unknown>;
  raw.lesson_id = item.lesson_id;
  raw.title = item.title;
  raw.question_count = item.question_count;
}

function setQuizQuestionFields(record: Model, item: QuizQuestionSeed): void {
  const raw = record._raw as Record<string, unknown>;
  raw.quiz_id = item.quiz_id;
  raw.question_text = item.question_text;
  raw.question_type = item.question_type;
  raw.options_json = item.options_json;
  raw.correct_answer = item.correct_answer;
  raw.explanation = item.explanation;
  raw.related_keyword_id = item.related_keyword_id ?? '';
  raw.order_index = item.order_index;
}

function setModulePrerequisiteFields(record: Model, item: ModulePrerequisiteSeed): void {
  const raw = record._raw as Record<string, unknown>;
  raw.module_id = item.module_id;
  raw.prerequisite_module_id = item.prerequisite_module_id;
}

// ─── Core: seed one module and its related data ───

async function seedModule(db: Database, moduleItem: ModuleSeed): Promise<void> {
  const moduleId = moduleItem.id;

  // Create module if not exists
  await batchCreate(db, db.get('modules'), [moduleItem], setModuleFields);

  // 2. Lessons for this module
  const moduleLessons = lessonsData.filter((l) => l.module_id === moduleId);
  await batchCreate(db, db.get('lessons'), moduleLessons, setLessonFields);

  // 3. Get lesson IDs for this module to filter child data
  const lessonIds = new Set(moduleLessons.map((l) => l.id));

  // 4. Keywords for this module's lessons
  const moduleKeywords = keywordsData.filter((k) => lessonIds.has(k.lesson_id));
  await batchCreate(db, db.get('keywords'), moduleKeywords, setKeywordFields);

  // 5. Code examples for this module's lessons
  const moduleCodeExamples = codeExamplesData.filter((c) => lessonIds.has(c.lesson_id));
  await batchCreate(db, db.get('code_examples'), moduleCodeExamples, setCodeExampleFields);

  // 6. Quizzes for this module's lessons
  const moduleQuizzes = quizzesData.filter((q) => lessonIds.has(q.lesson_id));
  await batchCreate(db, db.get('quizzes'), moduleQuizzes, setQuizFields);

  // 7. Quiz questions for this module's quizzes
  const quizIds = new Set(moduleQuizzes.map((q) => q.id));
  const moduleQuizQuestions = quizQuestionsData.filter((qq) => quizIds.has(qq.quiz_id));
  await batchCreate(db, db.get('quiz_questions'), moduleQuizQuestions, setQuizQuestionFields);
}

// ─── Core: seed cross-cutting data (after all modules) ───

async function seedCrossCuttingData(db: Database): Promise<void> {
  // Keyword relations (cross-module)
  await batchCreate(
    db,
    db.get('keyword_relations'),
    keywordRelationsData,
    setKeywordRelationFields,
  );

  // Module prerequisites
  await batchCreate(
    db,
    db.get('module_prerequisites'),
    modulePrerequisitesData,
    setModulePrerequisiteFields,
  );
}

// ─── Public API ───

// ─── Core: seed one vocab module (topic) and its related data ───

async function seedVocabModule(db: Database, moduleItem: ModuleSeed): Promise<void> {
  const moduleId = moduleItem.id;

  // Create module if not exists
  await batchCreate(db, db.get('modules'), [moduleItem], setModuleFields);

  const moduleLessons = vocabLessonsData.filter((l) => l.module_id === moduleId);
  await batchCreate(db, db.get('lessons'), moduleLessons, setLessonFields);

  const lessonIds = new Set(moduleLessons.map((l) => l.id));

  // Batch keywords in chunks of 500 to avoid memory issues
  const moduleKeywords = vocabKeywordsData.filter((k) => lessonIds.has(k.lesson_id));
  for (let i = 0; i < moduleKeywords.length; i += 500) {
    await batchCreate(db, db.get('keywords'), moduleKeywords.slice(i, i + 500), setKeywordFields);
  }

  const moduleCodeExamples = vocabCodeExamplesData.filter((c) => lessonIds.has(c.lesson_id));
  for (let i = 0; i < moduleCodeExamples.length; i += 500) {
    await batchCreate(db, db.get('code_examples'), moduleCodeExamples.slice(i, i + 500), setCodeExampleFields);
  }

  const moduleQuizzes = vocabQuizzesData.filter((q) => lessonIds.has(q.lesson_id));
  await batchCreate(db, db.get('quizzes'), moduleQuizzes, setQuizFields);

  const quizIds = new Set(moduleQuizzes.map((q) => q.id));
  const moduleQuizQuestions = vocabQuizQuestionsData.filter((qq) => quizIds.has(qq.quiz_id));
  await batchCreate(db, db.get('quiz_questions'), moduleQuizQuestions, setQuizQuestionFields);
}


/**
 * Check if seed data has been loaded (via `@seed_version` in AsyncStorage).
 */
export async function isSeeded(): Promise<boolean> {
  const version = await AsyncStorage.getItem(SEED_VERSION_KEY);
  return version !== null && parseInt(version, 10) >= CURRENT_SEED_VERSION;
}

/**
 * Return the current seed version number stored in AsyncStorage, or 0 if not seeded.
 */
export async function getSeedVersion(): Promise<number> {
  const version = await AsyncStorage.getItem(SEED_VERSION_KEY);
  if (version === null) return 0;
  return parseInt(version, 10);
}

/**
 * Load all seed data into WatermelonDB in batches per module.
 * Calls `onProgress(percent)` after each module completes.
 */
export async function seed(onProgress: (percent: number) => void): Promise<void> {
  // If all data already exists (e.g. app updated without uninstall), skip seeding
  const existingJavaCount = await database.get('modules').query(Q.where('id', Q.notLike('vocab-%'))).fetchCount();
  const existingVocabCount = await database.get('modules').query(Q.where('id', Q.like('vocab-%'))).fetchCount();
  if (existingJavaCount >= modulesData.length && existingVocabCount >= vocabModulesData.length) {
    await AsyncStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION));
    await AsyncStorage.removeItem(SEED_LAST_MODULE_KEY);
    onProgress(100);
    return;
  }

  const sortedModules = [...modulesData].sort((a, b) => a.order_index - b.order_index);
  const sortedVocabModules = [...vocabModulesData].sort((a, b) => a.order_index - b.order_index);
  const totalSteps = sortedModules.length + sortedVocabModules.length + 1;
  let step = 0;

  // Seed Java Spring modules
  for (const moduleItem of sortedModules) {
    await seedModule(database, moduleItem);
    await AsyncStorage.setItem(SEED_LAST_MODULE_KEY, moduleItem.id);
    step++;
    onProgress(Math.round((step / totalSteps) * 100));
  }

  // Seed cross-cutting data
  await seedCrossCuttingData(database);

  // Seed English Vocabulary modules
  for (const vocabModule of sortedVocabModules) {
    await seedVocabModule(database, vocabModule);
    await AsyncStorage.setItem(SEED_LAST_MODULE_KEY, vocabModule.id);
    step++;
    onProgress(Math.round((step / totalSteps) * 100));
  }

  // Mark seeding complete
  await AsyncStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION));
  await AsyncStorage.removeItem(SEED_LAST_MODULE_KEY);
  onProgress(100);
}

/**
 * Resume seeding from the last completed module.
 * Picks up where a previous interrupted seed left off.
 */
export async function resumeSeed(onProgress: (percent: number) => void): Promise<void> {
  const lastModuleId = await AsyncStorage.getItem(SEED_LAST_MODULE_KEY);
  const sortedModules = [...modulesData].sort((a, b) => a.order_index - b.order_index);
  const sortedVocabModules = [...vocabModulesData].sort((a, b) => a.order_index - b.order_index);
  const allModules = [...sortedModules, ...sortedVocabModules];
  const totalSteps = allModules.length + 1;

  // Find the index of the last completed module
  let startIndex = 0;
  if (lastModuleId !== null) {
    const lastIndex = allModules.findIndex((m) => m.id === lastModuleId);
    if (lastIndex >= 0) {
      startIndex = lastIndex + 1;
    }
  }

  if (startIndex > 0) {
    onProgress(Math.round((startIndex / totalSteps) * 100));
  }

  // Seed remaining modules
  for (let i = startIndex; i < allModules.length; i++) {
    const moduleItem = allModules[i];
    if (!moduleItem) continue;

    if (moduleItem.id.startsWith('vocab-')) {
      await seedVocabModule(database, moduleItem);
    } else {
      await seedModule(database, moduleItem);
    }
    await AsyncStorage.setItem(SEED_LAST_MODULE_KEY, moduleItem.id);
    onProgress(Math.round(((i + 1) / totalSteps) * 100));
  }

  const existingRelations = await database.get('keyword_relations').query().fetchCount();
  if (existingRelations === 0) {
    await seedCrossCuttingData(database);
  }

  await AsyncStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION));
  await AsyncStorage.removeItem(SEED_LAST_MODULE_KEY);
  onProgress(100);
}

/** Exported for testing */
export const _testing = {
  SEED_VERSION_KEY,
  SEED_LAST_MODULE_KEY,
  CURRENT_SEED_VERSION,
  seedModule,
  seedCrossCuttingData,
};
