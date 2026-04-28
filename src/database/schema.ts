import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    // ─── User Profiles ───
    tableSchema({
      name: 'user_profiles',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'avatar_index', type: 'number' },
        { name: 'pin_hash', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ─── Course Structure ───
    tableSchema({
      name: 'modules',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'title_vi', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'order_index', type: 'number', isIndexed: true },
        { name: 'difficulty_level', type: 'string' },
        { name: 'icon_name', type: 'string' },
        { name: 'lesson_count', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'module_prerequisites',
      columns: [
        { name: 'module_id', type: 'string', isIndexed: true },
        { name: 'prerequisite_module_id', type: 'string', isIndexed: true },
      ],
    }),

    tableSchema({
      name: 'lessons',
      columns: [
        { name: 'module_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'title_vi', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'order_index', type: 'number', isIndexed: true },
        { name: 'content_json', type: 'string' },
        { name: 'source_file', type: 'string' },
        { name: 'estimated_minutes', type: 'number' },
      ],
    }),

    // ─── Keywords ───
    tableSchema({
      name: 'keywords',
      columns: [
        { name: 'lesson_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'definition', type: 'string' },
        { name: 'explanation', type: 'string' },
        { name: 'code_example', type: 'string', isOptional: true },
        { name: 'category', type: 'string', isIndexed: true },
      ],
    }),

    tableSchema({
      name: 'keyword_relations',
      columns: [
        { name: 'keyword_id', type: 'string', isIndexed: true },
        { name: 'related_keyword_id', type: 'string', isIndexed: true },
      ],
    }),

    // ─── Code Examples ───
    tableSchema({
      name: 'code_examples',
      columns: [
        { name: 'lesson_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'code', type: 'string' },
        { name: 'language', type: 'string' },
        { name: 'file_name', type: 'string', isOptional: true },
        { name: 'order_index', type: 'number' },
      ],
    }),

    // ─── Quizzes ───
    tableSchema({
      name: 'quizzes',
      columns: [
        { name: 'lesson_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'question_count', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'quiz_questions',
      columns: [
        { name: 'quiz_id', type: 'string', isIndexed: true },
        { name: 'question_text', type: 'string' },
        { name: 'question_type', type: 'string' },
        { name: 'options_json', type: 'string' },
        { name: 'correct_answer', type: 'string' },
        { name: 'explanation', type: 'string' },
        { name: 'related_keyword_id', type: 'string', isOptional: true },
        { name: 'order_index', type: 'number' },
      ],
    }),

    // ─── User Progress ───
    tableSchema({
      name: 'lesson_progress',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'lesson_id', type: 'string', isIndexed: true },
        { name: 'is_completed', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'time_spent_seconds', type: 'number' },
        { name: 'scroll_position', type: 'number' },
        { name: 'last_accessed_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'quiz_attempts',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'quiz_id', type: 'string', isIndexed: true },
        { name: 'score', type: 'number' },
        { name: 'total_questions', type: 'number' },
        { name: 'answers_json', type: 'string' },
        { name: 'completed_at', type: 'number' },
      ],
    }),

    // ─── Bookmarks ───
    tableSchema({
      name: 'bookmarks',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'item_id', type: 'string', isIndexed: true },
        { name: 'item_type', type: 'string' },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ─── Spaced Repetition (SRS) ───
    tableSchema({
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

    tableSchema({
      name: 'vocab_reviews',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'card_id', type: 'string', isIndexed: true },
        { name: 'quality', type: 'number' },
        { name: 'reviewed_at', type: 'number', isIndexed: true },
      ],
    }),

    tableSchema({
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
});
