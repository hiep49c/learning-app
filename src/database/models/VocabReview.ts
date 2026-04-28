import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type UserProfile from './UserProfile';
import type VocabCard from './VocabCard';

export default class VocabReview extends Model {
  static table = 'vocab_reviews' as const;

  static associations: Associations = {
    user_profiles: { type: 'belongs_to', key: 'user_id' },
    vocab_cards: { type: 'belongs_to', key: 'card_id' },
  };

  @immutableRelation('user_profiles', 'user_id') user!: Relation<UserProfile>;
  @immutableRelation('vocab_cards', 'card_id') card!: Relation<VocabCard>;

  @field('quality') quality!: number;
  @date('reviewed_at') reviewedAt!: Date;
}
