// Basic game actions (join, leave, kick, start, reset)

import { useCallback } from 'react';
import type { KanjiBattleGame } from '../../types/kanji-battle';

interface UseGameActionsProps {
  currentUser: { id: string };
  game: KanjiBattleGame | null;
  setGame: (game: KanjiBattleGame | null | ((prev: KanjiBattleGame | null) => KanjiBattleGame | null)) => void;
  setGameResults: (results: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
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
  isHost,
  botTimerRef,
  clearTimers,
  startNextRound,
}: UseGameActionsProps) {
  const joinGame = useCallback(async (_code: string) => {
    setLoading(true);
    setError(null);
    try {
      throw new Error('Chức năng tham gia phòng đang phát triển');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const leaveGame = useCallback(() => {
    clearTimers();
    setGame(null);
    setGameResults(null);
  }, [clearTimers, setGame, setGameResults]);

  const kickPlayer = useCallback((playerId: string) => {
    if (!game || !isHost || playerId === currentUser.id) return;
    setGame(prev => {
      if (!prev) return null;
      const { [playerId]: _, ...remainingPlayers } = prev.players;
      return { ...prev, players: remainingPlayers };
    });
  }, [game, currentUser, isHost, setGame]);

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

  const resetGame = useCallback(() => {
    clearTimers();
    setGame(null);
    setGameResults(null);
  }, [clearTimers, setGame, setGameResults]);

  return { joinGame, leaveGame, kickPlayer, startGame, resetGame };
}
