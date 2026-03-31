// Utility functions for AI Challenge
// Storage, question generation, and helper functions

import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import type { AIChallengeQuestion } from '../../types/ai-challenge';
import { shuffleArray } from '../../lib/game-utils';
import { generateMultipleChoiceOptions } from '../../lib/game-question-utils';

// Storage key for player progress (per JLPT level)
export const STORAGE_KEY_PREFIX = 'ai_challenge_progress_';

// Re-export canonical JLPTLevel from shared types
export type { JLPTLevel } from '../../types/flashcard';

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Load progress from localStorage for specific level
export function loadProgress(level: JLPTLevel): { totalWins: number; totalGames: number } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + level);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load AI Challenge progress:', e);
  }
  return { totalWins: 0, totalGames: 0 };
}

// Save progress to localStorage for specific level
export function saveProgress(level: JLPTLevel, totalWins: number, totalGames: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + level, JSON.stringify({ totalWins, totalGames }));
  } catch (e) {
    console.error('Failed to save AI Challenge progress:', e);
  }
}

// Load progress for all levels
export function loadAllProgress(): Record<JLPTLevel, { totalWins: number; totalGames: number }> {
  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1', 'BT'];
  const result: Record<string, { totalWins: number; totalGames: number }> = {};
  for (const level of levels) {
    result[level] = loadProgress(level);
  }
  return result as Record<JLPTLevel, { totalWins: number; totalGames: number }>;
}

// Convert flashcards to challenge questions
export function convertToQuestions(
  cards: Flashcard[],
  count: number,
  timeLimit: number
): AIChallengeQuestion[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map((card) => {
    // Generate multiple choice options
    const { options, correctIndex } = generateMultipleChoiceOptions(card, cards);

    return {
      id: generateId(),
      questionText: card.kanji || card.vocabulary,
      options,
      correctIndex,
      timeLimit,
      points: 100,
      category: card.kanji ? 'kanji' : 'vocabulary',
    };
  });
}
