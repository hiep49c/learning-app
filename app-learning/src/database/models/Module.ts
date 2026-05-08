import { Model } from '@nozbe/watermelondb';
import { field, text, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Query from '@nozbe/watermelondb/Query';
import type Lesson from './Lesson';
import type ModulePrerequisite from './ModulePrerequisite';

export default class Module extends Model {
  static table = 'modules' as const;

  static associations: Associations = {
    lessons: { type: 'has_many', foreignKey: 'module_id' },
    module_prerequisites: { type: 'has_many', foreignKey: 'module_id' },
  };

  @text('title') title!: string;
  @text('title_vi') titleVi!: string;
  @text('description') description!: string;
  @field('order_index') orderIndex!: number;
  @field('difficulty_level') difficultyLevel!: string;
  @field('icon_name') iconName!: string;
  @field('lesson_count') lessonCount!: number;

  @children('lessons') lessons!: Query<Lesson>;
  @children('module_prerequisites') prerequisites!: Query<ModulePrerequisite>;
}
