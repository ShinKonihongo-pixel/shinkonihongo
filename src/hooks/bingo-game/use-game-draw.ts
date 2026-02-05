// Game draw number logic

import { useCallback } from 'react';
import type { BingoPlayer, DrawnNumber } from '../../types/bingo-game';
import type { UseBingoGameProps, BingoGameState } from './types';

export function useGameDraw(
  state: BingoGameState,
  setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  currentUser: UseBingoGameProps['currentUser'],
  currentPlayer: BingoPlayer | undefined
) {
  // Draw a number
  const drawNumber = useCallback(() => {
    if (!state.game || state.game.status !== 'playing') return;
    if (!currentPlayer || currentPlayer.isBlocked) return;
    if (state.game.availableNumbers.length === 0) return;

    setState(prev => {
      if (!prev.game) return prev;

      // Pick random number (considering luck bonus)
      const luckBonus = prev.game.players[currentUser.id]?.luckBonus || 1.0;
      let drawnNumber: number;

      // Find numbers that would benefit the current player
      const myNumbers = new Set<number>();
      prev.game.players[currentUser.id]?.rows.forEach(row => {
        row.cells.forEach(cell => {
          if (!cell.marked) myNumbers.add(cell.number);
        });
      });

      // Apply luck: higher chance to draw a number that matches player's cards
      if (luckBonus > 1 && Math.random() < (luckBonus - 1)) {
        const beneficialNumbers = prev.game.availableNumbers.filter(n => myNumbers.has(n));
        if (beneficialNumbers.length > 0) {
          drawnNumber = beneficialNumbers[Math.floor(Math.random() * beneficialNumbers.length)];
        } else {
          drawnNumber = prev.game.availableNumbers[Math.floor(Math.random() * prev.game.availableNumbers.length)];
        }
      } else {
        drawnNumber = prev.game.availableNumbers[Math.floor(Math.random() * prev.game.availableNumbers.length)];
      }

      // Remove from available
      const newAvailable = prev.game.availableNumbers.filter(n => n !== drawnNumber);

      // Add to drawn history
      const newDrawn: DrawnNumber = {
        number: drawnNumber,
        drawerId: currentUser.id,
        drawerName: currentUser.displayName,
        timestamp: Date.now(),
      };

      // Mark number for all players
      const newPlayers: Record<string, BingoPlayer> = {};
      Object.entries(prev.game.players).forEach(([id, player]) => {
        const updatedRows = player.rows.map(row => {
          const updatedCells = row.cells.map(cell => {
            if (cell.number === drawnNumber && !cell.marked) {
              return { ...cell, marked: true };
            }
            return cell;
          });
          return {
            ...row,
            cells: updatedCells,
            isComplete: updatedCells.every(c => c.marked),
          };
        });

        const markedCount = updatedRows.reduce(
          (sum, row) => sum + row.cells.filter(c => c.marked).length,
          0
        );
        const completedRows = updatedRows.filter(r => r.isComplete).length;
        const canBingo = completedRows > 0 && !player.hasBingoed;

        // Decrease luck turns
        let newLuckBonus = player.luckBonus;
        let newLuckTurns = player.luckTurnsLeft;
        if (player.luckTurnsLeft > 0) {
          newLuckTurns--;
          if (newLuckTurns === 0) newLuckBonus = 1.0;
        }

        // Clear blocked status after drawing
        newPlayers[id] = {
          ...player,
          rows: updatedRows,
          markedCount,
          completedRows,
          canBingo,
          isBlocked: false,
          luckBonus: newLuckBonus,
          luckTurnsLeft: newLuckTurns,
          hasSkillAvailable: (prev.game!.currentTurn + 1) % prev.game!.settings.skillInterval === 0 && prev.game!.settings.skillsEnabled,
        };
      });

      const newTurn = prev.game.currentTurn + 1;
      const isSkillTime = newTurn % prev.game.settings.skillInterval === 0 && prev.game.settings.skillsEnabled;

      return {
        ...prev,
        game: {
          ...prev.game,
          availableNumbers: newAvailable,
          drawnNumbers: [...prev.game.drawnNumbers, newDrawn],
          lastDrawnNumber: drawnNumber,
          players: newPlayers,
          currentTurn: newTurn,
          currentDrawerId: currentUser.id,
          status: isSkillTime ? 'skill_phase' : 'playing',
        }
      };
    });
  }, [state.game, currentPlayer, currentUser, setState]);

  return { drawNumber };
}
