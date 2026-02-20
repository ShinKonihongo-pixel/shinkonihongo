// Image-Word game state — thin wrapper around shared useGameRoomState

import { useRef, useEffect } from 'react';
import type { ImageWordMultiplayerGame, ImageWordMultiplayerResults, ImageWordMultiplayerPlayer } from '../../types/image-word';
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
  } = useGameRoomState<ImageWordMultiplayerGame, ImageWordMultiplayerResults>(
    currentUserId,
    { gameLabel: 'image-word' },
  );

  // Game-specific timer
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<ImageWordMultiplayerPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      score: 0,
      matchedPairs: [],
      wrongAttempts: 0,
      isComplete: false,
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
