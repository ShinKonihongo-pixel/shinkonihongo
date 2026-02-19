// Bingo Game Utilities

import type { Flashcard } from '../../types/flashcard';
import type { BingoQuestion } from '../../types/bingo-game';
import { generateMultipleChoiceOptions } from '../../lib/game-question-utils';
import { shuffleArray, generateId } from '../../lib/game-utils';

// Generate random 6-digit code
export function generateGameCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Re-export generateId for backward compat
export { generateId };

// Bot auto-join settings
export const BOT_FIRST_JOIN_DELAY = 10000; // 10 seconds - add 1 bot
export const BOT_SECOND_JOIN_DELAY = 20000; // 20 seconds - add 2 more bots

/**
 * Convert flashcards to BingoQuestion[] for quiz-based bingo gameplay
 * Uses the shared MCQ generator to create 4-option questions from flashcards
 */
export function convertFlashcardsToBingoQuestions(
  cards: Flashcard[],
  allCards: Flashcard[],
  count: number,
  timeLimit: number
): BingoQuestion[] {
  if (cards.length === 0) return [];

  const shuffled = shuffleArray(cards);
  const selected = shuffled.slice(0, count);

  return selected.map(card => {
    const { options, correctIndex } = generateMultipleChoiceOptions(card, allCards, 3);
    return {
      id: generateId(),
      questionText: card.vocabulary,
      questionHint: card.kanji || undefined,
      options,
      correctIndex,
      timeLimit,
    };
  });
}
