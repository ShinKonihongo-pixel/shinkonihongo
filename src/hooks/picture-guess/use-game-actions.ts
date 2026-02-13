// Game actions: join, leave, start, reset

import { useCallback } from 'react';
import type {
  PictureGuessGame,
  PictureGuessPlayer,
  PictureGuessResults,
} from '../../types/picture-guess';

interface UseGameActionsProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  game: PictureGuessGame | null;
  availableRooms: PictureGuessGame[];
  setGame: (game: PictureGuessGame | null | ((prev: PictureGuessGame | null) => PictureGuessGame | null)) => void;
  setGameResults: (results: PictureGuessResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
}

export function useGameActions({
  currentUser,
  game,
  availableRooms,
  setGame,
  setGameResults,
  setLoading,
  setError,
  isHost,
  clearBotTimers,
}: UseGameActionsProps) {
  // Join existing game
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // In real implementation, this would fetch from server
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

      const player: PictureGuessPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        score: 0,
        correctGuesses: 0,
        totalGuesses: 0,
        streak: 0,
        hintsUsed: 0,
        status: 'playing',
      };

      const updatedGame: PictureGuessGame = {
        ...foundGame,
        players: { ...foundGame.players, [currentUser.id]: player },
      };

      setGame(updatedGame);
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
    setGame(null);
  }, [game, clearBotTimers, setGame]);

  // Start game (host only or single player)
  const startGame = useCallback(() => {
    if (!game) return;
    if (game.settings.mode === 'multiplayer' && !isHost) return;

    const playerCount = Object.keys(game.players).length;
    if (game.settings.mode === 'multiplayer' && playerCount < 2) {
      setError('Cần ít nhất 2 người để bắt đầu chế độ nhiều người');
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

    // After countdown, start first puzzle
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'showing',
          currentPuzzleIndex: 0,
        };
      });

      // Auto-transition to guessing after showing image
      setTimeout(() => {
        setGame(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'guessing',
            puzzleStartTime: Date.now(),
          };
        });
      }, 2000);
    }, 3000);
  }, [game, isHost, clearBotTimers, setGame, setError]);

  // Reset game
  const resetGame = useCallback(() => {
    setGame(null);
    setGameResults(null);
    setError(null);
  }, [setGame, setGameResults, setError]);

  return {
    joinGame,
    leaveGame,
    startGame,
    resetGame,
  };
}
