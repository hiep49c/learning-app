import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type Quiz from './Quiz';

export default class QuizQuestion extends Model {
  static table = 'quiz_questions' as const;

  static associations: Associations = {
    quizzes: { type: 'belongs_to', key: 'quiz_id' },
  };

  @immutableRelation('quizzes', 'quiz_id') quiz!: Relation<Quiz>;

  @text('question_text') questionText!: string;
  @field('question_type') questionType!: string;
  /** Stored as JSON string in DB. Parse with JSON.parse() when reading. */
  @field('options_json') optionsJsonRaw!: string;
  @field('correct_answer') correctAnswer!: string;
  @text('explanation') explanation!: string;
  @field('related_keyword_id') relatedKeywordId!: string | null;
  @field('order_index') orderIndex!: number;

  /** Parsed options array. */
  get optionsJson(): string[] {
    try {
      const parsed = JSON.parse(this.optionsJsonRaw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      // ignore
    }
    return [];
  }
}
