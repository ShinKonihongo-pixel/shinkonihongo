// Generic game actions — join, leave, kick, start, reset
// Replaces identical use-game-actions.ts files across 6 games

import { useCallback } from 'react';
import type { BaseGame, BasePlayer, GameUser, SetGame } from './game-types';
import { findRoomByCode, updateGameRoom } from '../../services/game-rooms';

type LeaveStrategy = 'delete-room' | 'remove-self';

interface UseGameRoomActionsConfig<TGame extends BaseGame, TPlayer extends BasePlayer> {
  /** Firestore gameType key, e.g. 'image-word' */
  gameType: string;
  /** Human-readable game name for error messages, e.g. 'Nối Hình - Từ' */
  gameName: string;
  /** Create the player record added when joining a room */
  createJoinPlayer: (user: GameUser, roomData: TGame) => TPlayer;
  /** Called after 3s countdown instead of default `status: 'playing'` */
  onAfterStart?: () => void;
  /** Function to clear all game-specific timers */
  clearTimersFn?: () => void;
  /** How non-host leave works. Default: 'delete-room' (host deletes room) */
  leaveStrategy?: LeaveStrategy;
  /** Extra update data when a player joins (e.g. alivePlayers count) */
  getJoinUpdateData?: (roomData: TGame, updatedPlayers: Record<string, TPlayer>) => Record<string, unknown>;
  /** Custom leave handler for 'remove-self' strategy */
  onRemoveSelf?: (game: TGame, userId: string, roomId: string) => void;
}

interface UseGameRoomActionsProps<TGame extends BaseGame, TResults> {
  game: TGame | null;
  currentUser: GameUser;
  setGame: SetGame<TGame>;
  setGameResults: (results: TResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  roomId?: string | null;
  isHost: boolean;
  clearBotTimers?: () => void;
  deleteCurrentRoom: () => void;
  clearLocalGameState?: () => void;
}

export function useGameRoomActions<
  TGame extends BaseGame,
  TPlayer extends BasePlayer,
  TResults = unknown,
>(
  props: UseGameRoomActionsProps<TGame, TResults>,
  config: UseGameRoomActionsConfig<TGame, TPlayer>,
) {
  const {
    game, currentUser, setGame, setGameResults,
    setLoading, setError, setRoomId, roomId,
    isHost, clearBotTimers, deleteCurrentRoom, clearLocalGameState,
  } = props;

  const {
    gameType, gameName, createJoinPlayer, onAfterStart,
    clearTimersFn, leaveStrategy = 'delete-room',
    getJoinUpdateData, onRemoveSelf,
  } = config;

  // Join game via Firestore
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const room = await findRoomByCode(code);

      if (!room || room.gameType !== gameType) {
        throw new Error(`Không tìm thấy phòng ${gameName} với mã này`);
      }

      const roomData = room.data as unknown as TGame;

      if (roomData.status !== 'waiting') {
        throw new Error('Trò chơi đã bắt đầu');
      }

      const players = roomData.players || {};
      if (Object.keys(players).length >= (roomData.settings?.maxPlayers || 20)) {
        throw new Error('Phòng đã đầy');
      }

      // Already in the game? Just subscribe
      if (players[currentUser.id]) {
        setRoomId(room.id);
        return;
      }

      // Add player to the room via Firestore
      const player = createJoinPlayer(currentUser, roomData);
      const updatedPlayers = { ...players, [currentUser.id]: player } as Record<string, TPlayer>;

      const updateData: Record<string, unknown> = {
        players: updatedPlayers,
        ...(getJoinUpdateData ? getJoinUpdateData(roomData, updatedPlayers) : {}),
      };

      await updateGameRoom(room.id, updateData);

      setRoomId(room.id);
      setGameResults(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia phòng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, gameType, gameName, createJoinPlayer, getJoinUpdateData, setRoomId, setGameResults, setLoading, setError]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (!game) return;
    clearBotTimers?.();
    clearTimersFn?.();

    if (leaveStrategy === 'remove-self' && !isHost) {
      // Non-host: remove self, keep room alive
      if (onRemoveSelf && roomId) {
        onRemoveSelf(game, currentUser.id, roomId);
      }
      clearLocalGameState?.();
    } else {
      // Host or default: delete room
      deleteCurrentRoom();
      setGame(() => null);
    }
  }, [game, isHost, roomId, currentUser.id, clearBotTimers, clearTimersFn, leaveStrategy, onRemoveSelf, deleteCurrentRoom, setGame, clearLocalGameState]);

  // Kick player (host only)
  const kickPlayer = useCallback((playerId: string) => {
    if (!game || !isHost || playerId === currentUser.id) return;

    setGame(prev => {
      if (!prev) return null;
      const { [playerId]: _removed, ...remainingPlayers } = prev.players;
      return { ...prev, players: remainingPlayers };
    });
  }, [game, currentUser, isHost, setGame]);

  // Start game (host only)
  const startGame = useCallback(() => {
    if (!game || !isHost) return;

    const playerCount = Object.keys(game.players).length;
    if (playerCount < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người chơi`);
      return;
    }

    clearBotTimers?.();

    setGame(prev => prev ? { ...prev, status: 'starting', startedAt: new Date().toISOString() } as TGame : null);

    setTimeout(() => {
      if (onAfterStart) {
        onAfterStart();
      } else {
        setGame(prev => prev ? { ...prev, status: 'playing' } as TGame : null);
      }
    }, 3000);
  }, [game, isHost, setError, clearBotTimers, setGame, onAfterStart]);

  // Reset game
  const resetGame = useCallback(() => {
    clearBotTimers?.();
    clearTimersFn?.();
    deleteCurrentRoom();
    setGame(() => null);
    setGameResults(null);
    setError(null);
  }, [clearBotTimers, clearTimersFn, deleteCurrentRoom, setGame, setGameResults, setError]);

  return {
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    resetGame,
  };
}
