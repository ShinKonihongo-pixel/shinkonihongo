// Game creation logic for Picture Guess

import { useCallback } from 'react';
import type {
  PictureGuessGame,
  PictureGuessPlayer,
  PictureGuessSettings,
  PictureGuessResults,
  CreatePictureGuessData,
} from '../../types/picture-guess';
import type { Flashcard } from '../../types/flashcard';
import { generateId, generateGameCode } from '../../lib/game-utils';
import { convertFlashcardsToPuzzles } from './utils';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  flashcards: Flashcard[];
  setGame: (game: PictureGuessGame | null) => void;
  setGameResults: (results: PictureGuessResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  scheduleBotJoin: (
    setGame: (updater: (prev: PictureGuessGame | null) => PictureGuessGame | null) => void,
    maxPlayers: number
  ) => void;
}

export function useGameCreation({
  currentUser,
  flashcards,
  setGame,
  setGameResults,
  setLoading,
  setError,
  scheduleBotJoin,
}: UseGameCreationProps) {
  const createGame = useCallback(async (data: CreatePictureGuessData) => {
    setLoading(true);
    setError(null);

    try {
      const puzzles = convertFlashcardsToPuzzles(
        flashcards,
        data.puzzleCount,
        data.timePerPuzzle
      );

      if (puzzles.length < 3) {
        throw new Error('Cần ít nhất 3 từ vựng để bắt đầu trò chơi');
      }

      const settings: PictureGuessSettings = {
        mode: data.mode,
        maxPlayers: data.maxPlayers,
        puzzleCount: data.puzzleCount,
        timePerPuzzle: data.timePerPuzzle,
        jlptLevel: data.jlptLevel,
        allowHints: data.allowHints,
        speedBonus: data.speedBonus,
        penaltyWrongAnswer: data.penaltyWrongAnswer,
        contentSource: data.contentSource,
        lessonId: data.lessonId,
      };

      const player: PictureGuessPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        score: 0,
        correctGuesses: 0,
        totalGuesses: 0,
        streak: 0,
        hintsUsed: 0,
        status: 'playing',
      };

      const newGame: PictureGuessGame = {
        id: generateId(),
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        puzzles,
        currentPuzzleIndex: -1,
        createdAt: new Date().toISOString(),
      };

      setGame(newGame);
      setGameResults(null);

      // Schedule bot auto-join
      scheduleBotJoin(setGame, data.maxPlayers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo trò chơi');
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards, setGame, setGameResults, setLoading, setError, scheduleBotJoin]);

  return { createGame };
}
