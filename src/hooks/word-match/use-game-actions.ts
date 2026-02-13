// Word match game actions - join, leave, kick, start, add bot, reset

import { useCallback } from 'react';
import type { WordMatchGame, WordMatchPlayer, WordMatchResults } from '../../types/word-match';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';

interface UseGameActionsProps {
  game: WordMatchGame | null;
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  setGame: (game: WordMatchGame | null | ((prev: WordMatchGame | null) => WordMatchGame | null)) => void;
  setGameResults: (results: WordMatchResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
  roundTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  startNextRound: () => void;
}

export function useGameActions({
  game,
  currentUser,
  setGame,
  setGameResults,
  setLoading,
  setError,
  isHost,
  clearBotTimers,
  roundTimerRef,
  startNextRound,
}: UseGameActionsProps) {
  // Join game
  const joinGame = useCallback(async (_code: string) => {
    void _code; // Placeholder for future implementation
    setLoading(true);
    setError(null);
    try {
      throw new Error('Chức năng tham gia phòng đang phát triển');
    } catch (_err) {
      setError(_err instanceof Error ? _err.message : 'Không thể tham gia');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Leave game
  const leaveGame = useCallback(() => {
    clearBotTimers();
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    setGame(null);
    setGameResults(null);
  }, [clearBotTimers, roundTimerRef, setGame, setGameResults]);

  // Kick player (host only)
  const kickPlayer = useCallback((playerId: string) => {
    if (!game || !isHost || playerId === currentUser.id) return;

    setGame(prev => {
      if (!prev) return null;
      const { [playerId]: _removed, ...remainingPlayers } = prev.players;
      return { ...prev, players: remainingPlayers };
    });
  }, [game, currentUser, isHost, setGame]);

  // Start game
  const startGame = useCallback(async () => {
    if (!game || !isHost) return;

    const playerCount = Object.keys(game.players).length;
    if (playerCount < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người chơi`);
      return;
    }

    clearBotTimers();

    setGame(prev => prev ? { ...prev, status: 'starting', startedAt: new Date().toISOString() } : null);

    // Start first round after countdown
    setTimeout(() => {
      startNextRound();
    }, 3000);
  }, [game, isHost, setError, clearBotTimers, setGame, startNextRound]);

  // Add bot manually (for "Add Bot" button)
  const addBot = useCallback(() => {
    setGame(prev => {
      if (!prev || prev.status !== 'waiting') return prev;

      const currentCount = Object.keys(prev.players).length;
      if (currentCount >= prev.settings.maxPlayers) return prev;

      const bots = generateBots(1);
      const bot = bots[0];
      const botId = `bot-${generateId()}`;

      const newPlayers = { ...prev.players };
      newPlayers[botId] = {
        odinhId: botId,
        displayName: bot.name,
        avatar: bot.avatar,
        score: 0,
        correctPairs: 0,
        perfectRounds: 0,
        isDisconnected: false,
        disconnectedTurns: 0,
        hasShield: false,
        shieldTurns: 0,
        isChallenged: false,
        currentMatches: [],
        hasSubmitted: false,
        streak: 0,
        isBot: true,
      };

      return { ...prev, players: newPlayers };
    });
  }, [setGame]);

  // Reset
  const resetGame = useCallback(() => {
    clearBotTimers();
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    setGame(null);
    setGameResults(null);
  }, [clearBotTimers, roundTimerRef, setGame, setGameResults]);

  return {
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    addBot,
    resetGame,
  };
}
