// Join game logic
import { useCallback } from 'react';
import type { RacingGame, RacingPlayer, RacingVehicle } from '../../types/racing-game';
import { DEFAULT_VEHICLES } from '../../types/racing-game';

interface UseJoinGameProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  selectedVehicle: RacingVehicle;
  availableRooms: RacingGame[];
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  setAvailableRooms: React.Dispatch<React.SetStateAction<RacingGame[]>>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export function useJoinGame({
  currentUser,
  selectedVehicle,
  availableRooms,
  setGame,
  setAvailableRooms,
  setLoading,
  setError,
}: UseJoinGameProps) {
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const foundGame = availableRooms.find(g => g.code === code);
      if (!foundGame) {
        throw new Error('Không tìm thấy phòng với mã này');
      }

      if (foundGame.status !== 'waiting') {
        throw new Error('Trò chơi đã bắt đầu');
      }

      if (Object.keys(foundGame.players).length >= foundGame.settings.maxPlayers) {
        throw new Error('Phòng đã đầy');
      }

      // Select vehicle for race type
      const vehiclesForType = DEFAULT_VEHICLES.filter(v => v.type === foundGame.settings.raceType);
      const playerVehicle = vehiclesForType.find(v => v.id === selectedVehicle.id) || vehiclesForType[0];

      // Find team with fewest members for auto-assignment
      let assignedTeamId: string | undefined;
      const updatedTeams = foundGame.teams ? { ...foundGame.teams } : undefined;

      if (updatedTeams) {
        const teamIds = Object.keys(updatedTeams);
        const teamWithFewestMembers = teamIds.reduce((minTeam, teamId) => {
          const teamSize = updatedTeams![teamId].members.length;
          const minSize = updatedTeams![minTeam].members.length;
          return teamSize < minSize ? teamId : minTeam;
        }, teamIds[0]);
        assignedTeamId = teamWithFewestMembers;
        updatedTeams[assignedTeamId].members.push(currentUser.id);
      }

      const player: RacingPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        vehicle: playerVehicle,
        currentSpeed: playerVehicle.baseSpeed,
        distance: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
        activeFeatures: [],
        hasShield: false,
        isFrozen: false,
        isFinished: false,
        totalPoints: 0,
        trapEffects: [],
        inventory: [],
        teamId: assignedTeamId,
      };

      const updatedGame = {
        ...foundGame,
        players: { ...foundGame.players, [currentUser.id]: player },
        teams: updatedTeams,
      };

      setGame(updatedGame);
      setAvailableRooms(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));

      return updatedGame;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tham gia game';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, availableRooms, selectedVehicle, setGame, setAvailableRooms, setLoading, setError]);

  return { joinGame };
}
