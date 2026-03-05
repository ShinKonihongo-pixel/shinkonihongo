// Kanji Drop game creation
// Handles room initialization — writes to Firestore for multiplayer

import { useCallback, useRef } from 'react';
import type {
  KanjiDropMultiplayerGame,
  KanjiDropMultiplayerPlayer,
  KanjiDropMultiplayerSettings,
  KanjiDropMultiplayerResults,
  CreateKanjiDropRoomData,
} from '../../components/pages/kanji-drop/kanji-drop-multiplayer-types';
import { DEFAULT_KANJI_DROP_MP_SETTINGS } from '../../components/pages/kanji-drop/kanji-drop-multiplayer-types';
import { generateGameCode } from '../../lib/game-utils';
import { createGameRoom } from '../../services/game-rooms';

interface UseGameCreationProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  setGame: (value: KanjiDropMultiplayerGame | null | ((prev: KanjiDropMultiplayerGame | null) => KanjiDropMultiplayerGame | null)) => void;
  setGameResults: (results: KanjiDropMultiplayerResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  scheduleBotJoin: <TGame extends { status: string; players: Record<string, KanjiDropMultiplayerPlayer> }>(
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
  const creatingRef = useRef(false);

  const createGame = useCallback(async (data: CreateKanjiDropRoomData) => {
    if (creatingRef.current) return;
    creatingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const seed = Date.now();

      const settings: KanjiDropMultiplayerSettings = {
        ...DEFAULT_KANJI_DROP_MP_SETTINGS,
        maxPlayers: data.maxPlayers,
        levelStart: data.levelStart,
        levelEnd: data.levelEnd,
        jlptLevels: data.jlptLevels,
        selectedLessons: data.selectedLessons,
        seed,
      };

      const player: KanjiDropMultiplayerPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        currentLevel: data.levelStart,
        clearedCount: 0,
        levelsCompleted: 0,
      };

      const gameData: Omit<KanjiDropMultiplayerGame, 'id'> = {
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        createdAt: new Date().toISOString(),
      };

      const firestoreId = await createGameRoom('kanji-drop', gameData as unknown as Record<string, unknown>);

      setRoomId(firestoreId);

      const newGame: KanjiDropMultiplayerGame = { id: firestoreId, ...gameData };
      setGame(newGame);
      setGameResults(null);

      scheduleBotJoin(setGame, data.maxPlayers);
    } catch (err) {
      creatingRef.current = false;
      setError(err instanceof Error ? err.message : 'Không thể tạo game');
    } finally {
      setLoading(false);
    }
  }, [currentUser, setGame, setGameResults, setLoading, setError, setRoomId, scheduleBotJoin]);

  return { createGame };
}
