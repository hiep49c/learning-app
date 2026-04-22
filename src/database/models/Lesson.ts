import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type Query from '@nozbe/watermelondb/Query';
import type Module from './Module';
import type Keyword from './Keyword';
import type CodeExample from './CodeExample';
import type Quiz from './Quiz';
import type LessonProgress from './LessonProgress';

export default class Lesson extends Model {
  static table = 'lessons' as const;

  static associations: Associations = {
    modules: { type: 'belongs_to', key: 'module_id' },
    keywords: { type: 'has_many', foreignKey: 'lesson_id' },
    code_examples: { type: 'has_many', foreignKey: 'lesson_id' },
    quizzes: { type: 'has_many', foreignKey: 'lesson_id' },
    lesson_progress: { type: 'has_many', foreignKey: 'lesson_id' },
  };

  @immutableRelation('modules', 'module_id') module!: Relation<Module>;

  @text('title') title!: string;
  @text('title_vi') titleVi!: string;
  @text('description') description!: string;
  @field('order_index') orderIndex!: number;
  /** Stored as JSON string in DB. Parse with JSON.parse() when reading. */
  @field('content_json') contentJsonRaw!: string;
  @field('source_file') sourceFile!: string;
  @field('estimated_minutes') estimatedMinutes!: number;

  @children('keywords') keywords!: Query<Keyword>;
  @children('code_examples') codeExamples!: Query<CodeExample>;
  @children('quizzes') quizzes!: Query<Quiz>;
  @children('lesson_progress') lessonProgress!: Query<LessonProgress>;
}
