// Image-Word game creation
// Handles game initialization - writes to Firestore for cross-device multiplayer

import { useCallback, useRef } from 'react';
import type {
  ImageWordMultiplayerGame,
  ImageWordMultiplayerPlayer,
  ImageWordMultiplayerSettings,
  ImageWordMultiplayerResults,
  CreateImageWordData,
} from '../../types/image-word';
import { DEFAULT_IMAGE_WORD_SETTINGS } from '../../types/image-word';
import { generateGameCode, shuffleArray } from '../../lib/game-utils';
import { createGameRoom } from '../../services/game-rooms';
import { getImageWordLessons } from '../../services/image-word-storage';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  setGame: (value: ImageWordMultiplayerGame | null | ((prev: ImageWordMultiplayerGame | null) => ImageWordMultiplayerGame | null)) => void;
  setGameResults: (results: ImageWordMultiplayerResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  scheduleBotJoin: <TGame extends { status: string; players: Record<string, ImageWordMultiplayerPlayer> }>(
    setGame: (updater: (prev: TGame | null) => TGame | null) => void,
    maxPlayers: number
  ) => void;
}

export function useGameCreation({
  currentUser,
  setGame,
  setGameResults,
  setLoading,
  setError,
  setRoomId,
  scheduleBotJoin,
}: UseGameCreationProps) {
  // Guard against concurrent/double creation (StrictMode, async races)
  const creatingRef = useRef(false);

  const createGame = useCallback(async (data: CreateImageWordData) => {
    if (creatingRef.current) return;
    creatingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      // Gather all pairs from all lessons
      const lessons = getImageWordLessons();
      const allPairs = lessons.flatMap(lesson => lesson.pairs);

      if (allPairs.length < data.totalPairs) {
        throw new Error(`Cần ít nhất ${data.totalPairs} cặp hình-từ để chơi. Hiện có ${allPairs.length} cặp.`);
      }

      // Shuffle and pick the required number of pairs
      const shuffled = shuffleArray(allPairs);
      const selectedPairs = shuffled.slice(0, data.totalPairs);

      // Shared shuffle order (pair IDs in display order)
      const shuffledPairsOrder = shuffleArray(selectedPairs.map(p => p.id));

      const settings: ImageWordMultiplayerSettings = {
        ...DEFAULT_IMAGE_WORD_SETTINGS,
        maxPlayers: data.maxPlayers,
        totalPairs: data.totalPairs,
        timeLimit: data.timeLimit,
      };

      const player: ImageWordMultiplayerPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        matchedPairs: [],
        wrongAttempts: 0,
        isComplete: false,
      };

      const gameData: Omit<ImageWordMultiplayerGame, 'id'> = {
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        pairs: selectedPairs,
        shuffledPairsOrder,
        createdAt: new Date().toISOString(),
      };

      // Write to Firestore
      const firestoreId = await createGameRoom('image-word', gameData as unknown as Record<string, unknown>);

      // Set room ID first (enables Firestore subscription)
      setRoomId(firestoreId);

      // Set local game state
      const newGame: ImageWordMultiplayerGame = { id: firestoreId, ...gameData };
      setGame(newGame);
      setGameResults(null);

      // Schedule bot auto-join
      scheduleBotJoin(setGame, data.maxPlayers);
    } catch (err) {
      creatingRef.current = false; // Allow retry on error
      setError(err instanceof Error ? err.message : 'Không thể tạo game');
    } finally {
      setLoading(false);
    }
  }, [currentUser, setGame, setGameResults, setLoading, setError, setRoomId, scheduleBotJoin]);

  return { createGame };
}
