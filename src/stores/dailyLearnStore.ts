/**
 * dailyLearnStore — manages the daily vocabulary learning flow state.
 *
 * Steps: warmup → learn → deep → practice → output → review → summary
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { WordData, PracticeQuestion, DailySummaryData } from '@/services/DailyLearningService';
import {
  getWarmupCards,
  getNewWords,
  getReviewCards,
  generatePracticeQuestions,
  recordReview,
  saveDailySession,
  getDailySummary,
} from '@/services/DailyLearningService';

export type DailyStep = 'warmup' | 'learn' | 'deep' | 'practice' | 'output' | 'review' | 'summary';

const STEP_ORDER: DailyStep[] = ['warmup', 'learn', 'deep', 'practice', 'output', 'review', 'summary'];

interface DailyLearnState {
  currentStep: DailyStep;
  currentCardIndex: number;
  isLoading: boolean;
  error: string | null;

  warmupCards: WordData[];
  newWords: WordData[];
  reviewCards: WordData[];
  practiceQuestions: PracticeQuestion[];
  practiceAnswers: Record<string, string>;
  userSentences: Record<string, string>;
  summary: DailySummaryData | null;

  completedSteps: DailyStep[];
  correctCount: number;
  totalCount: number;
}

interface DailyLearnActions {
  startSession: (userId: string) => Promise<void>;
  nextStep: (userId: string) => Promise<void>;
  nextCard: () => void;
  prevCard: () => void;
  answerPractice: (questionId: string, answer: string) => void;
  submitPractice: (userId: string) => Promise<void>;
  saveUserSentence: (cardId: string, sentence: string) => void;
  reviewCard: (userId: string, cardId: string, result: 'perfect' | 'good' | 'hard' | 'forgot') => Promise<void>;
  learnMore: (userId: string) => Promise<void>;
  reset: () => void;
}

const initialState: DailyLearnState = {
  currentStep: 'warmup',
  currentCardIndex: 0,
  isLoading: false,
  error: null,
  warmupCards: [],
  newWords: [],
  reviewCards: [],
  practiceQuestions: [],
  practiceAnswers: {},
  userSentences: {},
  summary: null,
  completedSteps: [],
  correctCount: 0,
  totalCount: 0,
};

export const useDailyLearnStore = create<DailyLearnState & DailyLearnActions>()(
  immer((set, get) => ({
    ...initialState,

    startSession: async (userId: string): Promise<void> => {
      set((s) => { s.isLoading = true; s.error = null; });
      try {
        const [warmup, words, reviews] = await Promise.all([
          getWarmupCards(userId),
          getNewWords(userId, 5),
          getReviewCards(userId),
        ]);

        set((s) => {
          s.warmupCards = warmup;
          s.newWords = words;
          s.reviewCards = reviews;
          s.currentStep = warmup.length > 0 ? 'warmup' : 'learn';
          s.currentCardIndex = 0;
          s.isLoading = false;
        });
      } catch (error) {
        set((s) => {
          s.isLoading = false;
          s.error = error instanceof Error ? error.message : 'Không thể tải dữ liệu';
        });
      }
    },

    nextStep: async (userId: string): Promise<void> => {
      const state = get();
      const currentIdx = STEP_ORDER.indexOf(state.currentStep);
      const completed = [...state.completedSteps, state.currentStep];

      if (state.currentStep === 'summary') return;

      // Find next valid step
      let nextIdx = currentIdx + 1;
      while (nextIdx < STEP_ORDER.length) {
        const nextStep = STEP_ORDER[nextIdx]!;
        // Skip warmup if no warmup cards
        if (nextStep === 'warmup' && state.warmupCards.length === 0) { nextIdx++; continue; }
        // Skip review if no review cards
        if (nextStep === 'review' && state.reviewCards.length === 0) { nextIdx++; continue; }
        break;
      }

      const nextStep = STEP_ORDER[nextIdx] ?? 'summary';

      // Generate practice questions when entering practice step
      if (nextStep === 'practice') {
        const allWords = [...state.newWords, ...state.warmupCards];
        const questions = generatePracticeQuestions(allWords);
        set((s) => {
          s.practiceQuestions = questions;
          s.currentStep = 'practice';
          s.currentCardIndex = 0;
          s.completedSteps = completed;
        });
        return;
      }

      // Generate summary when entering summary step
      if (nextStep === 'summary') {
        await saveDailySession(userId, {
          newWordsCount: state.newWords.length,
          reviewedCount: state.reviewCards.length + state.warmupCards.length,
          correctCount: state.correctCount,
          totalCount: state.totalCount,
          completedSteps: [...completed, 'summary'],
        });
        const summary = await getDailySummary(userId);
        set((s) => {
          s.summary = summary;
          s.currentStep = 'summary';
          s.completedSteps = [...completed, 'summary'];
        });
        return;
      }

      set((s) => {
        s.currentStep = nextStep;
        s.currentCardIndex = 0;
        s.completedSteps = completed;
      });
    },

    nextCard: (): void => {
      set((s) => { s.currentCardIndex = s.currentCardIndex + 1; });
    },

    prevCard: (): void => {
      set((s) => {
        if (s.currentCardIndex > 0) s.currentCardIndex = s.currentCardIndex - 1;
      });
    },

    answerPractice: (questionId: string, answer: string): void => {
      set((s) => { s.practiceAnswers[questionId] = answer; });
    },

    submitPractice: async (userId: string): Promise<void> => {
      const state = get();
      let correct = 0;
      let total = 0;

      for (const q of state.practiceQuestions) {
        const userAnswer = state.practiceAnswers[q.id];
        if (userAnswer !== undefined) {
          total++;
          const isCorrect = q.type === 'fill_blank'
            ? userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
            : userAnswer === q.correctAnswer;
          if (isCorrect) correct++;
        }
      }

      set((s) => {
        s.correctCount = s.correctCount + correct;
        s.totalCount = s.totalCount + total;
      });
    },

    saveUserSentence: (cardId: string, sentence: string): void => {
      set((s) => { s.userSentences[cardId] = sentence; });
    },

    reviewCard: async (userId: string, cardId: string, result: 'perfect' | 'good' | 'hard' | 'forgot'): Promise<void> => {
      await recordReview(userId, cardId, result);
      const isCorrect = result === 'perfect' || result === 'good';
      set((s) => {
        s.totalCount = s.totalCount + 1;
        if (isCorrect) s.correctCount = s.correctCount + 1;
        s.currentCardIndex = s.currentCardIndex + 1;
      });
    },

    learnMore: async (userId: string): Promise<void> => {
      set((s) => { s.isLoading = true; });
      try {
        const words = await getNewWords(userId, 5);
        set((s) => {
          s.newWords = words;
          s.currentStep = 'learn';
          s.currentCardIndex = 0;
          s.isLoading = false;
          s.summary = null;
          s.practiceAnswers = {};
          s.userSentences = {};
          s.completedSteps = [];
        });
      } catch {
        set((s) => { s.isLoading = false; });
      }
    },

    reset: (): void => {
      set(() => ({ ...initialState }));
    },
  })),
);
