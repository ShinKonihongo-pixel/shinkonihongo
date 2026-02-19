// Golden Bell Game Actions
// Handles join, leave, kick, start, and reset game actions
// Join uses Firestore to find and subscribe to remote rooms

import { useCallback } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellResults,
} from '../../types/golden-bell';
import { findRoomByCode, updateGameRoom } from '../../services/game-rooms';

interface UseGameActionsProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  game: GoldenBellGame | null;
  setGame: (updater: (prev: GoldenBellGame | null) => GoldenBellGame | null) => void;
  setGameResults: (results: GoldenBellResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  roomId: string | null;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
  clearLocalGameState: () => void;
}

export function useGameActions({
  currentUser,
  game,
  setGame,
  setGameResults,
  setLoading,
  setError,
  roomId,
  setRoomId,
  isHost,
  clearBotTimers,
  clearLocalGameState,
}: UseGameActionsProps) {
  // Join existing game via Firestore
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const room = await findRoomByCode(code);

      if (!room || room.gameType !== 'golden-bell') {
        throw new Error('Không tìm thấy phòng Rung Chuông Vàng với mã này');
      }

      const roomData = room.data as unknown as GoldenBellGame;

      if (roomData.status !== 'waiting') {
        throw new Error('Trò chơi đã bắt đầu');
      }

      const players = roomData.players || {};
      if (Object.keys(players).length >= (roomData.settings?.maxPlayers || 20)) {
        throw new Error('Phòng đã đầy');
      }

      // Already in the game? Just subscribe
      if (players[currentUser.id]) {
        setRoomId(room.id);
        return;
      }

      // Add player to the room via Firestore
      const player: GoldenBellPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        status: 'alive',
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
        skills: [],
      };

      const updatedPlayers = { ...players, [currentUser.id]: player };
      const updateData: Record<string, unknown> = {
        players: updatedPlayers,
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
          teams[smallestTeamId] = {
            ...teams[smallestTeamId],
            members: [...(teams[smallestTeamId].members || []), currentUser.id],
            aliveCount: (teams[smallestTeamId].aliveCount || 0) + 1,
          };
          (updatedPlayers[currentUser.id] as any).teamId = smallestTeamId;
          updateData.teams = teams;
        }
      }

      await updateGameRoom(room.id, updateData);

      // Subscribe to the room (subscription in use-game-state will update local state)
      setRoomId(room.id);
      setGameResults(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia phòng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, setRoomId, setGameResults, setLoading, setError]);

  // Leave game — host destroys room, non-host removes self
  const leaveGame = useCallback(() => {
    if (!game) return;
    clearBotTimers();

    if (isHost) {
      // Host leaves → delete entire room from Firestore
      setGame(() => null);
    } else {
      // Non-host → remove self from players, keep room alive for others
      if (roomId) {
        const { [currentUser.id]: _removed, ...remainingPlayers } = game.players;
        const updateData: Record<string, unknown> = {
          players: remainingPlayers,
          alivePlayers: Object.keys(remainingPlayers).length,
        };

        // Also remove from team if in team mode
        if (game.teams) {
          const updatedTeams = { ...game.teams };
          Object.keys(updatedTeams).forEach(tid => {
            const team = updatedTeams[tid];
            if (team.members.includes(currentUser.id)) {
              updatedTeams[tid] = {
                ...team,
                members: team.members.filter((m: string) => m !== currentUser.id),
                aliveCount: Math.max(0, team.aliveCount - 1),
              };
            }
          });
          updateData.teams = updatedTeams;
        }

        updateGameRoom(roomId, updateData).catch(console.error);
      }
      // Clear local state without triggering Firestore room deletion
      clearLocalGameState();
    }
  }, [game, isHost, roomId, currentUser.id, clearBotTimers, setGame, clearLocalGameState]);

  // Kick player (host only)
  const kickPlayer = useCallback((playerId: string) => {
    if (!game || !isHost || playerId === currentUser.id) return;

    setGame(prev => {
      if (!prev) return null;
      const { [playerId]: _removed, ...remainingPlayers } = prev.players;
      return { ...prev, players: remainingPlayers };
    });
  }, [game, currentUser, isHost, setGame]);

  // Start game (host only)
  const startGame = useCallback(() => {
    if (!game || !isHost) return;

    const playerCount = Object.keys(game.players).length;
    if (playerCount < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người để bắt đầu`);
      return;
    }

    // Clear bot timers - no more bots once game starts
    clearBotTimers();

    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'starting',
        startedAt: new Date().toISOString(),
      };
    });

    // After countdown, start first question
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'question',
          currentQuestionIndex: 0,
        };
      });

      // Auto-transition to answering after showing question
      setTimeout(() => {
        setGame(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'answering',
            questionStartTime: Date.now(),
          };
        });
      }, 2000);
    }, 3000);
  }, [game, isHost, clearBotTimers, setGame, setError]);

  // Reset game
  const resetGame = useCallback(() => {
    setGame(() => null);
    setGameResults(null);
    setError(null);
  }, [setGame, setGameResults, setError]);

  return {
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    resetGame,
  };
}
