// SM-2 Spaced Repetition Algorithm implementation
// Based on SuperMemo 2 algorithm by Piotr Wozniak

import type { Flashcard, SimpleRating } from '../types/flashcard';
import { getTodayISO } from './storage';

// Convert simple rating to SM-2 quality (0-5)
function ratingToQuality(rating: SimpleRating): number {
  switch (rating) {
    case 'again': return 0;  // Complete failure
    case 'hard': return 3;   // Correct with difficulty
    case 'good': return 4;   // Correct with hesitation
    case 'easy': return 5;   // Perfect recall
  }
}

// Calculate next review date based on interval
function getNextReviewDate(intervalDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString().split('T')[0];
}

// SM-2 Algorithm core
export function calculateNextReview(
  card: Flashcard,
  rating: SimpleRating
): Pick<Flashcard, 'easeFactor' | 'interval' | 'repetitions' | 'nextReviewDate'> {
  const quality = ratingToQuality(rating);

  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    // Failed recall - reset repetitions, review again soon
    repetitions = 0;
    interval = 1; // Review tomorrow
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1; // First successful review: 1 day
    } else if (repetitions === 1) {
      interval = 6; // Second successful review: 6 days
    } else {
      // Subsequent reviews: multiply by ease factor
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (clamped between 1.3 and 3.0)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const efChange = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  easeFactor = Math.min(3.0, Math.max(1.3, easeFactor + efChange));

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: getNextReviewDate(interval),
  };
}

// Get cards due for review today
export function getCardsForReview(cards: Flashcard[]): Flashcard[] {
  const today = getTodayISO();
  return cards.filter(card => card.nextReviewDate <= today);
}

// Get new cards (never reviewed)
export function getNewCards(cards: Flashcard[]): Flashcard[] {
  return cards.filter(card => card.repetitions === 0);
}

// Create default SM-2 values for new card
export function getDefaultSM2Values(): Pick<Flashcard, 'easeFactor' | 'interval' | 'repetitions' | 'nextReviewDate' | 'memorizationStatus' | 'difficultyLevel'> {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: getTodayISO(), // Due immediately
    memorizationStatus: 'unset',
    difficultyLevel: 'unset',
  };
}
