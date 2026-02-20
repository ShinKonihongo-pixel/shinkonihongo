// Picture Guess game state — thin wrapper around shared useGameRoomState

import { useRef, useMemo, useEffect } from 'react';
import type { PictureGuessGame, PictureGuessPlayer, PictureGuessResults } from '../../types/picture-guess';
import { useGameRoomState } from '../shared/use-game-room-state';
import { useBotAutoJoin } from '../shared/use-bot-auto-join';

export function useGameState({ currentUserId }: { currentUserId: string }) {
  const {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    deleteCurrentRoom,
  } = useGameRoomState<PictureGuessGame, PictureGuessResults>(
    currentUserId,
    { gameLabel: 'picture-guess' },
  );

  // Game-specific timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join
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

  // Game-specific computed: current puzzle
  const currentPuzzle = useMemo(() => {
    if (!game || game.currentPuzzleIndex < 0) return null;
    return game.puzzles[game.currentPuzzleIndex] || null;
  }, [game]);

  // Cleanup timer on unmount
  useEffect(() => {
    const timer = timerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer, currentPuzzle,
    sortedPlayers,
    timerRef,
    scheduleBotJoin, clearBotTimers,
    deleteCurrentRoom,
  };
}
