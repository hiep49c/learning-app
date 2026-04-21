import { database } from '../index';

describe('Database initialization', () => {
  it('exports a singleton database instance', () => {
    expect(database).toBeDefined();
    expect(database).toHaveProperty('adapter');
    expect(database).toHaveProperty('collections');
  });

  it('has the correct schema version', () => {
    expect(database.schema.version).toBe(1);
  });

  it('has all 12 tables registered', () => {
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
    ];

    const tableNames = Object.keys(database.schema.tables);
    for (const table of expectedTables) {
      expect(tableNames).toContain(table);
    }
    expect(tableNames).toHaveLength(expectedTables.length);
  });
});
