// Word Scramble game state management
// Game state is synced to Firestore for cross-device multiplayer

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { WordScrambleMultiplayerGame, WordScrambleMultiplayerResults, WordScrambleMultiplayerPlayer } from '../../components/pages/word-scramble/word-scramble-types';
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
  const [game, setGameLocal] = useState<WordScrambleMultiplayerGame | null>(null);
  const [gameResults, setGameResults] = useState<WordScrambleMultiplayerResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<WordScrambleMultiplayerPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      streak: 0,
      maxStreak: 0,
      isBot: true,
    }),
    schedules: [{ delay: 5000, count: 1 }],
  });

  const isHost = useMemo(() => game?.hostId === currentUserId, [game, currentUserId]);
  const currentPlayer = useMemo(() => game?.players[currentUserId], [game, currentUserId]);

  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
  }, [game]);

  // Firestore subscription
  useEffect(() => {
    if (!roomId) return;
    return subscribeToGameRoom<WordScrambleMultiplayerGame>(roomId, (remoteGame) => {
      if (!remoteGame) {
        setGameLocal(null);
        return;
      }
      setGameLocal(remoteGame);
    });
  }, [roomId]);

  // setGame wrapper: updates local state AND syncs to Firestore
  const setGame = useCallback((
    updater: ((prev: WordScrambleMultiplayerGame | null) => WordScrambleMultiplayerGame | null) | WordScrambleMultiplayerGame | null
  ) => {
    setGameLocal(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;

      if (newState && roomIdRef.current) {
        const { id: _id, ...data } = newState;
        updateGameRoom(roomIdRef.current, data as Record<string, unknown>).catch(err =>
          console.error('Failed to sync word-scramble state:', err)
        );
      } else if (!newState && roomIdRef.current) {
        deleteGameRoom(roomIdRef.current).catch(console.error);
        roomIdRef.current = null;
        setRoomId(null);
      }

      return newState;
    });
  }, []);

  // Delete current room directly (before unmount)
  const deleteCurrentRoom = useCallback(() => {
    const id = roomIdRef.current;
    if (id) {
      deleteGameRoom(id).catch(console.error);
      roomIdRef.current = null;
      setRoomId(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  return {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    roundTimerRef,
    scheduleBotJoin, clearBotTimers,
    deleteCurrentRoom,
  };
}
