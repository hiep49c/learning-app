/**
 * Database initialization — singleton WatermelonDB instance.
 *
 * Uses LokiJSAdapter for development (works in Expo Go without native modules).
 * For production APK builds, switch to SQLiteAdapter with JSI.
 */
import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { schema } from './schema';
import { modelClasses } from './models';

const adapter = new LokiJSAdapter({
  schema,
  // Disable web workers for React Native (not available in RN environment)
  useWebWorker: false,
  useIncrementalIndexedDB: false,
});

export const database = new Database({
  adapter,
  modelClasses,
});
