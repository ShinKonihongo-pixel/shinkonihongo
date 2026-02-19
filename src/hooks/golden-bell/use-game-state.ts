// Golden Bell Game State Management
// Manages all state, computed values, and timer refs
// Game state is synced to Firestore for cross-device multiplayer

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellResults,
} from '../../types/golden-bell';
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
  // Game state
  const [game, setGameLocal] = useState<GoldenBellGame | null>(null);
  const [gameResults, setGameResults] = useState<GoldenBellResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firestore room ID
  const [roomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Refs for timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join hook
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<GoldenBellPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      status: 'alive' as const,
      correctAnswers: 0,
      totalAnswers: 0,
      streak: 0,
      isBot: true,
      botIntelligence: bot.intelligence,
      skills: [],
    }),
    transformAfterJoin: (game) => {
      const updated = {
        ...game,
        alivePlayers: Object.keys(game.players).length,
      };
      // Auto-assign bots to teams in team mode
      if ((updated as any).teams) {
        const teams = { ...(updated as any).teams } as Record<string, any>;
        const teamIds = Object.keys(teams);
        // Find newly added bot (player without teamId)
        Object.entries(updated.players).forEach(([pid, player]: [string, any]) => {
          if (player.isBot && !player.teamId && teamIds.length > 0) {
            // Find smallest team
            let smallestId = teamIds[0];
            let smallestCount = Infinity;
            teamIds.forEach(tid => {
              if ((teams[tid].members?.length || 0) < smallestCount) {
                smallestCount = teams[tid].members?.length || 0;
                smallestId = tid;
              }
            });
            teams[smallestId] = {
              ...teams[smallestId],
              members: [...(teams[smallestId].members || []), pid],
              aliveCount: (teams[smallestId].aliveCount || 0) + 1,
            };
            (updated.players[pid] as any).teamId = smallestId;
          }
        });
        (updated as any).teams = teams;
      }
      return updated;
    },
  });

  // Firestore subscription - updates local state from remote changes
  useEffect(() => {
    if (!roomId) return;
    return subscribeToGameRoom<GoldenBellGame>(roomId, (remoteGame) => {
      if (!remoteGame) {
        setGameLocal(null);
        return;
      }
      setGameLocal(remoteGame);
    });
  }, [roomId]);

  // setGame wrapper: updates local state AND syncs to Firestore
  const setGame = useCallback((
    updater: ((prev: GoldenBellGame | null) => GoldenBellGame | null) | GoldenBellGame | null
  ) => {
    setGameLocal(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;

      if (newState && roomIdRef.current) {
        // Sync to Firestore (fire-and-forget)
        const { id: _id, ...data } = newState;
        updateGameRoom(roomIdRef.current, data as Record<string, unknown>).catch(err =>
          console.error('Failed to sync golden-bell state:', err)
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

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUserId, [game, currentUserId]);
  const currentPlayer = useMemo(() => game?.players[currentUserId], [game, currentUserId]);
  const currentQuestion = useMemo(() => {
    if (!game || game.currentQuestionIndex < 0) return null;
    return game.questions[game.currentQuestionIndex] || null;
  }, [game]);

  // Get sorted players by status and correct answers
  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => {
      // Alive players first
      if (a.status === 'alive' && b.status !== 'alive') return -1;
      if (b.status === 'alive' && a.status !== 'alive') return 1;
      // Then by correct answers
      return b.correctAnswers - a.correctAnswers;
    });
  }, [game]);

  // Count alive players
  const aliveCount = useMemo(() => {
    if (!game) return 0;
    return Object.values(game.players).filter(p => p.status === 'alive').length;
  }, [game]);

  // Clear local state without triggering Firestore room deletion
  // Used when non-host leaves — they only remove themselves from the player list
  const clearLocalGameState = useCallback(() => {
    setGameLocal(null);
    roomIdRef.current = null;
    setRoomId(null);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    const timer = timerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer, currentQuestion,
    sortedPlayers, aliveCount,
    timerRef,
    scheduleBotJoin, clearBotTimers,
    clearLocalGameState,
  };
}
