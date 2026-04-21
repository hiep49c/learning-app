import { Model } from '@nozbe/watermelondb';
import { field, text, immutableRelation, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type Query from '@nozbe/watermelondb/Query';
import type Lesson from './Lesson';
import type QuizQuestion from './QuizQuestion';

export default class Quiz extends Model {
  static table = 'quizzes' as const;

  static associations: Associations = {
    lessons: { type: 'belongs_to', key: 'lesson_id' },
    quiz_questions: { type: 'has_many', foreignKey: 'quiz_id' },
  };

  @immutableRelation('lessons', 'lesson_id') lesson!: Relation<Lesson>;

  @text('title') title!: string;
  @field('question_count') questionCount!: number;

  @children('quiz_questions') questions!: Query<QuizQuestion>;
}
