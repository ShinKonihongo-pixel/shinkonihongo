// Golden Bell game state — thin wrapper around shared useGameRoomState
// Custom sort (alive first), aliveCount, currentQuestion, clearLocalGameState

import { useRef, useMemo, useEffect } from 'react';
import type { GoldenBellGame, GoldenBellPlayer, GoldenBellResults } from '../../types/golden-bell';
import type { BasePlayer } from '../shared/game-types';
import { useGameRoomState } from '../shared/use-game-room-state';
import { useBotAutoJoin } from '../shared/use-bot-auto-join';

// Golden Bell sorts: alive first, then by correctAnswers
const sortGoldenBellPlayers = (players: BasePlayer[]) => {
  return [...players].sort((a, b) => {
    const pa = a as unknown as GoldenBellPlayer;
    const pb = b as unknown as GoldenBellPlayer;
    if (pa.status === 'alive' && pb.status !== 'alive') return -1;
    if (pb.status === 'alive' && pa.status !== 'alive') return 1;
    return pb.correctAnswers - pa.correctAnswers;
  });
};

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
    clearLocalGameState,
  } = useGameRoomState<GoldenBellGame, GoldenBellResults>(
    currentUserId,
    { gameLabel: 'golden-bell', sortPlayers: sortGoldenBellPlayers },
  );

  // Game-specific timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bot auto-join
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
      botIntelligence: bot.intelligence,
      skills: [],
    }),
    transformAfterJoin: (game) => {
      const updated = {
        ...game,
        alivePlayers: Object.keys(game.players).length,
      };
      // Auto-assign bots to teams in team mode
      // Cast to GoldenBellGame to access teams field (generic BaseGame doesn't have it)
      const gbGame = updated as unknown as GoldenBellGame;
      if (gbGame.teams) {
        const teams = { ...gbGame.teams };
        const teamIds = Object.keys(teams);
        Object.entries(updated.players).forEach(([pid, player]) => {
          const gbPlayer = player as unknown as GoldenBellPlayer;
          if (gbPlayer.isBot && !gbPlayer.teamId && teamIds.length > 0) {
            let smallestId = teamIds[0];
            let smallestCount = Infinity;
            teamIds.forEach(tid => {
              if ((teams[tid].members?.length || 0) < smallestCount) {
                smallestCount = teams[tid].members?.length || 0;
                smallestId = tid;
              }
            });
            teams[smallestId] = {
              ...teams[smallestId],
              members: [...(teams[smallestId].members || []), pid],
              aliveCount: (teams[smallestId].aliveCount || 0) + 1,
            };
            (updated.players[pid] as unknown as GoldenBellPlayer).teamId = smallestId;
          }
        });
        (updated as unknown as GoldenBellGame).teams = teams;
      }
      return updated;
    },
  });

  // Game-specific computed values
  const currentQuestion = useMemo(() => {
    if (!game || game.currentQuestionIndex < 0) return null;
    return game.questions[game.currentQuestionIndex] || null;
  }, [game]);

  const aliveCount = useMemo(() => {
    if (!game) return 0;
    return Object.values(game.players).filter(p => p.status === 'alive').length;
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
    isHost, currentPlayer, currentQuestion,
    sortedPlayers, aliveCount,
    timerRef,
    scheduleBotJoin, clearBotTimers,
    deleteCurrentRoom, clearLocalGameState,
  };
}
