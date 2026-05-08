import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type UserProfile from './UserProfile';

export default class DailySession extends Model {
  static table = 'daily_sessions' as const;

  static associations: Associations = {
    user_profiles: { type: 'belongs_to', key: 'user_id' },
  };

  @immutableRelation('user_profiles', 'user_id') user!: Relation<UserProfile>;

  @field('session_date') sessionDate!: string;
  @field('new_words_count') newWordsCount!: number;
  @field('reviewed_count') reviewedCount!: number;
  @field('correct_count') correctCount!: number;
  @field('total_count') totalCount!: number;
  @field('completed_steps_json') completedStepsJsonRaw!: string;
  @date('completed_at') completedAt!: Date | null;
  @date('created_at') createdAt!: Date;

  get completedSteps(): string[] {
    try {
      const parsed: unknown = JSON.parse(this.completedStepsJsonRaw);
      return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
    } catch {
      return [];
    }
  }
}
