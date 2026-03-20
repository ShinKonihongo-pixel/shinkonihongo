// Quiz Battle per-question scoring utilities
// Correct: 100 base + up to 50 time bonus = max 150 per question
// Wrong / timeout: 0 points
// Max per match (20 questions): 3000 points

export const BASE_POINTS = 100;
export const MAX_TIME_BONUS = 50;

/**
 * Calculate score for a single question.
 *
 * @param isCorrect     Whether the player selected the correct answer
 * @param answerTimeMs  Time taken to answer in milliseconds
 * @param timeLimitMs   Total time allowed for the question in milliseconds
 * @returns             Points earned (0 if wrong or timed out)
 */
export function calculateQuestionScore(
  isCorrect: boolean,
  answerTimeMs: number,
  timeLimitMs: number,
): number {
  if (!isCorrect || answerTimeMs <= 0 || timeLimitMs <= 0) return 0;

  const timeBonus = Math.max(
    0,
    Math.floor(((timeLimitMs - answerTimeMs) / timeLimitMs) * MAX_TIME_BONUS),
  );

  return BASE_POINTS + timeBonus;
}
