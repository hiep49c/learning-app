import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type Query from '@nozbe/watermelondb/Query';
import type Lesson from './Lesson';
import type KeywordRelation from './KeywordRelation';

export default class Keyword extends Model {
  static table = 'keywords' as const;

  static associations: Associations = {
    lessons: { type: 'belongs_to', key: 'lesson_id' },
    keyword_relations: { type: 'has_many', foreignKey: 'keyword_id' },
  };

  @immutableRelation('lessons', 'lesson_id') lesson!: Relation<Lesson>;

  @text('name') name!: string;
  @text('definition') definition!: string;
  @text('explanation') explanation!: string;
  @field('code_example') codeExample!: string | null;
  @field('category') category!: string;

  @children('keyword_relations') keywordRelations!: Query<KeywordRelation>;
}
