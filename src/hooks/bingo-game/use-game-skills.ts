// Game skills actions

import { useCallback } from 'react';
import type { BingoPlayer, BingoSkillType } from '../../types/bingo-game';
import type { UseBingoGameProps, BingoGameState } from './types';

export function useGameSkills(
  state: BingoGameState,
  setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  currentUser: UseBingoGameProps['currentUser'],
  currentPlayer: BingoPlayer | undefined
) {
  // Use skill
  const useSkill = useCallback((skillType: BingoSkillType, targetId?: string) => {
    if (!state.game || !currentPlayer) return;
    if (!currentPlayer.hasSkillAvailable) return;

    setState(prev => {
      if (!prev.game) return prev;

      const newPlayers: Record<string, BingoPlayer> = { ...prev.game.players };
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
        game: {
          ...prev.game,
          players: newPlayers,
          status: 'playing',
        }
      };
    });
  }, [state.game, currentPlayer, currentUser, setState]);

  // Skip skill phase
  const skipSkill = useCallback(() => {
    if (!state.game) return;

    setState(prev => {
      if (!prev.game) return prev;

      const newPlayers = { ...prev.game.players };
      if (newPlayers[currentUser.id]) {
        newPlayers[currentUser.id].hasSkillAvailable = false;
      }

      // Check if all players have used/skipped skills
      const allDone = Object.values(newPlayers).every(p => !p.hasSkillAvailable);

      return {
        ...prev,
        game: {
          ...prev.game,
          players: newPlayers,
          status: allDone ? 'playing' : 'skill_phase',
        }
      };
    });
  }, [state.game, currentUser, setState]);

  return {
    useSkill,
    skipSkill,
  };
}
