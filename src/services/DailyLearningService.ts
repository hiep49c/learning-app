/**
 * DailyLearningService — orchestrates the daily vocabulary learning flow.
 *
 * Responsibilities:
 * - Fetch warm-up cards (due for review)
 * - Select new words for today
 * - Generate practice questions from learned words
 * - Record review results with SM-2
 * - Track daily session progress
 * - Ensure vocab_cards exist for keywords (lazy initialization)
 */
import { Q } from '@nozbe/watermelondb';
import type { Model } from '@nozbe/watermelondb';

import { database } from '@/database';
import type VocabCard from '@/database/models/VocabCard';
import type Keyword from '@/database/models/Keyword';
import type DailySession from '@/database/models/DailySession';
import {
  calculateNextReview,
  getInitialSM2Values,
  mapToQuality,
} from './SpacedRepetitionService';

// ─── Types ───

export interface WordData {
  cardId: string;
  keywordId: string;
  word: string;
  ipa: string;
  meaningVi: string;
  meaningEn: string;
  example: string;
  exampleVi: string;
  collocations: string;
  synonyms: string;
  antonyms: string;
  category: string;
}

export interface PracticeQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'sentence_order';
  word: string;
  question: string;
  options: string[];
  correctAnswer: string;
  cardId: string;
}

export interface DailySummaryData {
  newWordsCount: number;
  reviewedCount: number;
  correctCount: number;
  totalCount: number;
  streak: number;
  sessionDate: string;
}

type ReviewResult = 'perfect' | 'good' | 'hard' | 'forgot';

// ─── Helpers: parse keyword fields ───

function parseIpa(explanation: string): string {
  const match = explanation.match(/Phát âm:\s*(.+)/);
  return match?.[1]?.trim() ?? '';
}

function parseField(explanation: string, label: string): string {
  const match = explanation.match(new RegExp(`${label}:\\s*(.+)`));
  return match?.[1]?.trim() ?? '';
}

function parseExample(codeExample: string | null): { en: string; vi: string } {
  if (!codeExample) return { en: '', vi: '' };
  const parts = codeExample.split('---');
  return {
    en: parts[0]?.trim() ?? '',
    vi: parts[1]?.trim() ?? '',
  };
}

function parseMeaning(definition: string): { vi: string; en: string } {
  const parts = definition.split('—');
  return {
    vi: parts[0]?.trim() ?? '',
    en: parts[1]?.trim() ?? definition,
  };
}

function keywordToWordData(keyword: Keyword, cardId: string): WordData {
  const raw = keyword._raw as Record<string, unknown>;
  const explanation = (raw.explanation as string) ?? '';
  const definition = (raw.definition as string) ?? '';
  const codeExample = (raw.code_example as string) ?? null;
  const example = parseExample(codeExample);
  const meaning = parseMeaning(definition);

  return {
    cardId,
    keywordId: keyword.id,
    word: keyword.name,
    ipa: parseIpa(explanation),
    meaningVi: meaning.vi,
    meaningEn: meaning.en,
    example: example.en,
    exampleVi: example.vi,
    collocations: parseField(explanation, 'Collocations'),
    synonyms: parseField(explanation, 'Synonyms'),
    antonyms: parseField(explanation, 'Antonyms'),
    category: (raw.category as string) ?? '',
  };
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

// ─── Core Service Functions ───

/**
 * Ensure vocab_cards exist for a user. Creates cards for keywords that don't have one yet.
 * Called lazily when starting a daily session.
 */
export async function ensureVocabCards(userId: string, limit: number = 50): Promise<number> {
  // Find vocab keywords that don't have a card yet for this user
  const existingCards = await database
    .get<VocabCard>('vocab_cards')
    .query(Q.where('user_id', userId))
    .fetch();

  const existingKeywordIds = new Set(
    existingCards.map((c) => (c._raw as Record<string, unknown>).keyword_id as string),
  );

  // Get vocab keywords (those with lesson_id starting with 'vocab-')
  const allVocabKeywords = await database
    .get<Keyword>('keywords')
    .query(Q.where('lesson_id', Q.like('vocab-%')))
    .fetch();

  const newKeywords = allVocabKeywords.filter((k) => !existingKeywordIds.has(k.id));
  if (newKeywords.length === 0) return 0;

  const toCreate = newKeywords.slice(0, limit);
  const sm2 = getInitialSM2Values();
  const now = Date.now();

  await database.write(async () => {
    const batch = toCreate.map((kw) =>
      database.get<Model>('vocab_cards').prepareCreate((record) => {
        const raw = record._raw as Record<string, unknown>;
        raw.user_id = userId;
        raw.keyword_id = kw.id;
        raw.word = kw.name;
        raw.repetitions = sm2.repetitions;
        raw.ease_factor = sm2.easeFactor;
        raw.interval_days = sm2.intervalDays;
        raw.next_review_at = now;
        raw.last_reviewed_at = null;
        raw.status = 'new';
        raw.created_at = now;
      }),
    );
    await database.batch(...batch);
  });

  return toCreate.length;
}

/**
 * Get warm-up cards — words due for review (max 10).
 */
export async function getWarmupCards(userId: string): Promise<WordData[]> {
  const now = Date.now();
  const dueCards = await database
    .get<VocabCard>('vocab_cards')
    .query(
      Q.where('user_id', userId),
      Q.where('status', Q.notEq('new')),
      Q.where('next_review_at', Q.lte(now)),
      Q.sortBy('next_review_at', Q.asc),
      Q.take(10),
    )
    .fetch();

  return resolveCardsToWordData(dueCards);
}

/**
 * Get new words for today's learning session.
 */
export async function getNewWords(userId: string, count: number = 10): Promise<WordData[]> {
  // First ensure we have enough cards
  await ensureVocabCards(userId, count * 2);

  const newCards = await database
    .get<VocabCard>('vocab_cards')
    .query(
      Q.where('user_id', userId),
      Q.where('status', 'new'),
      Q.take(count),
    )
    .fetch();

  return resolveCardsToWordData(newCards);
}

/**
 * Get cards due for spaced repetition review.
 */
export async function getReviewCards(userId: string): Promise<WordData[]> {
  const now = Date.now();
  const dueCards = await database
    .get<VocabCard>('vocab_cards')
    .query(
      Q.where('user_id', userId),
      Q.where('status', Q.notEq('new')),
      Q.where('next_review_at', Q.lte(now)),
      Q.sortBy('next_review_at', Q.asc),
      Q.take(20),
    )
    .fetch();

  return resolveCardsToWordData(dueCards);
}

/**
 * Generate practice questions from a set of words.
 */
export function generatePracticeQuestions(words: WordData[]): PracticeQuestion[] {
  if (words.length < 2) return [];

  const questions: PracticeQuestion[] = [];
  const shuffled = shuffleArray(words);

  for (const word of shuffled) {
    // Multiple choice: "What does X mean?"
    const otherWords = words.filter((w) => w.word !== word.word);
    const distractors = shuffleArray(otherWords).slice(0, 3).map((w) => w.meaningVi);
    const options = shuffleArray([word.meaningVi, ...distractors]);

    questions.push({
      id: `mc-${word.cardId}`,
      type: 'multiple_choice',
      word: word.word,
      question: `"${word.word}" nghĩa là gì?`,
      options,
      correctAnswer: word.meaningVi,
      cardId: word.cardId,
    });

    // Fill in the blank (if example exists)
    if (word.example) {
      const blank = word.example.replace(
        new RegExp(`\\b${word.word}\\b`, 'i'),
        '______',
      );
      if (blank !== word.example) {
        questions.push({
          id: `fb-${word.cardId}`,
          type: 'fill_blank',
          word: word.word,
          question: blank,
          options: [],
          correctAnswer: word.word,
          cardId: word.cardId,
        });
      }
    }
  }

  return shuffleArray(questions);
}

/**
 * Record a review result for a card — updates SM-2 data.
 */
export async function recordReview(
  userId: string,
  cardId: string,
  result: ReviewResult,
): Promise<void> {
  const quality = mapToQuality(result);
  const card = await database.get<VocabCard>('vocab_cards').find(cardId);
  const raw = card._raw as Record<string, unknown>;

  const sm2Result = calculateNextReview({
    quality,
    repetitions: raw.repetitions as number,
    easeFactor: raw.ease_factor as number,
    intervalDays: raw.interval_days as number,
  });

  const now = Date.now();

  await database.write(async () => {
    await card.update(() => {
      const r = card._raw as Record<string, unknown>;
      r.repetitions = sm2Result.repetitions;
      r.ease_factor = sm2Result.easeFactor;
      r.interval_days = sm2Result.intervalDays;
      r.next_review_at = sm2Result.nextReviewAt;
      r.last_reviewed_at = now;
      r.status = quality >= 3 ? 'learning' : 'relearn';
    });

    // Record review history
    await database.get<Model>('vocab_reviews').create((record) => {
      const r = record._raw as Record<string, unknown>;
      r.user_id = userId;
      r.card_id = cardId;
      r.quality = quality;
      r.reviewed_at = now;
    });
  });
}

/**
 * Save or update daily session progress.
 */
export async function saveDailySession(
  userId: string,
  data: {
    newWordsCount: number;
    reviewedCount: number;
    correctCount: number;
    totalCount: number;
    completedSteps: string[];
  },
): Promise<void> {
  const today = getTodayDateString();
  const existing = await database
    .get<DailySession>('daily_sessions')
    .query(Q.where('user_id', userId), Q.where('session_date', today))
    .fetch();

  const stepsJson = JSON.stringify(data.completedSteps);

  await database.write(async () => {
    if (existing.length > 0) {
      const session = existing[0]!;
      await session.update(() => {
        const raw = session._raw as Record<string, unknown>;
        raw.new_words_count = data.newWordsCount;
        raw.reviewed_count = data.reviewedCount;
        raw.correct_count = data.correctCount;
        raw.total_count = data.totalCount;
        raw.completed_steps_json = stepsJson;
        if (data.completedSteps.includes('summary')) {
          raw.completed_at = Date.now();
        }
      });
    } else {
      await database.get<Model>('daily_sessions').create((record) => {
        const raw = record._raw as Record<string, unknown>;
        raw.user_id = userId;
        raw.session_date = today;
        raw.new_words_count = data.newWordsCount;
        raw.reviewed_count = data.reviewedCount;
        raw.correct_count = data.correctCount;
        raw.total_count = data.totalCount;
        raw.completed_steps_json = stepsJson;
        raw.completed_at = null;
        raw.created_at = Date.now();
      });
    }
  });
}

/**
 * Get daily summary including streak.
 */
export async function getDailySummary(userId: string): Promise<DailySummaryData> {
  const today = getTodayDateString();

  const todaySession = await database
    .get<DailySession>('daily_sessions')
    .query(Q.where('user_id', userId), Q.where('session_date', today))
    .fetch();

  const session = todaySession[0];
  const raw = session ? (session._raw as Record<string, unknown>) : undefined;

  // Calculate streak
  const allSessions = await database
    .get<DailySession>('daily_sessions')
    .query(
      Q.where('user_id', userId),
      Q.sortBy('session_date', Q.desc),
      Q.take(60),
    )
    .fetch();

  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 60; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    const found = allSessions.some(
      (s) => (s._raw as Record<string, unknown>).session_date === dateStr,
    );
    if (found) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    newWordsCount: (raw?.new_words_count as number) ?? 0,
    reviewedCount: (raw?.reviewed_count as number) ?? 0,
    correctCount: (raw?.correct_count as number) ?? 0,
    totalCount: (raw?.total_count as number) ?? 0,
    streak,
    sessionDate: today,
  };
}

/**
 * Get today's session if it exists (for resume).
 */
export async function getTodaySession(userId: string): Promise<DailySession | null> {
  const today = getTodayDateString();
  const sessions = await database
    .get<DailySession>('daily_sessions')
    .query(Q.where('user_id', userId), Q.where('session_date', today))
    .fetch();
  return sessions[0] ?? null;
}

// ─── Internal helpers ───

async function resolveCardsToWordData(cards: VocabCard[]): Promise<WordData[]> {
  const results: WordData[] = [];
  for (const card of cards) {
    const raw = card._raw as Record<string, unknown>;
    const keywordId = raw.keyword_id as string;
    try {
      const keyword = await database.get<Keyword>('keywords').find(keywordId);
      results.push(keywordToWordData(keyword, card.id));
    } catch {
      // Keyword not found — skip this card
    }
  }
  return results;
}
