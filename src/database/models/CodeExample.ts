import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type Lesson from './Lesson';

export default class CodeExample extends Model {
  static table = 'code_examples' as const;

  static associations: Associations = {
    lessons: { type: 'belongs_to', key: 'lesson_id' },
  };

  @immutableRelation('lessons', 'lesson_id') lesson!: Relation<Lesson>;

  @text('title') title!: string;
  @text('description') description!: string;
  @text('code') code!: string;
  @field('language') language!: string;
  @field('file_name') fileName!: string | null;
  @field('order_index') orderIndex!: number;
}
