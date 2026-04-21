import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { DatabaseProvider, useDatabase } from '../DatabaseProvider';
import { schema } from '../schema';
import { modelClasses } from '../models';

function createTestDatabase(): Database {
  const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });
  return new Database({ adapter, modelClasses });
}

function DatabaseConsumer() {
  const db = useDatabase();
  return <Text testID="db-status">{db ? 'connected' : 'none'}</Text>;
}

describe('DatabaseProvider', () => {
  it('provides the database instance to children via useDatabase', () => {
    const testDb = createTestDatabase();
    const { getByTestId } = render(
      <DatabaseProvider testDatabase={testDb}>
        <DatabaseConsumer />
      </DatabaseProvider>,
    );

    expect(getByTestId('db-status').props.children).toBe('connected');
  });

  it('throws when useDatabase is called outside of DatabaseProvider', () => {
    // Suppress console.error for the expected error boundary
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<DatabaseConsumer />);
    }).toThrow('useDatabase must be used within a <DatabaseProvider>');

    spy.mockRestore();
  });

  it('uses the testDatabase prop when provided', () => {
    const testDb = createTestDatabase();
    const { getByTestId } = render(
      <DatabaseProvider testDatabase={testDb}>
        <DatabaseConsumer />
      </DatabaseProvider>,
    );

    expect(getByTestId('db-status').props.children).toBe('connected');
  });
});
