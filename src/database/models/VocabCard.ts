import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type Query from '@nozbe/watermelondb/Query';
import type UserProfile from './UserProfile';
import type Keyword from './Keyword';
import type VocabReview from './VocabReview';

export default class VocabCard extends Model {
  static table = 'vocab_cards' as const;

  static associations: Associations = {
    user_profiles: { type: 'belongs_to', key: 'user_id' },
    keywords: { type: 'belongs_to', key: 'keyword_id' },
    vocab_reviews: { type: 'has_many', foreignKey: 'card_id' },
  };

  @immutableRelation('user_profiles', 'user_id') user!: Relation<UserProfile>;
  @immutableRelation('keywords', 'keyword_id') keyword!: Relation<Keyword>;

  @field('word') word!: string;
  @field('repetitions') repetitions!: number;
  @field('ease_factor') easeFactor!: number;
  @field('interval_days') intervalDays!: number;
  @date('next_review_at') nextReviewAt!: Date;
  @date('last_reviewed_at') lastReviewedAt!: Date | null;
  @field('status') status!: string;
  @date('created_at') createdAt!: Date;

  @children('vocab_reviews') reviews!: Query<VocabReview>;
}
