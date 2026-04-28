/**
 * Property 3: Keyword entry completeness
 *
 * For any keyword entry in the database, it SHALL have a non-empty `name`,
 * a `definition` of at most 100 characters, a non-empty `explanation`,
 * and a valid `lesson_id` referencing an existing lesson.
 *
 * Feature: java-spring-course-package, Property 3: Keyword entry completeness
 *
 * **Validates: Requirements 11.1**
 */
import fc from 'fast-check';

interface SeedKeyword {
  id: string;
  lesson_id: string;
  name: string;
  definition: string;
  explanation: string;
  code_example: string | null;
  category: string;
}

interface SeedLesson {
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

// Load seed data once
const seedKeywords: SeedKeyword[] = require('../../../assets/seed-data/keywords.json');
const seedLessons: SeedLesson[] = require('../../../assets/seed-data/lessons.json');

// Build a set of valid lesson IDs for fast lookup
const validLessonIds = new Set(seedLessons.map((lesson) => lesson.id));

describe('Feature: java-spring-course-package, Property 3: Keyword entry completeness', () => {
  it('Property 3: every keyword has non-empty name, definition ≤ 100 chars, non-empty explanation, and valid lesson_id', () => {
    // Build an arbitrary that picks any keyword from the seed data
    const keywordArb = fc.constantFrom(...seedKeywords);

    fc.assert(
      fc.property(keywordArb, (keyword: SeedKeyword) => {
        // Verify name is non-empty
        expect(typeof keyword.name).toBe('string');
        expect(keyword.name.trim().length).toBeGreaterThan(0);

        // Verify definition is non-empty and ≤ 100 characters
        expect(typeof keyword.definition).toBe('string');
        expect(keyword.definition.trim().length).toBeGreaterThan(0);
        expect(keyword.definition.length).toBeLessThanOrEqual(100);

        // Verify explanation is non-empty
        expect(typeof keyword.explanation).toBe('string');
        expect(keyword.explanation.trim().length).toBeGreaterThan(0);

        // Verify lesson_id references an existing lesson
        expect(typeof keyword.lesson_id).toBe('string');
        expect(validLessonIds.has(keyword.lesson_id)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
