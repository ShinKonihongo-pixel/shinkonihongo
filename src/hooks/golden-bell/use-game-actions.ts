// Golden Bell Game Actions
// Handles join, leave, kick, start, and reset game actions

import { useCallback } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellResults,
} from '../../types/golden-bell';

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
  availableRooms: GoldenBellGame[];
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
  availableRooms,
  isHost,
  clearBotTimers,
}: UseGameActionsProps) {
  // Join existing game
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // In real implementation, this would fetch from server
      // For demo, we'll simulate joining
      const foundGame = availableRooms.find(r => r.code === code);

      if (!foundGame) {
        throw new Error('Không tìm thấy phòng với mã này');
      }

      if (foundGame.status !== 'waiting') {
        throw new Error('Trò chơi đã bắt đầu');
      }

      if (Object.keys(foundGame.players).length >= foundGame.settings.maxPlayers) {
        throw new Error('Phòng đã đầy');
      }

      const player: GoldenBellPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        status: 'alive',
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
      };

      const updatedGame: GoldenBellGame = {
        ...foundGame,
        players: { ...foundGame.players, [currentUser.id]: player },
        alivePlayers: foundGame.alivePlayers + 1,
      };

      setGame(() => updatedGame);
      setGameResults(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia phòng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, availableRooms, setGame, setGameResults, setLoading, setError]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (!game) return;
    clearBotTimers();
    // In a real implementation, this would update the server
    // For now, just clear the local game state
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
