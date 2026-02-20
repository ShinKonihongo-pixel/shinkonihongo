// Word match game creation
// Handles game initialization - writes to Firestore for cross-device multiplayer

import { useCallback, useRef } from 'react';
import type {
  WordMatchGame,
  WordMatchPlayer,
  WordMatchSettings,
  CreateWordMatchData,
  WordMatchResults,
} from '../../types/word-match';
import { DEFAULT_WORD_MATCH_SETTINGS } from '../../types/word-match';
import type { Flashcard } from '../../types/flashcard';
import { generateGameCode } from '../../lib/game-utils';
import { createGameRoom } from '../../services/game-rooms';
import { generateRounds } from './utils';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards: Flashcard[];
  setGame: (value: WordMatchGame | null | ((prev: WordMatchGame | null) => WordMatchGame | null)) => void;
  setGameResults: (results: WordMatchResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  scheduleBotJoin: <TGame extends { status: string; players: Record<string, WordMatchPlayer> }>(
    setGame: (updater: (prev: TGame | null) => TGame | null) => void,
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
  // Guard against concurrent/double creation (StrictMode, async races)
  const creatingRef = useRef(false);

  const createGame = useCallback(async (data: CreateWordMatchData) => {
    if (creatingRef.current) return;
    creatingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      if (flashcards.length < data.totalRounds * 5) {
        throw new Error(`Cần ít nhất ${data.totalRounds * 5} flashcard để chơi`);
      }

      const settings: WordMatchSettings = {
        ...DEFAULT_WORD_MATCH_SETTINGS,
        totalRounds: data.totalRounds,
        timePerRound: data.timePerRound,
        maxPlayers: data.maxPlayers,
      };

      const rounds = generateRounds(
        flashcards,
        settings.totalRounds,
        settings.pairsPerRound,
        settings.specialInterval,
        settings.timePerRound
      );

      const player: WordMatchPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        correctPairs: 0,
        perfectRounds: 0,
        isDisconnected: false,
        disconnectedTurns: 0,
        hasShield: false,
        shieldTurns: 0,
        isChallenged: false,
        currentMatches: [],
        hasSubmitted: false,
        streak: 0,
      };

      const gameData: Omit<WordMatchGame, 'id'> = {
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        rounds,
        currentRound: 0,
        currentRoundData: null,
        roundResults: [],
        createdAt: new Date().toISOString(),
      };

      // Write to Firestore
      const firestoreId = await createGameRoom('word-match', gameData as unknown as Record<string, unknown>);

      // Set room ID first (enables Firestore subscription)
      setRoomId(firestoreId);

      // Set local game state
      const newGame: WordMatchGame = { id: firestoreId, ...gameData };
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
  }, [currentUser, flashcards, setGame, setGameResults, setLoading, setError, setRoomId, scheduleBotJoin]);

  return { createGame };
}
