import { Model } from '@nozbe/watermelondb';
import { field, json, date, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type UserProfile from './UserProfile';
import type Quiz from './Quiz';

const sanitizeAnswersJson = (raw: unknown): Record<string, string> => {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, string>;
  }
  return {};
};

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
  @json('answers_json', sanitizeAnswersJson) answersJson!: Record<string, string>;
  @date('completed_at') completedAt!: Date;
}
