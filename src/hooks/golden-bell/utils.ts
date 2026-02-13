// Golden Bell Game Utilities
// Shared utility functions for question generation and results calculation

import type {
  GoldenBellGame,
  GoldenBellQuestion,
  GoldenBellPlayerResult,
  QuestionDifficulty,
  QuestionCategory,
} from '../../types/golden-bell';
import type { Flashcard } from '../../types/flashcard';
import { generateId, shuffleArray } from '../../lib/game-utils';
import { generateMultipleChoiceOptions } from '../../lib/game-question-utils';

/**
 * Convert flashcards to Golden Bell questions
 */
export function convertFlashcardsToQuestions(
  cards: Flashcard[],
  count: number,
  timeLimit: number,
  difficultyProgression: boolean
): GoldenBellQuestion[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map((card, index) => {
    // Determine difficulty based on progression or random
    let difficulty: QuestionDifficulty;
    if (difficultyProgression) {
      if (index < count * 0.4) difficulty = 'easy';
      else if (index < count * 0.7) difficulty = 'medium';
      else difficulty = 'hard';
    } else {
      const rand = Math.random();
      if (rand < 0.4) difficulty = 'easy';
      else if (rand < 0.75) difficulty = 'medium';
      else difficulty = 'hard';
    }

    // Determine category based on card content
    let category: QuestionCategory = 'vocabulary';
    if (card.kanji && card.kanji.length > 0) category = 'kanji';

    // Generate multiple choice options
    const { options, correctIndex } = generateMultipleChoiceOptions(card, cards);

    return {
      id: generateId(),
      questionText: card.kanji || card.vocabulary,
      options,
      correctIndex,
      category,
      difficulty,
      timeLimit,
      explanation: card.sinoVietnamese ? `Hán Việt: ${card.sinoVietnamese}` : undefined,
    };
  });
}

/**
 * Generate final game results with rankings
 */
export function generateResults(game: GoldenBellGame): GoldenBellPlayerResult[] {
  const players = Object.values(game.players);

  // Sort by: alive status, then by eliminatedAt (later = better), then by correctAnswers
  const sorted = players.sort((a, b) => {
    // Winners/alive first
    if (a.status === 'winner' || a.status === 'alive') return -1;
    if (b.status === 'winner' || b.status === 'alive') return 1;

    // Then by when they were eliminated (later is better)
    const aElim = a.eliminatedAt || 0;
    const bElim = b.eliminatedAt || 0;
    if (aElim !== bElim) return bElim - aElim;

    // Then by correct answers
    return b.correctAnswers - a.correctAnswers;
  });

  return sorted.map((player, index) => ({
    odinhId: player.odinhId,
    displayName: player.displayName,
    avatar: player.avatar,
    rank: index + 1,
    correctAnswers: player.correctAnswers,
    accuracy: player.totalAnswers > 0
      ? Math.round((player.correctAnswers / player.totalAnswers) * 100)
      : 0,
    survivedRounds: player.eliminatedAt
      ? player.eliminatedAt
      : game.currentQuestionIndex + 1,
    longestStreak: player.streak,
    isWinner: player.status === 'winner' || (player.status === 'alive' && index === 0),
  }));
}
