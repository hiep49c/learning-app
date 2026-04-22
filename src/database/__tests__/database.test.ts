import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { schema } from '../schema';
import { modelClasses } from '../models';

/**
 * Tests use LokiJSAdapter since SQLiteAdapter requires native JSI
 * which is not available in the Jest test environment.
 * The production app uses SQLiteAdapter for persistent storage.
 */
function createTestDatabase(): Database {
  const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });
  return new Database({ adapter, modelClasses });
}

describe('Database initialization', () => {
  const database = createTestDatabase();

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
