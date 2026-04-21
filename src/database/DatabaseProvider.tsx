/**
 * DatabaseProvider — React context that provides the WatermelonDB instance
 * to the component tree.
 *
 * Usage:
 *   <DatabaseProvider>
 *     <App />
 *   </DatabaseProvider>
 *
 * Access via hook:
 *   const db = useDatabase();
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { Database } from '@nozbe/watermelondb';

import { database } from './index';

// ─── Context ─────────────────────────────────────────────────────────────────

const DatabaseContext = createContext<Database | null>(null);

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Access the WatermelonDB database instance from any component
 * inside `<DatabaseProvider>`.
 *
 * @throws if called outside of DatabaseProvider.
 */
export function useDatabase(): Database {
  const db = useContext(DatabaseContext);
  if (db === null) {
    throw new Error(
      'useDatabase must be used within a <DatabaseProvider>. ' +
        'Wrap your app in <DatabaseProvider> before calling useDatabase().',
    );
  }
  return db;
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface DatabaseProviderProps {
  children: React.ReactNode;
  /** Override the default database instance (useful for testing). */
  testDatabase?: Database;
}

export function DatabaseProvider({ children, testDatabase }: DatabaseProviderProps) {
  const db = useMemo(() => testDatabase ?? database, [testDatabase]);

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
}
