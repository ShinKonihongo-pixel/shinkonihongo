// Game state management for Picture Guess

import { useState, useMemo, useEffect, useRef } from 'react';
import type {
  PictureGuessGame,
  PictureGuessPlayer,
  PictureGuessResults,
} from '../../types/picture-guess';
import { useBotAutoJoin } from '../shared/use-bot-auto-join';

interface UseGameStateProps {
  currentUserId: string;
}

export function useGameState({ currentUserId }: UseGameStateProps) {
  // Game state
  const [game, setGame] = useState<PictureGuessGame | null>(null);
  const [gameResults, setGameResults] = useState<PictureGuessResults | null>(null);
  const [availableRooms] = useState<PictureGuessGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join hook
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<PictureGuessPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      score: 0,
      correctGuesses: 0,
      totalGuesses: 0,
      streak: 0,
      hintsUsed: 0,
      status: 'playing' as const,
      isBot: true,
    }),
  });

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUserId, [game, currentUserId]);
  const currentPlayer = useMemo(() => game?.players[currentUserId], [game, currentUserId]);
  const currentPuzzle = useMemo(() => {
    if (!game || game.currentPuzzleIndex < 0) return null;
    return game.puzzles[game.currentPuzzleIndex] || null;
  }, [game]);

  // Get sorted players by score
  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
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
    timerRef,
    isHost, currentPlayer, currentPuzzle,
    sortedPlayers,
    scheduleBotJoin, clearBotTimers,
  };
}
