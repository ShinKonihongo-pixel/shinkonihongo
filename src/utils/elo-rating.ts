// ELO rating calculation utilities
// K-factor: 32 (standard casual competitive)
// Floor: 100 (rating cannot drop below this)

const K_FACTOR = 32;
const RATING_FLOOR = 100;

/**
 * Calculate expected score for a player against an opponent.
 * Returns a probability between 0 and 1.
 */
export function calculateExpectedScore(myRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
}

/**
 * Calculate new rating after a match result.
 * S = 1 (win), 0.5 (draw), 0 (loss)
 */
export function calculateNewRating(
  myRating: number,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw',
): number {
  const S = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const E = calculateExpectedScore(myRating, opponentRating);
  const newRating = Math.round(myRating + K_FACTOR * (S - E));
  return Math.max(RATING_FLOOR, newRating);
}

/**
 * Calculate rating changes for both players after a match.
 * Pass isDraw=true for draw outcome.
 */
export function calculateRatingChanges(
  winnerRating: number,
  loserRating: number,
  isDraw = false,
): {
  winnerChange: number;
  loserChange: number;
  winnerNew: number;
  loserNew: number;
} {
  const winnerNew = calculateNewRating(winnerRating, loserRating, isDraw ? 'draw' : 'win');
  const loserNew = calculateNewRating(loserRating, winnerRating, isDraw ? 'draw' : 'loss');

  return {
    winnerChange: winnerNew - winnerRating,
    loserChange: loserNew - loserRating,
    winnerNew,
    loserNew,
  };
}
