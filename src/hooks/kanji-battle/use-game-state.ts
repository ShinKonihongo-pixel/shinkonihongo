// Game state management hook
// Game state is synced to Firestore for cross-device multiplayer

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { KanjiBattleGame, KanjiBattleResults } from '../../types/kanji-battle';
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
  const [game, setGameLocal] = useState<KanjiBattleGame | null>(null);
  const [gameResults, setGameResults] = useState<KanjiBattleResults | null>(null);
  const [availableRooms] = useState<KanjiBattleGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firestore room ID
  const [roomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Refs for timers
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Firestore subscription - updates local state from remote changes
  useEffect(() => {
    if (!roomId) return;
    return subscribeToGameRoom<KanjiBattleGame>(roomId, (remoteGame) => {
      if (!remoteGame) {
        setGameLocal(null);
        return;
      }
      setGameLocal(remoteGame);
    });
  }, [roomId]);

  // setGame wrapper: updates local state AND syncs to Firestore
  const setGame = useCallback((
    updater: ((prev: KanjiBattleGame | null) => KanjiBattleGame | null) | KanjiBattleGame | null
  ) => {
    setGameLocal(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;

      if (newState && roomIdRef.current) {
        // Sync to Firestore (fire-and-forget)
        const { id: _id, ...data } = newState;
        updateGameRoom(roomIdRef.current, data as Record<string, unknown>).catch(err =>
          console.error('Failed to sync kanji-battle state:', err)
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

  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
  }, [game]);

  const isSkillPhase = useMemo(() => {
    if (!game || !game.settings.skillsEnabled) return false;
    return game.currentRound > 0 && game.currentRound % game.settings.skillInterval === 0;
  }, [game]);

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

  // Cleanup timers on unmount
  useEffect(() => {
    const botTimer = botTimerRef.current;
    const roundTimer = roundTimerRef.current;
    const botAnswerTimer = botAnswerTimerRef.current;
    return () => {
      if (botTimer) clearTimeout(botTimer);
      if (roundTimer) clearTimeout(roundTimer);
      if (botAnswerTimer) clearTimeout(botAnswerTimer);
    };
  }, []);

  const clearTimers = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);
  };

  return {
    game, setGame,
    gameResults, setGameResults,
    availableRooms,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers, isSkillPhase,
    botTimerRef, roundTimerRef, botAnswerTimerRef,
    clearTimers,
    deleteCurrentRoom,
  };
}
