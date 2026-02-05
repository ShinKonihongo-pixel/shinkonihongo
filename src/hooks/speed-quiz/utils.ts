// Utility functions for speed quiz

import type { Flashcard } from '../../types/flashcard';
import type { SpeedQuizQuestion } from '../../types/speed-quiz';
import { generateHints } from '../../types/speed-quiz';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateGameCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function convertFlashcardsToQuestions(
  cards: Flashcard[],
  count: number,
  timeLimit: number
): SpeedQuizQuestion[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map(card => {
    const display = card.kanji || card.vocabulary;
    const answer = card.meaning;

    return {
      id: generateId(),
      display,
      answer,
      hints: generateHints(answer),
      points: 100,
      penalty: 30,
      timeLimit,
      category: card.kanji ? 'kanji' : 'vocabulary',
    };
  });
}
