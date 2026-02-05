// Vehicle selection hook
import { useCallback } from 'react';
import type { RacingGame, RacingVehicle } from '../../types/racing-game';

interface UseVehicleSelectionProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  setSelectedVehicle: (vehicle: RacingVehicle) => void;
  currentUserId: string;
}

export function useVehicleSelection({
  game,
  setGame,
  setSelectedVehicle,
  currentUserId,
}: UseVehicleSelectionProps) {
  // Select vehicle
  const selectVehicle = useCallback((vehicle: RacingVehicle) => {
    setSelectedVehicle(vehicle);

    // Update in game if already joined
    if (game && game.players[currentUserId]) {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: {
            ...prev.players,
            [currentUserId]: {
              ...prev.players[currentUserId],
              vehicle,
              currentSpeed: vehicle.baseSpeed,
            },
          },
        };
      });
    }
  }, [game, currentUserId, setGame, setSelectedVehicle]);

  return { selectVehicle };
}
