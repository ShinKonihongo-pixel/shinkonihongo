// Word Scramble game state — thin wrapper around shared useGameRoomState

import { useRef, useEffect } from 'react';
import type { WordScrambleMultiplayerGame, WordScrambleMultiplayerResults, WordScrambleMultiplayerPlayer } from '../../components/pages/word-scramble/word-scramble-types';
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
  } = useGameRoomState<WordScrambleMultiplayerGame, WordScrambleMultiplayerResults>(
    currentUserId,
    { gameLabel: 'word-scramble' },
  );

  // Game-specific timer
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<WordScrambleMultiplayerPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      streak: 0,
      maxStreak: 0,
      isBot: true,
    }),
    schedules: [{ delay: 5000, count: 1 }],
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  return {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    roundTimerRef,
    scheduleBotJoin, clearBotTimers,
    deleteCurrentRoom,
  };
}
