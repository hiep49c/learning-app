import * as fs from 'fs';
import * as path from 'path';
import { parseAllContent } from './parse-content';
import { generateQuizzes } from './generate-quizzes';
import type { ParsedModule, ParsedLesson, ParsedKeyword, ParsedCodeExample, LessonContent } from './parse-content';
import type { GeneratedQuiz, GeneratedQuestion } from './generate-quizzes';

// ─── Seed Data Interfaces (snake_case matching WatermelonDB schema) ───

interface SeedModule {
  id: string;
  title: string;
  title_vi: string;
  description: string;
  order_index: number;
  difficulty_level: string;
  icon_name: string;
  lesson_count: number;
}

interface SeedLesson {
  id: string;
  module_id: string;
  title: string;
  title_vi: string;
  description: string;
  order_index: number;
  content_json: string; // stringified LessonContent
  source_file: string;
  estimated_minutes: number;
}

interface SeedKeyword {
  id: string;
  lesson_id: string;
  name: string;
  definition: string;
  explanation: string;
  code_example: string | null;
  category: string;
}

interface SeedKeywordRelation {
  id: string;
  keyword_id: string;
  related_keyword_id: string;
}

interface SeedCodeExample {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  file_name: string | null;
  order_index: number;
}

interface SeedQuiz {
  id: string;
  lesson_id: string;
  title: string;
  question_count: number;
}

interface SeedQuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options_json: string; // stringified string[]
  correct_answer: string;
  explanation: string;
  related_keyword_id: string | null;
  order_index: number;
}

interface SeedModulePrerequisite {
  id: string;
  module_id: string;
  prerequisite_module_id: string;
}

// ─── Transform Functions ───

function toSeedModule(mod: ParsedModule): SeedModule {
  return {
    id: mod.id,
    title: mod.title,
    title_vi: mod.titleVi,
    description: mod.description,
    order_index: mod.orderIndex,
    difficulty_level: mod.difficultyLevel,
    icon_name: mod.iconName,
    lesson_count: mod.lessonCount,
  };
}

function toSeedLesson(lesson: ParsedLesson): SeedLesson {
  return {
    id: lesson.id,
    module_id: lesson.moduleId,
    title: lesson.title,
    title_vi: lesson.titleVi,
    description: lesson.description,
    order_index: lesson.orderIndex,
    content_json: JSON.stringify(lesson.contentJson),
    source_file: lesson.sourceFile,
    estimated_minutes: lesson.estimatedMinutes,
  };
}

function toSeedKeyword(keyword: ParsedKeyword): SeedKeyword {
  return {
    id: keyword.id,
    lesson_id: keyword.lessonId,
    name: keyword.name,
    definition: keyword.definition,
    explanation: keyword.explanation,
    code_example: keyword.codeExample,
    category: keyword.category,
  };
}

function toSeedCodeExample(ce: ParsedCodeExample): SeedCodeExample {
  return {
    id: ce.id,
    lesson_id: ce.lessonId,
    title: ce.title,
    description: ce.description,
    code: ce.code,
    language: ce.language,
    file_name: ce.fileName,
    order_index: ce.orderIndex,
  };
}

function toSeedQuiz(quiz: GeneratedQuiz): SeedQuiz {
  return {
    id: quiz.id,
    lesson_id: quiz.lessonId,
    title: quiz.title,
    question_count: quiz.questionCount,
  };
}

function toSeedQuizQuestion(q: GeneratedQuestion): SeedQuizQuestion {
  return {
    id: q.id,
    quiz_id: q.quizId,
    question_text: q.questionText,
    question_type: q.questionType,
    options_json: JSON.stringify(q.optionsJson),
    correct_answer: q.correctAnswer,
    explanation: q.explanation,
    related_keyword_id: q.relatedKeywordId,
    order_index: q.orderIndex,
  };
}

// ─── Keyword Relations ───

function generateKeywordRelations(keywords: readonly ParsedKeyword[]): SeedKeywordRelation[] {
  const relations: SeedKeywordRelation[] = [];

  // Group keywords by category
  const byCategory = new Map<string, ParsedKeyword[]>();
  for (const kw of keywords) {
    const existing = byCategory.get(kw.category);
    if (existing) {
      existing.push(kw);
    } else {
      byCategory.set(kw.category, [kw]);
    }
  }

  let relationIndex = 0;

  for (const [, categoryKeywords] of byCategory) {
    // Sort by name for deterministic selection
    const sorted = [...categoryKeywords].sort((a, b) => a.name.localeCompare(b.name));

    for (const kw of sorted) {
      // Find other keywords in same category (exclude self)
      const others = sorted.filter((other) => other.id !== kw.id);
      // Take first 3 (deterministic — already sorted by name)
      const related = others.slice(0, 3);

      for (const rel of related) {
        relationIndex++;
        relations.push({
          id: `kw-rel-${String(relationIndex).padStart(4, '0')}`,
          keyword_id: kw.id,
          related_keyword_id: rel.id,
        });
      }
    }
  }

  return relations;
}

// ─── Module Prerequisites ───

function generateModulePrerequisites(): SeedModulePrerequisite[] {
  // Linear chain with branching at module-05 and convergence at module-09
  const prerequisites: Array<{ module_id: string; prerequisite_module_id: string }> = [
    { module_id: 'module-02', prerequisite_module_id: 'module-01' },
    { module_id: 'module-03', prerequisite_module_id: 'module-02' },
    { module_id: 'module-04', prerequisite_module_id: 'module-03' },
    { module_id: 'module-05', prerequisite_module_id: 'module-04' },
    { module_id: 'module-06', prerequisite_module_id: 'module-05' },
    { module_id: 'module-07', prerequisite_module_id: 'module-05' },
    { module_id: 'module-08', prerequisite_module_id: 'module-05' },
    { module_id: 'module-09', prerequisite_module_id: 'module-06' },
    { module_id: 'module-09', prerequisite_module_id: 'module-07' },
    { module_id: 'module-09', prerequisite_module_id: 'module-08' },
  ];

  return prerequisites.map((p, i) => ({
    id: `prereq-${String(i + 1).padStart(3, '0')}`,
    ...p,
  }));
}

// ─── Validation ───

interface ValidationError {
  type: string;
  id: string;
  message: string;
}

function validateSeedData(
  lessons: SeedLesson[],
  keywords: SeedKeyword[],
  quizzes: SeedQuiz[],
  quizQuestions: SeedQuizQuestion[],
  modules: SeedModule[],
  codeExamples: SeedCodeExample[],
  keywordRelations: SeedKeywordRelation[],
  modulePrerequisites: SeedModulePrerequisite[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Every lesson has ≥1 code block in content_json
  for (const lesson of lessons) {
    const content = JSON.parse(lesson.content_json) as LessonContent;
    const hasCodeBlock = content.sections.some((s) => s.type === 'code_block');
    if (!hasCodeBlock) {
      errors.push({
        type: 'lesson_no_code',
        id: lesson.id,
        message: `Lesson "${lesson.title}" has no code block in content_json`,
      });
    }
  }

  // 2. Every keyword has definition ≤100 chars
  for (const kw of keywords) {
    if (kw.definition.length > 100) {
      errors.push({
        type: 'keyword_definition_too_long',
        id: kw.id,
        message: `Keyword "${kw.name}" definition is ${kw.definition.length} chars (max 100)`,
      });
    }
  }

  // 3. Every quiz has ≥3 questions
  for (const quiz of quizzes) {
    const questionCount = quizQuestions.filter((q) => q.quiz_id === quiz.id).length;
    if (questionCount < 3) {
      errors.push({
        type: 'quiz_too_few_questions',
        id: quiz.id,
        message: `Quiz "${quiz.title}" has ${questionCount} questions (min 3)`,
      });
    }
  }

  // 4. Every question's correct_answer is in options_json
  for (const q of quizQuestions) {
    const options = JSON.parse(q.options_json) as string[];
    if (!options.includes(q.correct_answer)) {
      errors.push({
        type: 'question_answer_mismatch',
        id: q.id,
        message: `Question "${q.id}" correct_answer "${q.correct_answer}" not in options`,
      });
    }
  }

  // 5. All IDs are unique within their table
  const tables: Array<{ name: string; items: Array<{ id: string }> }> = [
    { name: 'modules', items: modules },
    { name: 'lessons', items: lessons },
    { name: 'keywords', items: keywords },
    { name: 'keyword_relations', items: keywordRelations },
    { name: 'code_examples', items: codeExamples },
    { name: 'quizzes', items: quizzes },
    { name: 'quiz_questions', items: quizQuestions },
    { name: 'module_prerequisites', items: modulePrerequisites },
  ];

  for (const table of tables) {
    const ids = new Set<string>();
    for (const item of table.items) {
      if (ids.has(item.id)) {
        errors.push({
          type: 'duplicate_id',
          id: item.id,
          message: `Duplicate ID "${item.id}" in table "${table.name}"`,
        });
      }
      ids.add(item.id);
    }
  }

  return errors;
}

// ─── File Writing ───

function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Main ───

function main(): void {
  console.log('🔍 Parsing markdown content from doc/ ...\n');

  // Step 1: Parse all content
  const content = parseAllContent();

  console.log(`📦 Modules: ${content.modules.length}`);
  console.log(`📖 Lessons: ${content.allLessons.length}`);
  console.log(`🔑 Keywords: ${content.allKeywords.length}`);
  console.log(`💻 Code Examples: ${content.allCodeExamples.length}`);

  // Step 2: Generate quizzes
  console.log('\n🧠 Generating quizzes...');
  const quizResult = generateQuizzes(content.allLessons, content.allKeywords);

  console.log(`📝 Quizzes: ${quizResult.quizzes.length}`);
  console.log(`❓ Questions: ${quizResult.questions.length}`);

  // Step 3: Transform to seed data format (snake_case)
  console.log('\n🔄 Transforming to seed data format...');

  const seedModules = content.modules.map(toSeedModule);
  const seedLessons = content.allLessons.map(toSeedLesson);
  const seedKeywords = content.allKeywords.map(toSeedKeyword);
  const seedCodeExamples = content.allCodeExamples.map(toSeedCodeExample);
  const seedQuizzes = quizResult.quizzes.map(toSeedQuiz);
  const seedQuizQuestions = quizResult.questions.map(toSeedQuizQuestion);

  // Step 4: Generate keyword relations
  console.log('🔗 Generating keyword relations...');
  const seedKeywordRelations = generateKeywordRelations(content.allKeywords);
  console.log(`🔗 Keyword Relations: ${seedKeywordRelations.length}`);

  // Step 5: Generate module prerequisites
  console.log('📋 Generating module prerequisites...');
  const seedModulePrerequisites = generateModulePrerequisites();
  console.log(`📋 Module Prerequisites: ${seedModulePrerequisites.length}`);

  // Step 6: Validate
  console.log('\n✅ Validating seed data...');
  const errors = validateSeedData(
    seedLessons,
    seedKeywords,
    seedQuizzes,
    seedQuizQuestions,
    seedModules,
    seedCodeExamples,
    seedKeywordRelations,
    seedModulePrerequisites
  );

  if (errors.length > 0) {
    console.warn(`\n⚠️  ${errors.length} validation warning(s):`);
    for (const err of errors) {
      console.warn(`  [${err.type}] ${err.id}: ${err.message}`);
    }
  } else {
    console.log('  All validations passed!');
  }

  // Step 7: Write JSON files
  const outputDir = path.join(process.cwd(), 'assets', 'seed-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n📁 Writing seed data to ${outputDir}/`);

  const files: Array<{ name: string; data: unknown }> = [
    { name: 'modules.json', data: seedModules },
    { name: 'lessons.json', data: seedLessons },
    { name: 'keywords.json', data: seedKeywords },
    { name: 'keyword_relations.json', data: seedKeywordRelations },
    { name: 'code_examples.json', data: seedCodeExamples },
    { name: 'quizzes.json', data: seedQuizzes },
    { name: 'quiz_questions.json', data: seedQuizQuestions },
    { name: 'module_prerequisites.json', data: seedModulePrerequisites },
  ];

  for (const file of files) {
    const filePath = path.join(outputDir, file.name);
    writeJsonFile(filePath, file.data);
    const items = Array.isArray(file.data) ? file.data.length : 0;
    console.log(`  ✓ ${file.name} (${items} records)`);
  }

  // Step 8: Print summary
  console.log('\n─── Summary ───');
  console.log(`  Modules:              ${seedModules.length}`);
  console.log(`  Lessons:              ${seedLessons.length}`);
  console.log(`  Keywords:             ${seedKeywords.length}`);
  console.log(`  Keyword Relations:    ${seedKeywordRelations.length}`);
  console.log(`  Code Examples:        ${seedCodeExamples.length}`);
  console.log(`  Quizzes:              ${seedQuizzes.length}`);
  console.log(`  Quiz Questions:       ${seedQuizQuestions.length}`);
  console.log(`  Module Prerequisites: ${seedModulePrerequisites.length}`);
  console.log(`  Validation Errors:    ${errors.length}`);
  console.log('\n✅ Seed data generation complete.');
}

main();
