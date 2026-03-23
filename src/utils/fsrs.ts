// FSRS (Free Spaced Repetition Scheduler) — replaces SM-2
// Based on FSRS-4.5 algorithm with optimized parameters
// Reference: https://github.com/open-spaced-repetition/fsrs4anki

// FSRS parameters (pre-optimized defaults)
const W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

// Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
export type FSRSRating = 1 | 2 | 3 | 4;

export interface FSRSState {
  stability: number;     // How well the card is remembered (days)
  difficulty: number;    // How hard the card is (0-10)
  elapsedDays: number;   // Days since last review
  scheduledDays: number; // Days until next review
  reps: number;          // Total reviews
  lapses: number;        // Times forgotten (rating=1)
  lastReview: string;    // ISO date
  nextReview: string;    // ISO date
}

// Default state for new card
export function createFSRSState(): FSRSState {
  return {
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReview: '',
    nextReview: new Date().toISOString(),
  };
}

// Calculate retrievability (probability of recall)
function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

// Initial stability based on rating
function initStability(rating: FSRSRating): number {
  return Math.max(W[rating - 1], 0.1);
}

// Initial difficulty based on rating
function initDifficulty(rating: FSRSRating): number {
  return Math.min(Math.max(W[4] - Math.exp(W[5] * (rating - 1)) + 1, 1), 10);
}

// Next difficulty after review
function nextDifficulty(d: number, rating: FSRSRating): number {
  const newD = d - W[6] * (rating - 3);
  // Mean reversion to initial difficulty
  return Math.min(Math.max(W[7] * initDifficulty(4) + (1 - W[7]) * newD, 1), 10);
}

// Short-term stability (for "Again" rating)
function shortTermStability(s: number, rating: FSRSRating): number {
  if (rating === 1) {
    return Math.max(s * Math.exp(W[11] * Math.pow(0 + 1, W[12])), 0.1);
  }
  return s;
}

// Next stability after successful recall
function nextRecallStability(d: number, s: number, r: number, rating: FSRSRating): number {
  const hardPenalty = rating === 2 ? W[15] : 1;
  const easyBonus = rating === 4 ? W[16] : 1;
  return s * (
    1 +
    Math.exp(W[8]) *
    (11 - d) *
    Math.pow(s, -W[9]) *
    (Math.exp((1 - r) * W[10]) - 1) *
    hardPenalty *
    easyBonus
  );
}

// Calculate next interval from stability
function nextInterval(stability: number): number {
  const DESIRED_RETENTION = 0.9; // 90% target retention
  const interval = stability / 9 * (Math.pow(1 / DESIRED_RETENTION, 1) - 1);
  return Math.max(Math.round(interval), 1);
}

// Main function: schedule next review
export function scheduleReview(state: FSRSState, rating: FSRSRating): FSRSState {
  const now = new Date();
  const lastReview = state.lastReview ? new Date(state.lastReview) : now;
  const elapsedDays = Math.max((now.getTime() - lastReview.getTime()) / 86400000, 0);

  let newStability: number;
  let newDifficulty: number;
  let newLapses = state.lapses;

  if (state.reps === 0) {
    // First review
    newStability = initStability(rating);
    newDifficulty = initDifficulty(rating);
    if (rating === 1) newLapses++;
  } else {
    newDifficulty = nextDifficulty(state.difficulty, rating);

    if (rating === 1) {
      // Forgot — use short-term stability
      newStability = shortTermStability(state.stability, rating);
      newLapses++;
    } else {
      // Remembered — calculate next recall stability
      const r = retrievability(elapsedDays, state.stability);
      newStability = nextRecallStability(newDifficulty, state.stability, r, rating);
    }
  }

  const scheduledDays = rating === 1 ? 1 : nextInterval(newStability);
  const nextReviewDate = new Date(now.getTime() + scheduledDays * 86400000);

  return {
    stability: newStability,
    difficulty: newDifficulty,
    elapsedDays,
    scheduledDays,
    reps: state.reps + 1,
    lapses: newLapses,
    lastReview: now.toISOString(),
    nextReview: nextReviewDate.toISOString(),
  };
}

// Convert from old SM-2 format to FSRS state
export function migrateFromSM2(card: {
  easeFactor?: number;
  interval?: number;
  repetitions?: number;
  nextReviewDate?: string;
}): FSRSState {
  const interval = card.interval || 1;
  const easeFactor = card.easeFactor || 2.5;

  // Approximate stability from SM-2 interval
  const stability = interval * (easeFactor / 2.5);
  // Approximate difficulty from ease factor (lower ease = harder)
  const difficulty = Math.min(Math.max(10 - (easeFactor - 1.3) * 5, 1), 10);

  return {
    stability,
    difficulty,
    elapsedDays: 0,
    scheduledDays: interval,
    reps: card.repetitions || 0,
    lapses: 0,
    lastReview: '',
    nextReview: card.nextReviewDate || new Date().toISOString(),
  };
}
