/**
 * Database initialization — singleton WatermelonDB instance.
 *
 * Uses SQLiteAdapter with JSI for native APK builds.
 * JSI provides better performance by bypassing the JS bridge.
 */
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { modelClasses } from './models';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: (error) => {
    console.error('[Database] Setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses,
});
