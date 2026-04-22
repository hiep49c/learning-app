import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type UserProfile from './UserProfile';
import type Quiz from './Quiz';

export default class QuizAttempt extends Model {
  static table = 'quiz_attempts' as const;

  static associations: Associations = {
    user_profiles: { type: 'belongs_to', key: 'user_id' },
    quizzes: { type: 'belongs_to', key: 'quiz_id' },
  };

  @immutableRelation('user_profiles', 'user_id') user!: Relation<UserProfile>;
  @immutableRelation('quizzes', 'quiz_id') quiz!: Relation<Quiz>;

  @field('score') score!: number;
  @field('total_questions') totalQuestions!: number;
  /** Stored as JSON string in DB. Parse with JSON.parse() when reading. */
  @field('answers_json') answersJsonRaw!: string;
  @date('completed_at') completedAt!: Date;

  /** Parsed answers map. */
  get answersJson(): Record<string, string> {
    try {
      const parsed = JSON.parse(this.answersJsonRaw);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // ignore
    }
    return {};
  }
}
