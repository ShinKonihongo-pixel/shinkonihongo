// Golden Bell Team Actions
// Handles team join, leave, shuffle, and stats for team mode

import { useCallback } from 'react';
import type { GoldenBellGame } from '../../types/golden-bell';

interface UseTeamActionsProps {
  game: GoldenBellGame | null;
  setGame: (updater: (prev: GoldenBellGame | null) => GoldenBellGame | null) => void;
  isHost: boolean;
}

export function useTeamActions({ game: _game, setGame, isHost }: UseTeamActionsProps) {
  /** Join a specific team */
  const joinTeam = useCallback((playerId: string, teamId: string) => {
    setGame(prev => {
      if (!prev || !prev.teams) return prev;
      const team = prev.teams[teamId];
      if (!team) return prev;

      // Check capacity
      const maxPerTeam = prev.settings.maxPlayersPerTeam || 6;
      if (team.members.length >= maxPerTeam) return prev;

      // Remove from current team if any
      const updatedTeams = { ...prev.teams };
      const updatedPlayers = { ...prev.players };

      Object.keys(updatedTeams).forEach(tid => {
        const t = updatedTeams[tid];
        if (t.members.includes(playerId)) {
          updatedTeams[tid] = {
            ...t,
            members: t.members.filter(m => m !== playerId),
            aliveCount: t.members.filter(m => m !== playerId && prev.players[m]?.status === 'alive').length,
          };
        }
      });

      // Add to new team
      updatedTeams[teamId] = {
        ...updatedTeams[teamId],
        members: [...updatedTeams[teamId].members, playerId],
        aliveCount: [...updatedTeams[teamId].members, playerId].filter(m => prev.players[m]?.status === 'alive').length,
      };

      // Update player's teamId
      if (updatedPlayers[playerId]) {
        updatedPlayers[playerId] = { ...updatedPlayers[playerId], teamId };
      }

      return { ...prev, teams: updatedTeams, players: updatedPlayers };
    });
  }, [setGame]);

  /** Leave current team */
  const leaveTeam = useCallback((playerId: string) => {
    setGame(prev => {
      if (!prev || !prev.teams) return prev;

      const updatedTeams = { ...prev.teams };
      const updatedPlayers = { ...prev.players };

      Object.keys(updatedTeams).forEach(tid => {
        const t = updatedTeams[tid];
        if (t.members.includes(playerId)) {
          updatedTeams[tid] = {
            ...t,
            members: t.members.filter(m => m !== playerId),
            aliveCount: t.members.filter(m => m !== playerId && prev.players[m]?.status === 'alive').length,
          };
        }
      });

      if (updatedPlayers[playerId]) {
        updatedPlayers[playerId] = { ...updatedPlayers[playerId], teamId: undefined };
      }

      return { ...prev, teams: updatedTeams, players: updatedPlayers };
    });
  }, [setGame]);

  /** Shuffle all players into teams evenly (host only) */
  const shuffleTeams = useCallback(() => {
    if (!isHost) return;

    setGame(prev => {
      if (!prev || !prev.teams) return prev;

      const teamIds = Object.keys(prev.teams);
      const playerIds = Object.keys(prev.players);

      // Shuffle player IDs
      const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

      // Reset all teams
      const updatedTeams = { ...prev.teams };
      teamIds.forEach(tid => {
        updatedTeams[tid] = { ...updatedTeams[tid], members: [], aliveCount: 0 };
      });

      // Distribute players round-robin
      const updatedPlayers = { ...prev.players };
      shuffled.forEach((pid, idx) => {
        const teamId = teamIds[idx % teamIds.length];
        updatedTeams[teamId] = {
          ...updatedTeams[teamId],
          members: [...updatedTeams[teamId].members, pid],
        };
        updatedPlayers[pid] = { ...updatedPlayers[pid], teamId };
      });

      // Update alive counts
      teamIds.forEach(tid => {
        updatedTeams[tid] = {
          ...updatedTeams[tid],
          aliveCount: updatedTeams[tid].members.filter(m => updatedPlayers[m]?.status === 'alive').length,
        };
      });

      return { ...prev, teams: updatedTeams, players: updatedPlayers };
    });
  }, [isHost, setGame]);

  /** Update team stats (alive count, correct answers) — called after gameplay changes */
  const updateTeamStats = useCallback(() => {
    setGame(prev => {
      if (!prev || !prev.teams) return prev;

      const updatedTeams = { ...prev.teams };
      Object.keys(updatedTeams).forEach(tid => {
        const team = updatedTeams[tid];
        updatedTeams[tid] = {
          ...team,
          aliveCount: team.members.filter(m => prev.players[m]?.status === 'alive').length,
          totalCorrect: team.members.reduce((sum, m) => sum + (prev.players[m]?.correctAnswers || 0), 0),
        };
      });

      return { ...prev, teams: updatedTeams };
    });
  }, [setGame]);

  /** Auto-assign player to smallest team */
  const autoAssignToTeam = useCallback((playerId: string) => {
    setGame(prev => {
      if (!prev || !prev.teams) return prev;

      // Find team with fewest members
      const teamEntries = Object.entries(prev.teams);
      const maxPerTeam = prev.settings.maxPlayersPerTeam || 6;

      let smallestTeamId = teamEntries[0]?.[0];
      let smallestCount = Infinity;

      teamEntries.forEach(([tid, team]) => {
        if (team.members.length < smallestCount && team.members.length < maxPerTeam) {
          smallestCount = team.members.length;
          smallestTeamId = tid;
        }
      });

      if (!smallestTeamId) return prev;

      const updatedTeams = { ...prev.teams };
      updatedTeams[smallestTeamId] = {
        ...updatedTeams[smallestTeamId],
        members: [...updatedTeams[smallestTeamId].members, playerId],
        aliveCount: [...updatedTeams[smallestTeamId].members, playerId].filter(m => prev.players[m]?.status === 'alive').length,
      };

      const updatedPlayers = { ...prev.players };
      if (updatedPlayers[playerId]) {
        updatedPlayers[playerId] = { ...updatedPlayers[playerId], teamId: smallestTeamId };
      }

      return { ...prev, teams: updatedTeams, players: updatedPlayers };
    });
  }, [setGame]);

  return {
    joinTeam,
    leaveTeam,
    shuffleTeams,
    updateTeamStats,
    autoAssignToTeam,
  };
}
