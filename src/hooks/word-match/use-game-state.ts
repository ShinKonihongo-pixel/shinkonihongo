// Word match game state management
// Game state is synced to Firestore for cross-device multiplayer

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { WordMatchGame, WordMatchResults, WordMatchPlayer } from '../../types/word-match';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';
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
  const [game, setGameLocal] = useState<WordMatchGame | null>(null);
  const [gameResults, setGameResults] = useState<WordMatchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firestore room ID
  const [roomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Timers
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join hook
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<WordMatchPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
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
    return subscribeToGameRoom<WordMatchGame>(roomId, (remoteGame) => {
      if (!remoteGame) {
        setGameLocal(null);
        return;
      }
      setGameLocal(remoteGame);
    });
  }, [roomId]);

  // setGame wrapper: updates local state AND syncs to Firestore
  const setGame = useCallback((
    updater: ((prev: WordMatchGame | null) => WordMatchGame | null) | WordMatchGame | null
  ) => {
    setGameLocal(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;

      if (newState && roomIdRef.current) {
        // Sync to Firestore (fire-and-forget)
        const { id: _id, ...data } = newState;
        updateGameRoom(roomIdRef.current, data as Record<string, unknown>).catch(err =>
          console.error('Failed to sync word-match state:', err)
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
  };
}
