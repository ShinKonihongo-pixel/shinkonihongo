// Generic Firestore-synced game state
// Replaces identical use-game-state.ts files across 6 games

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { BaseGame, BasePlayer, SetGame } from './game-types';
import {
  updateGameRoom,
  deleteGameRoom,
  subscribeToGameRoom,
} from '../../services/game-rooms';

interface UseGameRoomStateConfig<TGame extends BaseGame> {
  /** Label for console error messages, e.g. 'image-word' */
  gameLabel: string;
  /** Optional custom sort for sortedPlayers. Default: descending by score */
  sortPlayers?: (players: BasePlayer[]) => BasePlayer[];
}

export function useGameRoomState<
  TGame extends BaseGame,
  TResults = unknown,
>(
  currentUserId: string,
  config: UseGameRoomStateConfig<TGame>,
) {
  const { gameLabel, sortPlayers } = config;

  // Core state
  const [game, setGameLocal] = useState<TGame | null>(null);
  const [gameResults, setGameResults] = useState<TResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firestore room ID
  const [roomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Firestore subscription
  useEffect(() => {
    if (!roomId) return;
    return subscribeToGameRoom<TGame>(roomId, (remoteGame) => {
      if (!remoteGame) {
        setGameLocal(null);
        return;
      }
      setGameLocal(remoteGame);
    });
  }, [roomId]);

  // setGame wrapper: updates local state AND syncs to Firestore
  const setGame: SetGame<TGame> = useCallback((updater) => {
    setGameLocal(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;

      if (newState && roomIdRef.current) {
        const { id: _id, ...data } = newState;
        updateGameRoom(roomIdRef.current, data as Record<string, unknown>).catch(err =>
          console.error(`Failed to sync ${gameLabel} state:`, err)
        );
      } else if (!newState && roomIdRef.current) {
        deleteGameRoom(roomIdRef.current).catch(console.error);
        roomIdRef.current = null;
        setRoomId(null);
      }

      return newState;
    });
  }, [gameLabel]);

  // Delete current Firestore room directly (safe before unmount)
  const deleteCurrentRoom = useCallback(() => {
    const id = roomIdRef.current;
    if (id) {
      deleteGameRoom(id).catch(console.error);
      roomIdRef.current = null;
      setRoomId(null);
    }
  }, []);

  // Clear local state without triggering Firestore room deletion
  // Used when non-host leaves (removes self from players, keeps room alive)
  const clearLocalGameState = useCallback(() => {
    setGameLocal(null);
    roomIdRef.current = null;
    setRoomId(null);
  }, []);

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUserId, [game, currentUserId]);
  const currentPlayer = useMemo(() => game?.players[currentUserId], [game, currentUserId]);

  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    const players = Object.values(game.players);
    if (sortPlayers) return sortPlayers(players as BasePlayer[]);
    return players.sort((a, b) => ((b as any).score ?? 0) - ((a as any).score ?? 0));
  }, [game, sortPlayers]);

  return {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    deleteCurrentRoom,
    clearLocalGameState,
  };
}
