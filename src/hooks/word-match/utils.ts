// Word match utilities - round generation

import type { Flashcard } from '../../types/flashcard';
import type { WordMatchRound, WordPair } from '../../types/word-match';
import { generateId, shuffleArray } from '../../lib/game-utils';

// Generate rounds from flashcards
export function generateRounds(
  flashcards: Flashcard[],
  totalRounds: number,
  pairsPerRound: number,
  specialInterval: number,
  timePerRound: number
): WordMatchRound[] {
  const rounds: WordMatchRound[] = [];
  const shuffled = shuffleArray(flashcards);
  let cardIndex = 0;

  for (let i = 0; i < totalRounds; i++) {
    const isSpecial = (i + 1) % specialInterval === 0;
    const pairs: WordPair[] = [];

    for (let j = 0; j < pairsPerRound; j++) {
      if (cardIndex >= shuffled.length) {
        cardIndex = 0; // Recycle cards if needed
      }
      const card = shuffled[cardIndex++];
      pairs.push({
        id: generateId(),
        left: card.kanji || card.vocabulary,
        right: card.meaning,
        difficulty: 'medium',
      });
    }

    rounds.push({
      id: generateId(),
      pairs,
      isSpecial,
      timeLimit: timePerRound,
    });
  }

  return rounds;
}
