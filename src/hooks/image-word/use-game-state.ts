// Image-Word game state management
// Game state is synced to Firestore for cross-device multiplayer

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ImageWordMultiplayerGame, ImageWordMultiplayerResults, ImageWordMultiplayerPlayer } from '../../types/image-word';
import { useBotAutoJoin } from '../shared/use-bot-auto-join';
import {
  updateGameRoom,
  deleteGameRoom,
  subscribeToGameRoom,
} from '../../services/game-rooms';

interface UseGameStateProps {
  currentUserId: string;
}

export function useGameState({ currentUserId }: UseGameStateProps) {
  // State
  const [game, setGameLocal] = useState<ImageWordMultiplayerGame | null>(null);
  const [gameResults, setGameResults] = useState<ImageWordMultiplayerResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firestore room ID
  const [roomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Timers
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join hook
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<ImageWordMultiplayerPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      score: 0,
      matchedPairs: [],
      wrongAttempts: 0,
      isComplete: false,
      isBot: true,
    }),
    schedules: [{ delay: 5000, count: 1 }],
  });

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUserId, [game, currentUserId]);
  const currentPlayer = useMemo(() => game?.players[currentUserId], [game, currentUserId]);

  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
  }, [game]);

  // Firestore subscription - updates local state from remote changes
  useEffect(() => {
    if (!roomId) return;
    return subscribeToGameRoom<ImageWordMultiplayerGame>(roomId, (remoteGame) => {
      if (!remoteGame) {
        setGameLocal(null);
        return;
      }
      setGameLocal(remoteGame);
    });
  }, [roomId]);

  // setGame wrapper: updates local state AND syncs to Firestore
  const setGame = useCallback((
    updater: ((prev: ImageWordMultiplayerGame | null) => ImageWordMultiplayerGame | null) | ImageWordMultiplayerGame | null
  ) => {
    setGameLocal(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;

      if (newState && roomIdRef.current) {
        // Sync to Firestore (fire-and-forget)
        const { id: _id, ...data } = newState;
        updateGameRoom(roomIdRef.current, data as Record<string, unknown>).catch(err =>
          console.error('Failed to sync image-word state:', err)
        );
      } else if (!newState && roomIdRef.current) {
        // Game reset/ended - clean up Firestore room
        deleteGameRoom(roomIdRef.current).catch(console.error);
        roomIdRef.current = null;
        setRoomId(null);
      }

      return newState;
    });
  }, []);

  // Delete current Firestore room directly (sync, fire-and-forget)
  // This must NOT rely on the setGame wrapper's state updater,
  // because the component may unmount before the updater runs.
  const deleteCurrentRoom = useCallback(() => {
    const id = roomIdRef.current;
    if (id) {
      deleteGameRoom(id).catch(console.error);
      roomIdRef.current = null;
      setRoomId(null);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  return {
    game,
    setGame,
    gameResults,
    setGameResults,
    loading,
    setLoading,
    error,
    setError,
    roomId,
    setRoomId,
    isHost,
    currentPlayer,
    sortedPlayers,
    roundTimerRef,
    scheduleBotJoin,
    clearBotTimers,
    deleteCurrentRoom,
  };
}
