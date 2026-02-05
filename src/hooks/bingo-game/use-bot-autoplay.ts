// Bot autoplay logic

import { useEffect } from 'react';
import type { BingoPlayerResult, BingoResults } from '../../types/bingo-game';
import type { BingoGameState, BingoGameRefs } from './types';

export function useBotAutoplay(
  state: BingoGameState,
  setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  refs: BingoGameRefs,
  isHost: boolean
) {
  const { botDrawTimerRef } = refs;

  useEffect(() => {
    if (!state.game || state.game.status !== 'playing' || !isHost) return;

    // Bot draws after a delay
    const botPlayers = Object.values(state.game.players).filter(p => p.isBot && !p.isBlocked);
    if (botPlayers.length === 0) return;

    // Simulate bot drawing
    if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);

    botDrawTimerRef.current = setTimeout(() => {
      // Check if any bot can claim bingo
      const botWithBingo = Object.values(state.game!.players).find(
        p => p.isBot && p.canBingo && !p.hasBingoed
      );

      if (botWithBingo) {
        // Bot claims bingo with 80% chance
        if (Math.random() < 0.8) {
          const gameSnapshot = state.game;
          setState(prev => {
            if (!prev.game) return prev;

            const updatedPlayers = { ...prev.game.players };
            updatedPlayers[botWithBingo.odinhId] = {
              ...updatedPlayers[botWithBingo.odinhId],
              hasBingoed: true,
            };

            return {
              ...prev,
              game: {
                ...prev.game,
                players: updatedPlayers,
                status: 'finished',
                winnerId: botWithBingo.odinhId,
                finishedAt: new Date().toISOString(),
              }
            };
          });

          // Generate results for bot win
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
                isWinner: p.odinhId === botWithBingo.odinhId,
              }))
              .sort((a, b) => {
                if (a.isWinner) return -1;
                if (b.isWinner) return 1;
                return b.completedRows - a.completedRows;
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
        }
      }
    }, 2000 + Math.random() * 2000);

    return () => {
      if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);
    };
  }, [state.game, isHost, botDrawTimerRef, setState]);
}
