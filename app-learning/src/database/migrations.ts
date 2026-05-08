import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'vocab_cards',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'keyword_id', type: 'string', isIndexed: true },
            { name: 'word', type: 'string', isIndexed: true },
            { name: 'repetitions', type: 'number' },
            { name: 'ease_factor', type: 'number' },
            { name: 'interval_days', type: 'number' },
            { name: 'next_review_at', type: 'number', isIndexed: true },
            { name: 'last_reviewed_at', type: 'number', isOptional: true },
            { name: 'status', type: 'string', isIndexed: true },
            { name: 'created_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'vocab_reviews',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'card_id', type: 'string', isIndexed: true },
            { name: 'quality', type: 'number' },
            { name: 'reviewed_at', type: 'number', isIndexed: true },
          ],
        }),
        createTable({
          name: 'daily_sessions',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'session_date', type: 'string', isIndexed: true },
            { name: 'new_words_count', type: 'number' },
            { name: 'reviewed_count', type: 'number' },
            { name: 'correct_count', type: 'number' },
            { name: 'total_count', type: 'number' },
            { name: 'completed_steps_json', type: 'string' },
            { name: 'completed_at', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
