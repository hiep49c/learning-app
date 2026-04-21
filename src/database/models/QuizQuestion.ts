import { Model } from '@nozbe/watermelondb';
import { field, text, json, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Relation from '@nozbe/watermelondb/Relation';
import type Quiz from './Quiz';

const sanitizeOptionsJson = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }
  return [];
};

export default class QuizQuestion extends Model {
  static table = 'quiz_questions' as const;

  static associations: Associations = {
    quizzes: { type: 'belongs_to', key: 'quiz_id' },
  };

  @immutableRelation('quizzes', 'quiz_id') quiz!: Relation<Quiz>;

  @text('question_text') questionText!: string;
  @field('question_type') questionType!: string;
  @json('options_json', sanitizeOptionsJson) optionsJson!: string[];
  @field('correct_answer') correctAnswer!: string;
  @text('explanation') explanation!: string;
  @field('related_keyword_id') relatedKeywordId!: string | null;
  @field('order_index') orderIndex!: number;
}
