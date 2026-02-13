// Game skills actions

import { useCallback } from 'react';
import type { BingoGame, BingoPlayer, BingoSkillType } from '../../types/bingo-game';
import type { UseBingoGameProps, BingoGameState } from './types';

export function useGameSkills(
  state: BingoGameState,
  setGame: (updater: (prev: BingoGame | null) => BingoGame | null) => void,
  _setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  currentUser: UseBingoGameProps['currentUser'],
  currentPlayer: BingoPlayer | undefined
) {
  // Use skill
  const useSkill = useCallback((skillType: BingoSkillType, targetId?: string) => {
    if (!state.game || !currentPlayer) return;
    if (!currentPlayer.hasSkillAvailable) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers: Record<string, BingoPlayer> = { ...prev.players };
      const player = newPlayers[currentUser.id];

      switch (skillType) {
        case 'remove_mark':
          if (targetId && newPlayers[targetId]) {
            const target = newPlayers[targetId];
            // Find a marked cell to unmark
            for (const row of target.rows) {
              const markedCell = row.cells.find(c => c.marked);
              if (markedCell) {
                markedCell.marked = false;
                row.isComplete = row.cells.every(c => c.marked);
                target.markedCount--;
                target.completedRows = target.rows.filter(r => r.isComplete).length;
                target.canBingo = target.completedRows > 0 && !target.hasBingoed;
                break;
              }
            }
          }
          break;

        case 'auto_add':
          // Mark a random unmarked cell
          for (const row of player.rows) {
            const unmarkedCell = row.cells.find(c => !c.marked);
            if (unmarkedCell) {
              unmarkedCell.marked = true;
              row.isComplete = row.cells.every(c => c.marked);
              player.markedCount++;
              player.completedRows = player.rows.filter(r => r.isComplete).length;
              player.canBingo = player.completedRows > 0 && !player.hasBingoed;
              break;
            }
          }
          break;

        case 'increase_luck':
          player.luckBonus = 1.3;
          player.luckTurnsLeft = 3;
          break;

        case 'block_turn':
          if (targetId && newPlayers[targetId]) {
            newPlayers[targetId].isBlocked = true;
          }
          break;

        case 'fifty_fifty':
          player.hasFiftyFifty = true;
          break;
      }

      // Mark skill as used
      player.hasSkillAvailable = false;

      // Return to playing status
      return {
        ...prev,
        players: newPlayers,
        status: 'playing',
      };
    });
  }, [state.game, currentPlayer, currentUser, setGame]);

  // Skip skill phase
  const skipSkill = useCallback(() => {
    if (!state.game) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      if (newPlayers[currentUser.id]) {
        newPlayers[currentUser.id].hasSkillAvailable = false;
      }

      // Check if all players have used/skipped skills
      const allDone = Object.values(newPlayers).every(p => !p.hasSkillAvailable);

      return {
        ...prev,
        players: newPlayers,
        status: allDone ? 'playing' : 'skill_phase',
      };
    });
  }, [state.game, currentUser, setGame]);

  return {
    useSkill,
    skipSkill,
  };
}
