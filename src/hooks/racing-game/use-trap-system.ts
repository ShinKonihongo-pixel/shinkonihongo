// Trap system logic
import { useCallback } from 'react';
import type {
  RacingGame,
  Trap,
  TrapType,
  ActiveTrapEffect,
} from '../../types/racing-game';
import { TRAPS } from '../../types/racing-game';
import { generateId, generateRandomTrap } from './utils';
import { ESCAPE_TAPS_REQUIRED } from './constants';

interface UseTrapSystemProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  currentUserId: string;
}

export function useTrapSystem({
  game,
  setGame,
  currentUserId,
}: UseTrapSystemProps) {
  // Place trap from inventory
  const placeTrap = useCallback((trapType: TrapType, position: number) => {
    if (!game) return;

    const player = game.players[currentUserId];
    if (!player) return;

    // Find trap item in inventory
    const itemIndex = player.inventory.findIndex(
      item => item.type === trapType && item.category === 'trap' && !item.isUsed
    );
    if (itemIndex === -1) return;

    const newTrap: Trap = {
      id: generateId(),
      type: trapType,
      position,
      placedBy: currentUserId,
      isActive: true,
    };

    setGame(prev => {
      if (!prev) return null;
      const p = prev.players[currentUserId];
      const updatedInventory = [...p.inventory];
      updatedInventory[itemIndex] = { ...updatedInventory[itemIndex], isUsed: true };

      return {
        ...prev,
        activeTraps: [...prev.activeTraps, newTrap],
        players: {
          ...prev.players,
          [currentUserId]: { ...p, inventory: updatedInventory.filter(i => !i.isUsed) },
        },
      };
    });
  }, [game, currentUserId, setGame]);

  // Trigger trap when player hits it
  const triggerTrap = useCallback((playerId: string, trap: Trap) => {
    setGame(prev => {
      if (!prev) return null;

      const player = prev.players[playerId];
      if (!player || player.hasShield) {
        // Shield blocks trap
        return {
          ...prev,
          activeTraps: prev.activeTraps.filter(t => t.id !== trap.id),
        };
      }

      const trapDef = TRAPS[trap.type];
      const newEffect: ActiveTrapEffect = {
        trapType: trap.type,
        remainingRounds: trapDef.effect.duration,
        escapeRequired: trapDef.effect.escapeRequired ? ESCAPE_TAPS_REQUIRED : undefined,
        escapeTaps: 0,
      };

      return {
        ...prev,
        activeTraps: prev.activeTraps.filter(t => t.id !== trap.id),
        players: {
          ...prev.players,
          [playerId]: {
            ...player,
            trapEffects: [...player.trapEffects, newEffect],
            isFrozen: trapDef.effect.immobilize || false,
            isEscaping: trapDef.effect.escapeRequired || false,
            escapeProgress: 0,
          },
        },
      };
    });
  }, [setGame]);

  // Handle escape mini-game tap
  const handleEscapeTap = useCallback(() => {
    if (!game) return;

    const player = game.players[currentUserId];
    if (!player || !player.isEscaping) return;

    setGame(prev => {
      if (!prev) return null;

      const p = prev.players[currentUserId];
      const sinkholeEffect = p.trapEffects.find(e => e.trapType === 'sinkhole');
      if (!sinkholeEffect || !sinkholeEffect.escapeRequired) return prev;

      const newTaps = (sinkholeEffect.escapeTaps || 0) + 1;
      const progress = Math.min(100, (newTaps / sinkholeEffect.escapeRequired) * 100);
      const escaped = newTaps >= sinkholeEffect.escapeRequired;

      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUserId]: {
            ...p,
            escapeProgress: progress,
            isEscaping: !escaped,
            isFrozen: !escaped,
            trapEffects: escaped
              ? p.trapEffects.filter(e => e.trapType !== 'sinkhole')
              : p.trapEffects.map(e =>
                  e.trapType === 'sinkhole' ? { ...e, escapeTaps: newTaps } : e
                ),
          },
        },
      };
    });
  }, [game, currentUserId, setGame]);

  // Check trap collision
  const checkTrapCollision = useCallback((playerId: string, newDistance: number): Trap | null => {
    if (!game) return null;

    const player = game.players[playerId];
    if (!player) return null;

    const oldDistance = player.distance;

    // Find trap between old and new distance
    const hitTrap = game.activeTraps.find(
      trap => trap.isActive && trap.position > oldDistance && trap.position <= newDistance
    );

    return hitTrap || null;
  }, [game]);

  // Spawn random trap on track (called after certain questions)
  const spawnRandomTrap = useCallback(() => {
    if (!game || !game.settings.enableTraps) return;

    const newTrap = generateRandomTrap();
    setGame(prev => prev ? { ...prev, activeTraps: [...prev.activeTraps, newTrap] } : null);
  }, [game, setGame]);

  return {
    placeTrap,
    triggerTrap,
    handleEscapeTap,
    checkTrapCollision,
    spawnRandomTrap,
  };
}
