/**
 * SpacedRepetitionService — SM-2 algorithm for vocabulary learning.
 *
 * Quality scale (0-5):
 *   0 = Complete blackout
 *   1 = Incorrect, but remembered upon seeing answer
 *   2 = Incorrect, but answer seemed easy to recall
 *   3 = Correct with serious difficulty
 *   4 = Correct with some hesitation
 *   5 = Perfect recall
 *
 * Cards with quality < 3 reset to the beginning.
 */

export interface SM2Input {
  quality: number;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
}

export interface SM2Result {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: number;
}

const MIN_EASE_FACTOR = 1.3;

/**
 * Calculate next review schedule using SM-2 algorithm.
 */
export function calculateNextReview(input: SM2Input): SM2Result {
  const { quality, repetitions, easeFactor, intervalDays } = input;
  const clampedQuality = Math.max(0, Math.min(5, Math.round(quality)));
  const now = Date.now();

  if (clampedQuality < 3) {
    // Failed — reset repetitions, review again in 1 day
    return {
      repetitions: 0,
      easeFactor: Math.max(MIN_EASE_FACTOR, easeFactor - 0.2),
      intervalDays: 1,
      nextReviewAt: now + 1 * 24 * 60 * 60 * 1000,
    };
  }

  // Passed — calculate new interval
  let newRepetitions = repetitions + 1;
  let newInterval: number;

  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(intervalDays * easeFactor);
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - clampedQuality) * (0.08 + (5 - clampedQuality) * 0.02)),
  );

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    intervalDays: newInterval,
    nextReviewAt: now + newInterval * 24 * 60 * 60 * 1000,
  };
}

/**
 * Get initial SM-2 values for a new card.
 */
export function getInitialSM2Values(): { repetitions: number; easeFactor: number; intervalDays: number } {
  return { repetitions: 0, easeFactor: 2.5, intervalDays: 0 };
}

/**
 * Determine if a card is due for review.
 */
export function isDueForReview(nextReviewAt: number): boolean {
  return nextReviewAt <= Date.now();
}

/**
 * Map user interaction to quality score.
 */
export function mapToQuality(result: 'perfect' | 'good' | 'hard' | 'forgot'): number {
  switch (result) {
    case 'perfect': return 5;
    case 'good': return 4;
    case 'hard': return 3;
    case 'forgot': return 1;
  }
}
