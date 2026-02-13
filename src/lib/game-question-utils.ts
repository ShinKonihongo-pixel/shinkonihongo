// Game Question Utilities - Shared logic for generating quiz questions
// Used by Golden Bell and AI Challenge game modes

import type { Flashcard } from '../types/flashcard';
import { shuffleArray } from './game-utils';

/**
 * Pick random wrong answer meanings from other cards
 * @param card - The card containing the correct answer
 * @param allCards - All available cards to pick wrong answers from
 * @param count - Number of wrong options to generate (default: 3)
 * @returns Array of wrong answer meanings
 */
export function generateWrongOptions(
  card: Flashcard,
  allCards: Flashcard[],
  count: number = 3
): string[] {
  const otherCards = allCards.filter(c => c.id !== card.id);
  return shuffleArray(otherCards).slice(0, count).map(c => c.meaning);
}

/**
 * Generate shuffled multiple-choice options with correct index
 * @param card - The card containing the correct answer
 * @param allCards - All available cards to pick wrong answers from
 * @param wrongCount - Number of wrong options to include (default: 3)
 * @returns Object containing shuffled options array and the correct answer index
 */
export function generateMultipleChoiceOptions(
  card: Flashcard,
  allCards: Flashcard[],
  wrongCount: number = 3
): { options: string[]; correctIndex: number } {
  const wrongOptions = generateWrongOptions(card, allCards, wrongCount);
  const options = shuffleArray([card.meaning, ...wrongOptions]);
  const correctIndex = options.indexOf(card.meaning);
  return { options, correctIndex };
}
