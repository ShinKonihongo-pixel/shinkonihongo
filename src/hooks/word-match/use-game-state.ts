// Word match game state management

import { useState, useMemo, useEffect, useRef } from 'react';
import type { WordMatchGame, WordMatchResults, WordMatchPlayer } from '../../types/word-match';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';
import { useBotAutoJoin } from '../shared/use-bot-auto-join';

interface UseGameStateProps {
  currentUserId: string;
}

export function useGameState({ currentUserId }: UseGameStateProps) {
  // State
  const [game, setGame] = useState<WordMatchGame | null>(null);
  const [gameResults, setGameResults] = useState<WordMatchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timers
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join hook
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<WordMatchPlayer>({
    createBotPlayer: (bot, botId) => ({
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
    }),
    schedules: [{ delay: 5000, count: 1 }],
  });

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUserId, [game, currentUserId]);
  const currentPlayer = useMemo(() => game?.players[currentUserId], [game, currentUserId]);

  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
  }, [game]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  return {
    game,
    setGame,
    gameResults,
    setGameResults,
    loading,
    setLoading,
    error,
    setError,
    isHost,
    currentPlayer,
    sortedPlayers,
    roundTimerRef,
    scheduleBotJoin,
    clearBotTimers,
  };
}
