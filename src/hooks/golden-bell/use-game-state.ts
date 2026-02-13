// Golden Bell Game State Management
// Manages all state, computed values, and timer refs

import { useState, useMemo, useEffect, useRef } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellResults,
} from '../../types/golden-bell';
import { useBotAutoJoin } from '../shared/use-bot-auto-join';

interface UseGameStateProps {
  currentUserId: string;
}

export function useGameState({ currentUserId }: UseGameStateProps) {
  // Game state
  const [game, setGame] = useState<GoldenBellGame | null>(null);
  const [gameResults, setGameResults] = useState<GoldenBellResults | null>(null);
  const [availableRooms] = useState<GoldenBellGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join hook
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<GoldenBellPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      status: 'alive' as const,
      correctAnswers: 0,
      totalAnswers: 0,
      streak: 0,
      isBot: true,
    }),
    transformAfterJoin: (game) => ({
      ...game,
      alivePlayers: Object.keys(game.players).length,
    }),
  });

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUserId, [game, currentUserId]);
  const currentPlayer = useMemo(() => game?.players[currentUserId], [game, currentUserId]);
  const currentQuestion = useMemo(() => {
    if (!game || game.currentQuestionIndex < 0) return null;
    return game.questions[game.currentQuestionIndex] || null;
  }, [game]);

  // Get sorted players by status and correct answers
  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => {
      // Alive players first
      if (a.status === 'alive' && b.status !== 'alive') return -1;
      if (b.status === 'alive' && a.status !== 'alive') return 1;
      // Then by correct answers
      return b.correctAnswers - a.correctAnswers;
    });
  }, [game]);

  // Count alive players
  const aliveCount = useMemo(() => {
    if (!game) return 0;
    return Object.values(game.players).filter(p => p.status === 'alive').length;
  }, [game]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timer = timerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return {
    game, setGame,
    gameResults, setGameResults,
    availableRooms,
    loading, setLoading,
    error, setError,
    isHost, currentPlayer, currentQuestion,
    sortedPlayers, aliveCount,
    timerRef,
    scheduleBotJoin, clearBotTimers,
  };
}
