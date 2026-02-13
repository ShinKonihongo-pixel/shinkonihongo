// Utility functions for Picture Guess game

import type { Flashcard } from '../../types/flashcard';
import type {
  PicturePuzzle,
  PictureGuessGame,
  PictureGuessPlayerResult,
} from '../../types/picture-guess';
import { generateEmojiHint } from '../../types/picture-guess';
import { generateId, shuffleArray } from '../../lib/game-utils';

// Convert flashcards to picture puzzles
export function convertFlashcardsToPuzzles(
  cards: Flashcard[],
  count: number,
  timePerPuzzle: number
): PicturePuzzle[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map((card) => {
    // Determine difficulty based on word complexity
    let difficulty: 'easy' | 'medium' | 'hard';
    const wordLength = (card.kanji || card.vocabulary).length;
    if (wordLength <= 2) difficulty = 'easy';
    else if (wordLength <= 4) difficulty = 'medium';
    else difficulty = 'hard';

    // Calculate points based on difficulty
    const points = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 150 : 200;

    // Generate emoji hint based on meaning
    const emojis = generateEmojiHint(card.meaning);

    return {
      id: generateId(),
      imageEmojis: emojis,
      word: card.kanji || card.vocabulary,
      reading: card.vocabulary, // vocabulary is the reading (Hiragana)
      meaning: card.meaning,
      sinoVietnamese: card.sinoVietnamese,
      examples: card.examples && card.examples.length > 0 ? card.examples : undefined,
      difficulty,
      timeLimit: timePerPuzzle,
      points,
      hintsUsed: [],
    };
  });
}

// Generate final results
export function generateResults(game: PictureGuessGame): PictureGuessPlayerResult[] {
  const players = Object.values(game.players);

  // Sort by score
  const sorted = players.sort((a, b) => b.score - a.score);

  return sorted.map((player, index) => ({
    odinhId: player.odinhId,
    displayName: player.displayName,
    avatar: player.avatar,
    rank: index + 1,
    score: player.score,
    correctGuesses: player.correctGuesses,
    accuracy: player.totalGuesses > 0
      ? Math.round((player.correctGuesses / player.totalGuesses) * 100)
      : 0,
    averageTime: player.totalGuesses > 0 && player.guessTime
      ? Math.round(player.guessTime / player.totalGuesses)
      : 0,
    longestStreak: player.streak,
    hintsUsed: player.hintsUsed,
  }));
}
