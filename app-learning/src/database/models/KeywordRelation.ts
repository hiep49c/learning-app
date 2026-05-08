import { Model } from '@nozbe/watermelondb';
import { immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type Keyword from './Keyword';

export default class KeywordRelation extends Model {
  static table = 'keyword_relations' as const;

  static associations: Associations = {
    keywords: { type: 'belongs_to', key: 'keyword_id' },
  };

  @immutableRelation('keywords', 'keyword_id') keyword!: Relation<Keyword>;
  @immutableRelation('keywords', 'related_keyword_id') relatedKeyword!: Relation<Keyword>;
}
