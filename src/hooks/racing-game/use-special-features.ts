// Special features and mystery box logic
import { useCallback } from 'react';
import type {
  RacingGame,
  RacingQuestion,
  SpecialFeatureType,
} from '../../types/racing-game';
import { SPECIAL_FEATURES } from '../../types/racing-game';

interface UseSpecialFeaturesProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  currentUserId: string;
  currentQuestion: RacingQuestion | null;
}

export function useSpecialFeatures({
  game,
  setGame,
  currentUserId,
  currentQuestion,
}: UseSpecialFeaturesProps) {
  // Open mystery box
  const openMysteryBox = useCallback(() => {
    if (!game || !currentQuestion?.isMysteryBox) return;

    setGame(prev => prev ? { ...prev, status: 'answering' } : null);
  }, [game, currentQuestion, setGame]);

  // Apply special feature from mystery box
  const applySpecialFeature = useCallback((featureType: SpecialFeatureType) => {
    if (!game) return;

    const feature = SPECIAL_FEATURES[featureType];

    setGame(prev => {
      if (!prev) return null;

      const player = prev.players[currentUserId];
      if (!player) return prev;

      const updatedPlayers = { ...prev.players };

      // Apply feature effects
      switch (featureType) {
        case 'teleport':
          // Instant distance boost
          updatedPlayers[currentUserId] = {
            ...player,
            distance: Math.min(100, player.distance + 10),
            isFinished: player.distance + 10 >= 100,
          };
          break;

        case 'slow_others':
          // Slow all other players
          Object.keys(updatedPlayers).forEach(id => {
            if (id !== currentUserId) {
              const other = updatedPlayers[id];
              if (!other.hasShield) {
                updatedPlayers[id] = {
                  ...other,
                  currentSpeed: Math.max(other.vehicle.baseSpeed, other.currentSpeed * 0.9),
                };
              }
            }
          });
          // Add duration tracker
          updatedPlayers[currentUserId] = {
            ...player,
            activeFeatures: [...player.activeFeatures, { type: featureType, remainingRounds: feature.duration || 1 }],
          };
          break;

        case 'freeze':
          // Freeze random opponent
          const opponents = Object.keys(updatedPlayers).filter(id => id !== currentUserId);
          if (opponents.length > 0) {
            const targetId = opponents[Math.floor(Math.random() * opponents.length)];
            const target = updatedPlayers[targetId];
            if (!target.hasShield) {
              updatedPlayers[targetId] = { ...target, isFrozen: true };
            }
          }
          break;

        default:
          // Add to active features
          updatedPlayers[currentUserId] = {
            ...player,
            activeFeatures: [...player.activeFeatures, { type: featureType, remainingRounds: feature.duration || 1 }],
            hasShield: featureType === 'shield' ? true : player.hasShield,
          };
      }

      return { ...prev, players: updatedPlayers };
    });
  }, [game, currentUserId, setGame]);

  return { openMysteryBox, applySpecialFeature };
}
