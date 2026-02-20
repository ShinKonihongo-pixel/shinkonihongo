// Game actions: join, leave, start, reset
// Join uses Firestore to find and subscribe to remote rooms

import { useCallback } from 'react';
import type {
  PictureGuessGame,
  PictureGuessPlayer,
  PictureGuessResults,
} from '../../types/picture-guess';
import { findRoomByCode, updateGameRoom } from '../../services/game-rooms';

interface UseGameActionsProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  game: PictureGuessGame | null;
  setGame: (updater: (prev: PictureGuessGame | null) => PictureGuessGame | null) => void;
  setGameResults: (results: PictureGuessResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
  deleteCurrentRoom: () => void;
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
  deleteCurrentRoom,
}: UseGameActionsProps) {
  // Join existing game via Firestore
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const room = await findRoomByCode(code);

      if (!room || room.gameType !== 'picture-guess') {
        throw new Error('Không tìm thấy phòng Picture Guess với mã này');
      }

      const roomData = room.data as unknown as PictureGuessGame;

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
      const player: PictureGuessPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        correctGuesses: 0,
        totalGuesses: 0,
        streak: 0,
        hintsUsed: 0,
        status: 'playing',
      };

      const updatedPlayers = { ...players, [currentUser.id]: player };
      await updateGameRoom(room.id, {
        players: updatedPlayers,
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

  // Leave game — delete Firestore room directly (not via state updater)
  // because onClose() may unmount the component before React processes the updater
  const leaveGame = useCallback(() => {
    if (!game) return;
    clearBotTimers();
    deleteCurrentRoom(); // Direct Firestore deletion (sets roomIdRef to null)
    setGame(() => null); // Local cleanup only (roomIdRef is null, so wrapper skips delete)
  }, [game, clearBotTimers, deleteCurrentRoom, setGame]);

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

  // Reset game — direct Firestore deletion for same reason as leaveGame
  const resetGame = useCallback(() => {
    clearBotTimers();
    deleteCurrentRoom();
    setGame(() => null);
    setGameResults(null);
    setError(null);
  }, [clearBotTimers, deleteCurrentRoom, setGame, setGameResults, setError]);

  return {
    joinGame,
    leaveGame,
    startGame,
    resetGame,
  };
}
