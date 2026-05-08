import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type UserProfile from './UserProfile';

export default class Bookmark extends Model {
  static table = 'bookmarks' as const;

  static associations: Associations = {
    user_profiles: { type: 'belongs_to', key: 'user_id' },
  };

  @immutableRelation('user_profiles', 'user_id') user!: Relation<UserProfile>;

  @field('item_id') itemId!: string;
  @field('item_type') itemType!: string;
  @field('note') note!: string | null;

  @readonly @date('created_at') createdAt!: Date;
}
