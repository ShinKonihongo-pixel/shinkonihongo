// Game bingo claim logic

import { useCallback } from 'react';
import type {
  BingoGame,
  BingoPlayer,
  BingoPlayerResult,
  BingoResults,
} from '../../types/bingo-game';
import { isRowComplete } from '../../types/bingo-game';
import type { UseBingoGameProps, BingoGameState } from './types';

export function useGameBingo(
  state: BingoGameState,
  setGame: (updater: (prev: BingoGame | null) => BingoGame | null) => void,
  setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  currentUser: UseBingoGameProps['currentUser'],
  currentPlayer: BingoPlayer | undefined
) {
  // Claim bingo
  const claimBingo = useCallback(() => {
    if (!state.game || !currentPlayer) return;
    if (!currentPlayer.canBingo || currentPlayer.hasBingoed) return;

    // Verify bingo is valid
    const hasCompletedRow = currentPlayer.rows.some(row => isRowComplete(row));
    if (!hasCompletedRow) {
      setState(prev => ({ ...prev, error: 'Bạn chưa có đủ 5 số trong một dãy!' }));
      return;
    }

    // Set winner
    const gameSnapshot = state.game;
    setGame(prev => {
      if (!prev) return null;

      const updatedPlayers = { ...prev.players };
      updatedPlayers[currentUser.id] = {
        ...updatedPlayers[currentUser.id],
        hasBingoed: true,
      };

      return {
        ...prev,
        players: updatedPlayers,
        status: 'finished',
        winnerId: currentUser.id,
        finishedAt: new Date().toISOString(),
      };
    });

    // Generate results
    setTimeout(() => {
      if (!gameSnapshot) return;

      const rankings: BingoPlayerResult[] = Object.values(gameSnapshot.players)
        .map(p => ({
          odinhId: p.odinhId,
          displayName: p.displayName,
          avatar: p.avatar,
          rank: 0,
          markedCount: p.markedCount,
          completedRows: p.completedRows,
          isWinner: p.odinhId === currentUser.id,
        }))
        .sort((a, b) => {
          if (a.isWinner) return -1;
          if (b.isWinner) return 1;
          if (b.completedRows !== a.completedRows) return b.completedRows - a.completedRows;
          return b.markedCount - a.markedCount;
        })
        .map((p, idx) => ({ ...p, rank: idx + 1 }));

      const results: BingoResults = {
        gameId: gameSnapshot.id,
        winner: rankings.find(r => r.isWinner) || null,
        rankings,
        totalTurns: gameSnapshot.currentTurn,
        totalPlayers: Object.keys(gameSnapshot.players).length,
        drawnNumbers: gameSnapshot.drawnNumbers.map(d => d.number),
      };

      setState(prev => ({ ...prev, gameResults: results }));
    }, 100);
  }, [state.game, currentPlayer, currentUser, setGame, setState]);

  return { claimBingo };
}
