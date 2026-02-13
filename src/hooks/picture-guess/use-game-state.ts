// Game state management for Picture Guess
// Game state is synced to Firestore for cross-device multiplayer

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type {
  PictureGuessGame,
  PictureGuessPlayer,
  PictureGuessResults,
} from '../../types/picture-guess';
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
  const [game, setGameLocal] = useState<PictureGuessGame | null>(null);
  const [gameResults, setGameResults] = useState<PictureGuessResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firestore room ID
  const [roomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Refs for timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join hook
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<PictureGuessPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      score: 0,
      correctGuesses: 0,
      totalGuesses: 0,
      streak: 0,
      hintsUsed: 0,
      status: 'playing' as const,
      isBot: true,
    }),
  });

  // Firestore subscription - updates local state from remote changes
  useEffect(() => {
    if (!roomId) return;
    return subscribeToGameRoom<PictureGuessGame>(roomId, (remoteGame) => {
      if (!remoteGame) {
        setGameLocal(null);
        return;
      }
      setGameLocal(remoteGame);
    });
  }, [roomId]);

  // setGame wrapper: updates local state AND syncs to Firestore
  const setGame = useCallback((
    updater: ((prev: PictureGuessGame | null) => PictureGuessGame | null) | PictureGuessGame | null
  ) => {
    setGameLocal(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;

      if (newState && roomIdRef.current) {
        // Sync to Firestore (fire-and-forget)
        const { id: _id, ...data } = newState;
        updateGameRoom(roomIdRef.current, data as Record<string, unknown>).catch(err =>
          console.error('Failed to sync picture-guess state:', err)
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
  const currentPuzzle = useMemo(() => {
    if (!game || game.currentPuzzleIndex < 0) return null;
    return game.puzzles[game.currentPuzzleIndex] || null;
  }, [game]);

  // Get sorted players by score
  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
  }, [game]);

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
    isHost, currentPlayer, currentPuzzle,
    sortedPlayers,
    timerRef,
    scheduleBotJoin, clearBotTimers,
  };
}
