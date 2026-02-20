// Golden Bell game actions — thin wrapper around shared useGameRoomActions
// Non-host leave removes self (keeps room alive), team auto-assign on join

import { useCallback } from 'react';
import type { GoldenBellGame, GoldenBellPlayer, GoldenBellResults } from '../../types/golden-bell';
import type { GameUser, SetGame } from '../shared/game-types';
import { useGameRoomActions } from '../shared/use-game-room-actions';
import { updateGameRoom } from '../../services/game-rooms';

interface UseGameActionsProps {
  currentUser: GameUser;
  game: GoldenBellGame | null;
  setGame: SetGame<GoldenBellGame>;
  setGameResults: (results: GoldenBellResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  roomId: string | null;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
  deleteCurrentRoom: () => void;
  clearLocalGameState: () => void;
}

export function useGameActions({
  currentUser, game, setGame, setGameResults,
  setLoading, setError, roomId, setRoomId,
  isHost, clearBotTimers, deleteCurrentRoom, clearLocalGameState,
}: UseGameActionsProps) {
  // Custom start: question → answering transitions
  const onAfterStart = useCallback(() => {
    setGame(prev => {
      if (!prev) return null;
      return { ...prev, status: 'question', currentQuestionIndex: 0 };
    });

    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return { ...prev, status: 'answering', questionStartTime: Date.now() };
      });
    }, 2000);
  }, [setGame]);

  // Non-host removes self from players + team
  const onRemoveSelf = useCallback((g: GoldenBellGame, userId: string, rid: string) => {
    const { [userId]: _removed, ...remainingPlayers } = g.players;
    const updateData: Record<string, unknown> = {
      players: remainingPlayers,
      alivePlayers: Object.keys(remainingPlayers).length,
    };

    // Also remove from team if in team mode
    if (g.teams) {
      const updatedTeams = { ...g.teams };
      Object.keys(updatedTeams).forEach(tid => {
        const team = updatedTeams[tid];
        if (team.members.includes(userId)) {
          updatedTeams[tid] = {
            ...team,
            members: team.members.filter((m: string) => m !== userId),
            aliveCount: Math.max(0, team.aliveCount - 1),
          };
        }
      });
      updateData.teams = updatedTeams;
    }

    updateGameRoom(rid, updateData).catch(console.error);
  }, []);

  const { joinGame, leaveGame, kickPlayer, startGame, resetGame } = useGameRoomActions<
    GoldenBellGame,
    GoldenBellPlayer,
    GoldenBellResults
  >(
    {
      game, currentUser, setGame, setGameResults,
      setLoading, setError, setRoomId, roomId,
      isHost, clearBotTimers, deleteCurrentRoom, clearLocalGameState,
    },
    {
      gameType: 'golden-bell',
      gameName: 'Rung Chuông Vàng',
      createJoinPlayer: (user) => ({
        odinhId: user.id,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        status: 'alive' as const,
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
        skills: [],
      }),
      onAfterStart,
      leaveStrategy: 'remove-self',
      onRemoveSelf,
      getJoinUpdateData: (roomData, updatedPlayers) => {
        const extra: Record<string, unknown> = {
          alivePlayers: Object.keys(updatedPlayers).length,
        };

        // Team mode: auto-assign to smallest team
        if (roomData.settings?.gameMode === 'team' && roomData.teams) {
          const teams = { ...(roomData.teams as Record<string, any>) };
          let smallestTeamId = Object.keys(teams)[0];
          let smallestCount = Infinity;
          Object.entries(teams).forEach(([tid, team]: [string, any]) => {
            if ((team.members?.length || 0) < smallestCount) {
              smallestCount = team.members?.length || 0;
              smallestTeamId = tid;
            }
          });
          if (smallestTeamId && teams[smallestTeamId]) {
            // Find the newly added user id (last key in updatedPlayers)
            const allIds = Object.keys(updatedPlayers);
            const newPlayerId = allIds[allIds.length - 1];
            teams[smallestTeamId] = {
              ...teams[smallestTeamId],
              members: [...(teams[smallestTeamId].members || []), newPlayerId],
              aliveCount: (teams[smallestTeamId].aliveCount || 0) + 1,
            };
            (updatedPlayers[newPlayerId] as any).teamId = smallestTeamId;
            extra.teams = teams;
          }
        }

        return extra;
      },
    },
  );

  return { joinGame, leaveGame, kickPlayer, startGame, resetGame };
}
