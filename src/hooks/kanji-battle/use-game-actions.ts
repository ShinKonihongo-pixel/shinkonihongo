// Basic game actions (join, leave, kick, start, reset)
// Join uses Firestore to find and subscribe to remote rooms

import { useCallback } from 'react';
import type { KanjiBattleGame, KanjiBattlePlayer, KanjiBattleResults } from '../../types/kanji-battle';
import { findRoomByCode, updateGameRoom } from '../../services/game-rooms';

interface UseGameActionsProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  game: KanjiBattleGame | null;
  setGame: (game: KanjiBattleGame | null | ((prev: KanjiBattleGame | null) => KanjiBattleGame | null)) => void;
  setGameResults: (results: KanjiBattleResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  clearTimers: () => void;
  startNextRound: () => void;
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
  botTimerRef,
  clearTimers,
  startNextRound,
}: UseGameActionsProps) {
  // Join existing game via Firestore
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const room = await findRoomByCode(code);

      if (!room || room.gameType !== 'kanji-battle') {
        throw new Error('Không tìm thấy phòng Kanji Battle với mã này');
      }

      const roomData = room.data as unknown as KanjiBattleGame;

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
      const player: KanjiBattlePlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        hintsUsed: 0,
        hintsRemaining: roomData.settings?.hintsPerPlayer || 3,
        hasAnswered: false,
        hasShield: false,
        shieldTurns: 0,
        hasDoublePoints: false,
        doublePointsTurns: 0,
        isSlowed: false,
        slowedTurns: 0,
        streak: 0,
      };

      const updatedPlayers = { ...players, [currentUser.id]: player };
      await updateGameRoom(room.id, { players: updatedPlayers });

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
    clearTimers();
    setGame(() => null);
  }, [game, clearTimers, setGame]);

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
  const startGame = useCallback(async () => {
    if (!game || !isHost) return;
    const playerCount = Object.keys(game.players).length;
    if (playerCount < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người chơi`);
      return;
    }
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setGame(prev => prev ? { ...prev, status: 'starting', startedAt: new Date().toISOString() } : null);
    setTimeout(() => { startNextRound(); }, 3000);
  }, [game, isHost, setError, botTimerRef, setGame, startNextRound]);

  // Reset game
  const resetGame = useCallback(() => {
    clearTimers();
    setGame(() => null);
    setGameResults(null);
  }, [clearTimers, setGame, setGameResults]);

  return { joinGame, leaveGame, kickPlayer, startGame, resetGame };
}
