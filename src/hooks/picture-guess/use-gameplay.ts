// Gameplay actions: hints, guesses, revealing, next puzzle

import { useCallback } from 'react';
import type {
  PictureGuessGame,
  PictureGuessPlayer,
  PicturePuzzle,
  HintType,
  PictureGuessResults,
} from '../../types/picture-guess';
import { HINTS } from '../../types/picture-guess';
import { generateResults } from './utils';

interface UseGameplayProps {
  currentUser: {
    id: string;
  };
  game: PictureGuessGame | null;
  currentPuzzle: PicturePuzzle | null;
  currentPlayer: PictureGuessPlayer | undefined;
  setGame: (updater: (prev: PictureGuessGame | null) => PictureGuessGame | null) => void;
  setGameResults: (results: PictureGuessResults | null) => void;
}

export function useGameplay({
  currentUser,
  game,
  currentPuzzle,
  currentPlayer,
  setGame,
  setGameResults,
}: UseGameplayProps) {
  // Use hint
  const useHint = useCallback((hintType: HintType) => {
    if (!game || !currentPuzzle || game.status !== 'guessing') return;
    if (!currentPlayer) return;
    if (currentPuzzle.hintsUsed.includes(hintType)) return;

    const hintCost = HINTS[hintType].cost;

    setGame(prev => {
      if (!prev) return null;
      const puzzle = prev.puzzles[prev.currentPuzzleIndex];
      if (!puzzle) return prev;

      const updatedPuzzles = [...prev.puzzles];
      updatedPuzzles[prev.currentPuzzleIndex] = {
        ...puzzle,
        hintsUsed: [...puzzle.hintsUsed, hintType],
      };

      const player = prev.players[currentUser.id];
      if (!player) return prev;

      return {
        ...prev,
        puzzles: updatedPuzzles,
        players: {
          ...prev.players,
          [currentUser.id]: {
            ...player,
            hintsUsed: player.hintsUsed + 1,
            score: Math.max(0, player.score - hintCost),
          },
        },
      };
    });
  }, [game, currentPuzzle, currentPlayer, currentUser, setGame]);

  // Get hint content
  const getHintContent = useCallback((hintType: HintType): string => {
    if (!currentPuzzle) return '';

    switch (hintType) {
      case 'first_letter':
        return currentPuzzle.word.charAt(0);
      case 'word_length':
        return `${currentPuzzle.word.length} ký tự`;
      case 'meaning_hint':
        return currentPuzzle.meaning.substring(0, Math.ceil(currentPuzzle.meaning.length / 2)) + '...';
      case 'sino_vietnamese':
        return currentPuzzle.sinoVietnamese || 'Không có Hán Việt';
      default:
        return '';
    }
  }, [currentPuzzle]);

  // Submit guess
  const submitGuess = useCallback((guess: string) => {
    if (!game || !currentPuzzle || game.status !== 'guessing') return;
    if (!currentPlayer || currentPlayer.status !== 'playing') return;

    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = currentPuzzle.word.toLowerCase();
    const normalizedReading = currentPuzzle.reading?.toLowerCase() || '';

    const isCorrect = normalizedGuess === normalizedWord || normalizedGuess === normalizedReading;
    const guessTime = Date.now() - (game.puzzleStartTime || Date.now());

    // Calculate score
    let earnedPoints = 0;
    if (isCorrect) {
      earnedPoints = currentPuzzle.points;

      // Speed bonus: faster answers get more points
      if (game.settings.speedBonus) {
        const timeRatio = 1 - (guessTime / (currentPuzzle.timeLimit * 1000));
        const speedBonus = Math.floor(earnedPoints * 0.5 * timeRatio);
        earnedPoints += Math.max(0, speedBonus);
      }

      // Streak bonus
      const streakBonus = Math.min(currentPlayer.streak * 10, 50);
      earnedPoints += streakBonus;
    } else if (game.settings.penaltyWrongAnswer) {
      earnedPoints = -10;
    }

    setGame(prev => {
      if (!prev) return null;
      const player = prev.players[currentUser.id];
      if (!player) return prev;

      const newStreak = isCorrect ? player.streak + 1 : 0;

      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUser.id]: {
            ...player,
            currentGuess: guess,
            guessTime,
            totalGuesses: player.totalGuesses + 1,
            correctGuesses: isCorrect ? player.correctGuesses + 1 : player.correctGuesses,
            score: Math.max(0, player.score + earnedPoints),
            streak: newStreak,
            status: isCorrect ? 'guessed' : 'playing',
          },
        },
      };
    });

    return isCorrect;
  }, [game, currentPuzzle, currentPlayer, currentUser, setGame]);

  // Reveal answer (for single player or host control)
  const revealAnswer = useCallback(() => {
    if (!game || game.status !== 'guessing') return;

    setGame(prev => {
      if (!prev) return null;

      // Reset player status for next round
      const updatedPlayers = { ...prev.players };
      Object.keys(updatedPlayers).forEach(id => {
        updatedPlayers[id] = {
          ...updatedPlayers[id],
          status: updatedPlayers[id].status === 'guessed' ? 'guessed' : 'timeout',
        };
      });

      return {
        ...prev,
        status: 'revealed',
        players: updatedPlayers,
      };
    });
  }, [game, setGame]);

  // Next puzzle or finish game
  const nextPuzzle = useCallback(() => {
    if (!game || game.status !== 'revealed') return;

    const isLastPuzzle = game.currentPuzzleIndex >= game.puzzles.length - 1;

    if (isLastPuzzle) {
      // Generate results
      const rankings = generateResults(game);

      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'finished',
          finishedAt: new Date().toISOString(),
        };
      });

      setGameResults({
        gameId: game.id,
        mode: game.settings.mode,
        rankings,
        totalPuzzles: game.puzzles.length,
        wordsLearned: game.puzzles,
      });

      return;
    }

    // Move to next puzzle
    setGame(prev => {
      if (!prev) return null;

      // Reset player status for next round
      const resetPlayers = { ...prev.players };
      Object.keys(resetPlayers).forEach(id => {
        resetPlayers[id] = {
          ...resetPlayers[id],
          currentGuess: undefined,
          guessTime: undefined,
          status: 'playing',
        };
      });

      return {
        ...prev,
        status: 'showing',
        currentPuzzleIndex: prev.currentPuzzleIndex + 1,
        players: resetPlayers,
      };
    });

    // Auto-transition to guessing
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'guessing',
          puzzleStartTime: Date.now(),
        };
      });
    }, 2000);
  }, [game, setGame, setGameResults]);

  return {
    useHint,
    getHintContent,
    submitGuess,
    revealAnswer,
    nextPuzzle,
  };
}
