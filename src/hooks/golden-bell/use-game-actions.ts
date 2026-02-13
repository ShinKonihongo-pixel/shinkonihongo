// Golden Bell Game Actions
// Handles join, leave, kick, start, and reset game actions
// Join uses Firestore to find and subscribe to remote rooms

import { useCallback } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellResults,
} from '../../types/golden-bell';
import { findRoomByCode, updateGameRoom } from '../../services/game-rooms';

interface UseGameActionsProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  game: GoldenBellGame | null;
  setGame: (updater: (prev: GoldenBellGame | null) => GoldenBellGame | null) => void;
  setGameResults: (results: GoldenBellResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
}

export function useGameActions({
  currentUser,
  game,
  setGame,
  setGameResults,
  setLoading,
  setError,
  setRoomId,
  isHost,
  clearBotTimers,
}: UseGameActionsProps) {
  // Join existing game via Firestore
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const room = await findRoomByCode(code);

      if (!room || room.gameType !== 'golden-bell') {
        throw new Error('Không tìm thấy phòng Rung Chuông Vàng với mã này');
      }

      const roomData = room.data as unknown as GoldenBellGame;

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
      const player: GoldenBellPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        status: 'alive',
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
      };

      const updatedPlayers = { ...players, [currentUser.id]: player };
      await updateGameRoom(room.id, {
        players: updatedPlayers,
        alivePlayers: Object.keys(updatedPlayers).length,
      });

      // Subscribe to the room (subscription in use-game-state will update local state)
      setRoomId(room.id);
      setGameResults(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia phòng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, setRoomId, setGameResults, setLoading, setError]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (!game) return;
    clearBotTimers();
    setGame(() => null);
  }, [game, clearBotTimers, setGame]);

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
      setError(`Cần ít nhất ${game.settings.minPlayers} người để bắt đầu`);
      return;
    }

    // Clear bot timers - no more bots once game starts
    clearBotTimers();

    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'starting',
        startedAt: new Date().toISOString(),
      };
    });

    // After countdown, start first question
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'question',
          currentQuestionIndex: 0,
        };
      });

      // Auto-transition to answering after showing question
      setTimeout(() => {
        setGame(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'answering',
            questionStartTime: Date.now(),
          };
        });
      }, 2000);
    }, 3000);
  }, [game, isHost, clearBotTimers, setGame, setError]);

  // Reset game
  const resetGame = useCallback(() => {
    setGame(() => null);
    setGameResults(null);
    setError(null);
  }, [setGame, setGameResults, setError]);

  return {
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    resetGame,
  };
}
