// Game creation logic for Picture Guess
// Handles game initialization - writes to Firestore for cross-device multiplayer

import { useCallback } from 'react';
import type {
  PictureGuessGame,
  PictureGuessPlayer,
  PictureGuessSettings,
  PictureGuessResults,
  CreatePictureGuessData,
} from '../../types/picture-guess';
import type { Flashcard } from '../../types/flashcard';
import { generateGameCode } from '../../lib/game-utils';
import { createGameRoom } from '../../services/game-rooms';
import { convertFlashcardsToPuzzles } from './utils';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  flashcards: Flashcard[];
  setGame: (value: PictureGuessGame | null | ((prev: PictureGuessGame | null) => PictureGuessGame | null)) => void;
  setGameResults: (results: PictureGuessResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
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
  setRoomId,
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

      const gameData: Omit<PictureGuessGame, 'id'> = {
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

      // Write to Firestore
      const firestoreId = await createGameRoom('picture-guess', gameData as Record<string, unknown>);

      // Set room ID first (enables Firestore subscription)
      setRoomId(firestoreId);

      // Set local game state
      const newGame: PictureGuessGame = { id: firestoreId, ...gameData };
      setGame(newGame);
      setGameResults(null);

      // Schedule bot auto-join
      scheduleBotJoin(setGame, data.maxPlayers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo trò chơi');
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards, setGame, setGameResults, setLoading, setError, setRoomId, scheduleBotJoin]);

  return { createGame };
}
