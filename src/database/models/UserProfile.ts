import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Query from '@nozbe/watermelondb/Query';
import type LessonProgress from './LessonProgress';
import type QuizAttempt from './QuizAttempt';
import type Bookmark from './Bookmark';

export default class UserProfile extends Model {
  static table = 'user_profiles' as const;

  static associations: Associations = {
    lesson_progress: { type: 'has_many', foreignKey: 'user_id' },
    quiz_attempts: { type: 'has_many', foreignKey: 'user_id' },
    bookmarks: { type: 'has_many', foreignKey: 'user_id' },
  };

  @field('name') name!: string;
  @field('avatar_index') avatarIndex!: number;
  @field('pin_hash') pinHash!: string | null;

  @readonly @date('created_at') createdAt!: Date;

  @children('lesson_progress') lessonProgress!: Query<LessonProgress>;
  @children('quiz_attempts') quizAttempts!: Query<QuizAttempt>;
  @children('bookmarks') bookmarks!: Query<Bookmark>;
}
