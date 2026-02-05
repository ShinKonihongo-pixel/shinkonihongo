// Inventory management hook
import { useCallback } from 'react';
import type {
  RacingGame,
  InventoryItem,
  SpecialFeatureType,
  TrapType,
} from '../../types/racing-game';
import { generateId } from './utils';
import { INVENTORY_MAX_SIZE } from './constants';

interface UseInventoryProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  currentUserId: string;
  applySpecialFeature: (featureType: SpecialFeatureType) => void;
}

export function useInventory({
  game,
  setGame,
  currentUserId,
  applySpecialFeature,
}: UseInventoryProps) {
  // Use inventory item
  const useInventoryItem = useCallback((itemId: string) => {
    if (!game) return;

    const player = game.players[currentUserId];
    if (!player) return;

    const item = player.inventory.find(i => i.id === itemId && !i.isUsed);
    if (!item) return;

    if (item.category === 'powerup') {
      // Apply power-up
      applySpecialFeature(item.type as SpecialFeatureType);
    }
    // Trap placement is handled by placeTrap function

    // Remove item from inventory
    setGame(prev => {
      if (!prev) return null;
      const p = prev.players[currentUserId];
      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUserId]: {
            ...p,
            inventory: p.inventory.filter(i => i.id !== itemId),
          },
        },
      };
    });
  }, [game, currentUserId, applySpecialFeature, setGame]);

  // Add item to inventory (called when winning milestone)
  const addToInventory = useCallback((type: SpecialFeatureType | TrapType, category: 'powerup' | 'trap') => {
    if (!game) return;

    const player = game.players[currentUserId];
    if (!player || player.inventory.length >= INVENTORY_MAX_SIZE) return;

    const newItem: InventoryItem = {
      id: generateId(),
      type,
      category,
      isUsed: false,
    };

    setGame(prev => {
      if (!prev) return null;
      const p = prev.players[currentUserId];
      if (p.inventory.length >= INVENTORY_MAX_SIZE) return prev;

      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUserId]: {
            ...p,
            inventory: [...p.inventory, newItem],
          },
        },
      };
    });
  }, [game, currentUserId, setGame]);

  return { useInventoryItem, addToInventory };
}
