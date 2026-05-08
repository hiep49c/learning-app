/**
 * QuizEvaluationService — evaluates quiz answers and calculates scores.
 *
 * Pure functions, no database access needed.
 * Each QuizQuestion already contains correctAnswer and explanation in seed data.
 *
 * Requirements: 15.2, 15.3
 */
import type QuizQuestion from '@/database/models/QuizQuestion';

// ─── Result types ───

export interface AnswerResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  relatedLessonId: string;
}

export interface QuizScore {
  correct: number;
  total: number;
  percentage: number;
}

/**
 * Evaluate a single answer against the question's correct answer.
 * Returns an AnswerResult with correctness, explanation, and related lesson.
 */
export function evaluateAnswer(
  question: QuizQuestion,
  userAnswer: string,
): AnswerResult {
  const isCorrect = userAnswer === question.correctAnswer;

  // Resolve related lesson ID: prefer the keyword's lesson, fall back to quiz's lesson
  const raw = question._raw as Record<string, unknown>;
  const relatedLessonId = raw.related_keyword_id
    ? (raw.related_keyword_id as string)
    : '';

  return {
    questionId: question.id,
    isCorrect,
    correctAnswer: question.correctAnswer,
    userAnswer,
    explanation: question.explanation,
    relatedLessonId,
  };
}

/**
 * Calculate the score from a list of answer results.
 * Returns { correct, total, percentage } where percentage is rounded.
 */
export function calculateScore(results: AnswerResult[]): QuizScore {
  const total = results.length;
  if (total === 0) {
    return { correct: 0, total: 0, percentage: 0 };
  }

  const correct = results.filter((r) => r.isCorrect).length;
  const percentage = Math.round((correct / total) * 100);

  return { correct, total, percentage };
}
