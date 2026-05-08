/**
 * SearchService — full-text search across lessons, keywords, and code examples.
 *
 * Uses WatermelonDB Q.like with Q.sanitizeLikeString for case-insensitive matching.
 * Supports both Vietnamese and English search terms by searching title + title_vi fields.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Lesson from '@/database/models/Lesson';
import type Keyword from '@/database/models/Keyword';
import type CodeExample from '@/database/models/CodeExample';
import type { SubjectId } from '@/stores/subjectStore';

// ─── Result types ───

export interface LessonSearchResult {
  id: string;
  title: string;
  titleVi: string;
  moduleId: string;
  description: string;
}

export interface KeywordSearchResult {
  id: string;
  name: string;
  definition: string;
  category: string;
  lessonId: string;
}

export interface CodeExampleSearchResult {
  id: string;
  title: string;
  description: string;
  language: string;
  lessonId: string;
}

export interface SearchResults {
  lessons: LessonSearchResult[];
  keywords: KeywordSearchResult[];
  codeExamples: CodeExampleSearchResult[];
}

const EMPTY_RESULTS: SearchResults = {
  lessons: [],
  keywords: [],
  codeExamples: [],
};

/**
 * Search across lessons (title, title_vi), keywords (name, definition),
 * and code examples (title, description).
 *
 * Returns grouped results. Returns empty results for blank queries.
 */
export async function searchAll(query: string, subject?: SubjectId): Promise<SearchResults> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return EMPTY_RESULTS;
  }

  const sanitized = Q.sanitizeLikeString(trimmed);
  const likePattern = `%${sanitized}%`;

  // Run all three searches in parallel
  const [lessons, keywords, codeExamples] = await Promise.all([
    searchLessons(likePattern, subject),
    searchKeywords(likePattern, subject),
    searchCodeExamples(likePattern, subject),
  ]);

  return { lessons, keywords, codeExamples };
}

/**
 * Search lessons by title (English) and title_vi (Vietnamese).
 */
async function searchLessons(
  likePattern: string,
  subject?: SubjectId,
): Promise<LessonSearchResult[]> {
  const textMatch = Q.or(
    Q.where('title', Q.like(likePattern)),
    Q.where('title_vi', Q.like(likePattern)),
  );
  const subjectFilter = subject === 'english'
    ? Q.where('module_id', Q.like('vocab-%'))
    : subject === 'java'
      ? Q.where('module_id', Q.notLike('vocab-%'))
      : null;

  const results = await database
    .get<Lesson>('lessons')
    .query(subjectFilter ? Q.and(textMatch, subjectFilter) : textMatch)
    .fetch();

  return results.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    titleVi: lesson.titleVi,
    moduleId: (lesson._raw as Record<string, unknown>).module_id as string,
    description: lesson.description,
  }));
}

/**
 * Search keywords by name and definition.
 */
async function searchKeywords(
  likePattern: string,
  subject?: SubjectId,
): Promise<KeywordSearchResult[]> {
  const textMatch = Q.or(
    Q.where('name', Q.like(likePattern)),
    Q.where('definition', Q.like(likePattern)),
  );
  const subjectFilter = subject === 'english'
    ? Q.where('lesson_id', Q.like('vocab-%'))
    : subject === 'java'
      ? Q.where('lesson_id', Q.notLike('vocab-%'))
      : null;

  const results = await database
    .get<Keyword>('keywords')
    .query(subjectFilter ? Q.and(textMatch, subjectFilter) : textMatch)
    .fetch();

  return results.map((kw) => ({
    id: kw.id,
    name: kw.name,
    definition: kw.definition,
    category: kw.category,
    lessonId: (kw._raw as Record<string, unknown>).lesson_id as string,
  }));
}

/**
 * Search code examples by title and description.
 */
async function searchCodeExamples(
  likePattern: string,
  subject?: SubjectId,
): Promise<CodeExampleSearchResult[]> {
  const textMatch = Q.or(
    Q.where('title', Q.like(likePattern)),
    Q.where('description', Q.like(likePattern)),
  );
  const subjectFilter = subject === 'english'
    ? Q.where('lesson_id', Q.like('vocab-%'))
    : subject === 'java'
      ? Q.where('lesson_id', Q.notLike('vocab-%'))
      : null;

  const results = await database
    .get<CodeExample>('code_examples')
    .query(subjectFilter ? Q.and(textMatch, subjectFilter) : textMatch)
    .fetch();

  return results.map((ce) => ({
    id: ce.id,
    title: ce.title,
    description: ce.description,
    language: ce.language,
    lessonId: (ce._raw as Record<string, unknown>).lesson_id as string,
  }));
}

/**
 * Return keyword names matching the query (for autocomplete suggestions).
 */
export async function getSuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const sanitized = Q.sanitizeLikeString(trimmed);
  const likePattern = `%${sanitized}%`;

  const results = await database
    .get<Keyword>('keywords')
    .query(Q.where('name', Q.like(likePattern)))
    .fetch();

  return results.map((kw) => kw.name);
}
