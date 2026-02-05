// Team mode actions
import { useCallback } from 'react';
import type { RacingGame } from '../../types/racing-game';

interface UseTeamActionsProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
}

export function useTeamActions({ setGame }: UseTeamActionsProps) {
  // Assign player to team (team mode)
  const assignPlayerToTeam = useCallback((playerId: string, newTeamId: string) => {
    setGame(prev => {
      if (!prev || !prev.teams) return prev;

      const player = prev.players[playerId];
      if (!player) return prev;

      const oldTeamId = player.teamId;
      const updatedTeams = { ...prev.teams };

      // Remove from old team
      if (oldTeamId && updatedTeams[oldTeamId]) {
        updatedTeams[oldTeamId] = {
          ...updatedTeams[oldTeamId],
          members: updatedTeams[oldTeamId].members.filter(id => id !== playerId),
        };
      }

      // Add to new team
      if (updatedTeams[newTeamId]) {
        updatedTeams[newTeamId] = {
          ...updatedTeams[newTeamId],
          members: [...updatedTeams[newTeamId].members, playerId],
        };
      }

      return {
        ...prev,
        teams: updatedTeams,
        players: {
          ...prev.players,
          [playerId]: { ...player, teamId: newTeamId },
        },
      };
    });
  }, [setGame]);

  // Update team scores
  const updateTeamScores = useCallback(() => {
    setGame(prev => {
      if (!prev || !prev.teams) return prev;

      const updatedTeams = { ...prev.teams };
      Object.keys(updatedTeams).forEach(teamId => {
        const team = updatedTeams[teamId];
        const members = Object.values(prev.players).filter(p => p.teamId === teamId);
        updatedTeams[teamId] = {
          ...team,
          totalDistance: members.reduce((sum, m) => sum + m.distance, 0),
          totalPoints: members.reduce((sum, m) => sum + m.totalPoints, 0),
        };
      });

      return { ...prev, teams: updatedTeams };
    });
  }, [setGame]);

  return { assignPlayerToTeam, updateTeamScores };
}
