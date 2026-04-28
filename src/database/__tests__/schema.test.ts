import { schema } from '../schema';

describe('WatermelonDB Schema', () => {
  it('should have schema version 1', () => {
    expect(schema.version).toBe(2);
  });

  it('should define exactly 12 tables', () => {
    expect(Object.keys(schema.tables)).toHaveLength(15);
  });

  it('should contain all expected table names', () => {
    const expectedTables = [
      'user_profiles',
      'modules',
      'module_prerequisites',
      'lessons',
      'keywords',
      'keyword_relations',
      'code_examples',
      'quizzes',
      'quiz_questions',
      'lesson_progress',
      'quiz_attempts',
      'bookmarks',
      'vocab_cards',
      'vocab_reviews',
      'daily_sessions',
    ];

    const tableNames = Object.keys(schema.tables);
    for (const name of expectedTables) {
      expect(tableNames).toContain(name);
    }
  });

  describe('user_profiles table', () => {
    const table = schema.tables['user_profiles'];

    it('should have correct columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'name', type: 'string' }),
          expect.objectContaining({ name: 'avatar_index', type: 'number' }),
          expect.objectContaining({ name: 'pin_hash', type: 'string', isOptional: true }),
          expect.objectContaining({ name: 'created_at', type: 'number' }),
        ]),
      );
    });
  });

  describe('modules table', () => {
    const table = schema.tables['modules'];

    it('should have correct columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'title', type: 'string' }),
          expect.objectContaining({ name: 'title_vi', type: 'string' }),
          expect.objectContaining({ name: 'description', type: 'string' }),
          expect.objectContaining({ name: 'order_index', type: 'number', isIndexed: true }),
          expect.objectContaining({ name: 'difficulty_level', type: 'string' }),
          expect.objectContaining({ name: 'icon_name', type: 'string' }),
          expect.objectContaining({ name: 'lesson_count', type: 'number' }),
        ]),
      );
    });
  });

  describe('module_prerequisites table', () => {
    const table = schema.tables['module_prerequisites'];

    it('should have indexed foreign key columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'module_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'prerequisite_module_id', type: 'string', isIndexed: true }),
        ]),
      );
    });
  });

  describe('lessons table', () => {
    const table = schema.tables['lessons'];

    it('should have correct columns with indexes', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'module_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'title', type: 'string' }),
          expect.objectContaining({ name: 'title_vi', type: 'string' }),
          expect.objectContaining({ name: 'description', type: 'string' }),
          expect.objectContaining({ name: 'order_index', type: 'number', isIndexed: true }),
          expect.objectContaining({ name: 'content_json', type: 'string' }),
          expect.objectContaining({ name: 'source_file', type: 'string' }),
          expect.objectContaining({ name: 'estimated_minutes', type: 'number' }),
        ]),
      );
    });
  });

  describe('keywords table', () => {
    const table = schema.tables['keywords'];

    it('should have correct columns with indexes and optional fields', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'lesson_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'name', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'definition', type: 'string' }),
          expect.objectContaining({ name: 'explanation', type: 'string' }),
          expect.objectContaining({ name: 'code_example', type: 'string', isOptional: true }),
          expect.objectContaining({ name: 'category', type: 'string', isIndexed: true }),
        ]),
      );
    });
  });

  describe('keyword_relations table', () => {
    const table = schema.tables['keyword_relations'];

    it('should have indexed columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'keyword_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'related_keyword_id', type: 'string', isIndexed: true }),
        ]),
      );
    });
  });

  describe('code_examples table', () => {
    const table = schema.tables['code_examples'];

    it('should have correct columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'lesson_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'title', type: 'string' }),
          expect.objectContaining({ name: 'description', type: 'string' }),
          expect.objectContaining({ name: 'code', type: 'string' }),
          expect.objectContaining({ name: 'language', type: 'string' }),
          expect.objectContaining({ name: 'file_name', type: 'string', isOptional: true }),
          expect.objectContaining({ name: 'order_index', type: 'number' }),
        ]),
      );
    });
  });

  describe('quizzes table', () => {
    const table = schema.tables['quizzes'];

    it('should have correct columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'lesson_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'title', type: 'string' }),
          expect.objectContaining({ name: 'question_count', type: 'number' }),
        ]),
      );
    });
  });

  describe('quiz_questions table', () => {
    const table = schema.tables['quiz_questions'];

    it('should have correct columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'quiz_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'question_text', type: 'string' }),
          expect.objectContaining({ name: 'question_type', type: 'string' }),
          expect.objectContaining({ name: 'options_json', type: 'string' }),
          expect.objectContaining({ name: 'correct_answer', type: 'string' }),
          expect.objectContaining({ name: 'explanation', type: 'string' }),
          expect.objectContaining({ name: 'related_keyword_id', type: 'string', isOptional: true }),
          expect.objectContaining({ name: 'order_index', type: 'number' }),
        ]),
      );
    });
  });

  describe('lesson_progress table', () => {
    const table = schema.tables['lesson_progress'];

    it('should have correct columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'user_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'lesson_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'is_completed', type: 'boolean' }),
          expect.objectContaining({ name: 'completed_at', type: 'number', isOptional: true }),
          expect.objectContaining({ name: 'time_spent_seconds', type: 'number' }),
          expect.objectContaining({ name: 'scroll_position', type: 'number' }),
          expect.objectContaining({ name: 'last_accessed_at', type: 'number' }),
        ]),
      );
    });
  });

  describe('quiz_attempts table', () => {
    const table = schema.tables['quiz_attempts'];

    it('should have correct columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'user_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'quiz_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'score', type: 'number' }),
          expect.objectContaining({ name: 'total_questions', type: 'number' }),
          expect.objectContaining({ name: 'answers_json', type: 'string' }),
          expect.objectContaining({ name: 'completed_at', type: 'number' }),
        ]),
      );
    });
  });

  describe('bookmarks table', () => {
    const table = schema.tables['bookmarks'];

    it('should have correct columns', () => {
      const columns = table!.columnArray;
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'user_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'item_id', type: 'string', isIndexed: true }),
          expect.objectContaining({ name: 'item_type', type: 'string' }),
          expect.objectContaining({ name: 'note', type: 'string', isOptional: true }),
          expect.objectContaining({ name: 'created_at', type: 'number' }),
        ]),
      );
    });
  });
});
