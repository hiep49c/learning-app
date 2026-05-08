/**
 * QuizStore — manages quiz state, answers, and result evaluation.
 *
 * Loads quiz + questions from WatermelonDB, evaluates via QuizEvaluationService,
 * and saves attempts to quiz_attempts table.
 * Uses Zustand with immer middleware.
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Q } from '@nozbe/watermelondb';

import { database } from '@/database';
import type Quiz from '@/database/models/Quiz';
import type QuizQuestion from '@/database/models/QuizQuestion';
import type QuizAttempt from '@/database/models/QuizAttempt';
import {
  evaluateAnswer,
  calculateScore,
  type QuizScore,
} from '@/services/QuizEvaluationService';
import { showToast } from '@/utils/toast';

// ─── Types ───

export interface QuizData {
  id: string;
  title: string;
  questionCount: number;
}

export interface QuizQuestionData {
  id: string;
  questionText: string;
  questionType: string;
  optionsJson: string[];
  correctAnswer: string;
  explanation: string;
  relatedKeywordId: string | null;
  orderIndex: number;
}

interface QuizState {
  currentQuiz: QuizData | null;
  questions: QuizQuestionData[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  isSubmitted: boolean;
  score: QuizScore | null;
}

interface QuizActions {
  loadQuiz: (quizId: string) => Promise<void>;
  answerQuestion: (questionId: string, answer: string) => void;
  submitQuiz: (userId: string) => Promise<void>;
  resetQuiz: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
}

// ─── Helpers ───

function toQuizData(record: Quiz): QuizData {
  return {
    id: record.id,
    title: record.title,
    questionCount: record.questionCount,
  };
}

function toQuestionData(record: QuizQuestion): QuizQuestionData {
  return {
    id: record.id,
    questionText: record.questionText,
    questionType: record.questionType,
    optionsJson: record.optionsJson,
    correctAnswer: record.correctAnswer,
    explanation: record.explanation,
    relatedKeywordId: record.relatedKeywordId,
    orderIndex: record.orderIndex,
  };
}

// ─── Store ───

export const useQuizStore = create<QuizState & QuizActions>()(
  immer((set, get) => ({
    // State
    currentQuiz: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    isSubmitted: false,
    score: null,

    // Actions
    loadQuiz: async (quizId: string): Promise<void> => {
      try {
        const quizRecord = await database.get<Quiz>('quizzes').find(quizId);
        const questionRecords = await database
          .get<QuizQuestion>('quiz_questions')
          .query(
            Q.where('quiz_id', quizId),
            Q.sortBy('order_index', Q.asc),
          )
          .fetch();

        set((state) => {
          state.currentQuiz = toQuizData(quizRecord);
          state.questions = questionRecords.map(toQuestionData);
          state.currentQuestionIndex = 0;
          state.answers = {};
          state.isSubmitted = false;
          state.score = null;
        });
      } catch (error) {
        console.error('[QuizStore] loadQuiz failed:', error);
      }
    },

    answerQuestion: (questionId: string, answer: string): void => {
      set((state) => {
        state.answers[questionId] = answer;
      });
    },

    submitQuiz: async (userId: string): Promise<void> => {
      try {
        const { currentQuiz, questions, answers } = get();
        if (!currentQuiz) return;

        // Evaluate answers using the raw QuizQuestion records for the service
        const questionRecords = await database
          .get<QuizQuestion>('quiz_questions')
          .query(
            Q.where('quiz_id', currentQuiz.id),
            Q.sortBy('order_index', Q.asc),
          )
          .fetch();

        const results = questionRecords.map((q) =>
          evaluateAnswer(q, answers[q.id] ?? ''),
        );
        const score = calculateScore(results);

        // Save attempt to quiz_attempts table
        const collection = database.get<QuizAttempt>('quiz_attempts');
        await database.write(async () => {
          await collection.create((record) => {
            const raw = record._raw as Record<string, unknown>;
            raw.user_id = userId;
            raw.quiz_id = currentQuiz.id;
            raw.score = score.percentage;
            raw.total_questions = questions.length;
            raw.answers_json = JSON.stringify(answers);
            raw.completed_at = Date.now();
          });
        });

        set((state) => {
          state.isSubmitted = true;
          state.score = score;
        });
      } catch (error) {
        console.error('[QuizStore] submitQuiz failed:', error);
        showToast('Lưu thất bại, vui lòng thử lại');
      }
    },

    resetQuiz: (): void => {
      set((state) => {
        state.currentQuestionIndex = 0;
        state.answers = {};
        state.isSubmitted = false;
        state.score = null;
      });
    },

    nextQuestion: (): void => {
      set((state) => {
        if (state.currentQuestionIndex < state.questions.length - 1) {
          state.currentQuestionIndex += 1;
        }
      });
    },

    previousQuestion: (): void => {
      set((state) => {
        if (state.currentQuestionIndex > 0) {
          state.currentQuestionIndex -= 1;
        }
      });
    },
  })),
);
