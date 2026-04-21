import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type UserProfile from './UserProfile';
import type Lesson from './Lesson';

export default class LessonProgress extends Model {
  static table = 'lesson_progress' as const;

  static associations: Associations = {
    user_profiles: { type: 'belongs_to', key: 'user_id' },
    lessons: { type: 'belongs_to', key: 'lesson_id' },
  };

  @immutableRelation('user_profiles', 'user_id') user!: Relation<UserProfile>;
  @immutableRelation('lessons', 'lesson_id') lesson!: Relation<Lesson>;

  @field('is_completed') isCompleted!: boolean;
  @date('completed_at') completedAt!: Date | null;
  @field('time_spent_seconds') timeSpentSeconds!: number;
  @field('scroll_position') scrollPosition!: number;
  @date('last_accessed_at') lastAccessedAt!: Date;
}
