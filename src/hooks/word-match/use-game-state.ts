// Word Match game state — thin wrapper around shared useGameRoomState

import { useRef, useEffect } from 'react';
import type { WordMatchGame, WordMatchResults, WordMatchPlayer } from '../../types/word-match';
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
  } = useGameRoomState<WordMatchGame, WordMatchResults>(
    currentUserId,
    { gameLabel: 'word-match' },
  );

  // Game-specific timer
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join
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
