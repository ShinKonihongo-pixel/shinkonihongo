// Word match game creation

import { useCallback } from 'react';
import type {
  WordMatchGame,
  WordMatchPlayer,
  WordMatchSettings,
  CreateWordMatchData,
  WordMatchResults,
} from '../../types/word-match';
import { DEFAULT_WORD_MATCH_SETTINGS } from '../../types/word-match';
import type { Flashcard } from '../../types/flashcard';
import { generateId, generateGameCode } from '../../lib/game-utils';
import { generateRounds } from './utils';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards: Flashcard[];
  setGame: (game: WordMatchGame | null) => void;
  setGameResults: (results: WordMatchResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
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
  scheduleBotJoin,
}: UseGameCreationProps) {
  const createGame = useCallback(async (data: CreateWordMatchData) => {
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

      const newGame: WordMatchGame = {
        id: generateId(),
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

      setGame(newGame);
      setGameResults(null);

      // Schedule bot auto-join
      scheduleBotJoin(setGame, data.maxPlayers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo game');
    } finally {
      setLoading(false);
    }
  }, [currentUser, flashcards, setGame, setGameResults, setLoading, setError, scheduleBotJoin]);

  return { createGame };
}
