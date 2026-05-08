/**
 * Property 2: All lessons contain at least one code block
 *
 * For any lesson in the database, verify parsed `content_json` contains
 * at least one section of type `code_block`.
 *
 * Feature: java-spring-course-package, Property 2: All lessons contain at least one code block
 *
 * **Validates: Requirements 2.2, 3.2, 4.2**
 */
import fc from 'fast-check';

interface ContentSection {
  type:
    | 'heading'
    | 'paragraph'
    | 'code_block'
    | 'table'
    | 'list'
    | 'keyword_ref'
    | 'diagram';
  level?: number;
  text?: string;
  code?: string;
  language?: string;
  fileName?: string;
  rows?: string[][];
  headers?: string[];
  items?: string[];
  ordered?: boolean;
  keywordId?: string;
  children?: ContentSection[];
}

interface LessonContent {
  sections: ContentSection[];
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
const seedLessons: SeedLesson[] = require('../../../assets/seed-data/lessons.json');

describe('Feature: java-spring-course-package, Property 2: All lessons contain at least one code block', () => {
  it('Property 2: every lesson content_json contains at least one code_block section', () => {
    // Build an arbitrary that picks any lesson from the seed data
    const lessonArb = fc.constantFrom(...seedLessons);

    fc.assert(
      fc.property(lessonArb, (lesson: SeedLesson) => {
        // Parse the content_json field
        const content: LessonContent = JSON.parse(lesson.content_json);

        // Verify sections array exists and is non-empty
        expect(content.sections).toBeDefined();
        expect(Array.isArray(content.sections)).toBe(true);
        expect(content.sections.length).toBeGreaterThan(0);

        // Verify at least one section has type 'code_block'
        const codeBlocks = content.sections.filter(
          (section) => section.type === 'code_block'
        );

        expect(codeBlocks.length).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });
});
