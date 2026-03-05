// Kanji Drop game state — thin wrapper around shared useGameRoomState

import { useEffect, useRef } from 'react';
import type { KanjiDropMultiplayerGame, KanjiDropMultiplayerResults, KanjiDropMultiplayerPlayer } from '../../components/pages/kanji-drop/kanji-drop-multiplayer-types';
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
  } = useGameRoomState<KanjiDropMultiplayerGame, KanjiDropMultiplayerResults>(
    currentUserId,
    {
      gameLabel: 'kanji-drop',
      sortPlayers: (players) =>
        [...players].sort((a, b) => {
          const pa = a as unknown as KanjiDropMultiplayerPlayer;
          const pb = b as unknown as KanjiDropMultiplayerPlayer;
          // Finished players first (by finishedAt asc), then by levelsCompleted desc, then score desc
          if (pa.finishedAt && !pb.finishedAt) return -1;
          if (!pa.finishedAt && pb.finishedAt) return 1;
          if (pa.finishedAt && pb.finishedAt) return pa.finishedAt.localeCompare(pb.finishedAt);
          if ((pb.levelsCompleted ?? 0) !== (pa.levelsCompleted ?? 0)) return (pb.levelsCompleted ?? 0) - (pa.levelsCompleted ?? 0);
          return (pb.score ?? 0) - (pa.score ?? 0);
        }),
    },
  );

  // Bot auto-join
  const { scheduleBotJoin, clearBotTimers } = useBotAutoJoin<KanjiDropMultiplayerPlayer>({
    createBotPlayer: (bot, botId) => ({
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      score: 0,
      currentLevel: 0,
      clearedCount: 0,
      levelsCompleted: 0,
      isBot: true,
      botIntelligence: bot.intelligence,
    }),
    schedules: [{ delay: 5000, count: 1 }],
  });

  // Cleanup ref
  const cleanupRef = useRef(false);
  useEffect(() => {
    return () => { cleanupRef.current = true; };
  }, []);

  return {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    scheduleBotJoin, clearBotTimers,
    deleteCurrentRoom,
  };
}
