// Game flow management (continue, results)

import { useCallback, useEffect } from 'react';
import type {
  KanjiBattleGame,
  KanjiBattlePlayer,
  KanjiBattlePlayerResult,
  KanjiBattleResults,
} from '../../types/kanji-battle';

interface UseGameFlowProps {
  game: KanjiBattleGame | null;
  isHost: boolean;
  sortedPlayers: KanjiBattlePlayer[];
  setGameResults: (results: KanjiBattleResults | null) => void;
  startNextRound: () => void;
  endRound: () => void;
}

export function useGameFlow({
  game,
  isHost,
  sortedPlayers,
  setGameResults,
  startNextRound,
  endRound,
}: UseGameFlowProps) {
  const continueGame = useCallback(() => {
    if (!game || !isHost) return;

    if (game.status === 'finished') {
      const rankings: KanjiBattlePlayerResult[] = sortedPlayers.map((p, idx) => ({
        odinhId: p.odinhId,
        displayName: p.displayName,
        avatar: p.avatar,
        rank: idx + 1,
        score: p.score,
        correctAnswers: p.correctAnswers,
        accuracy: p.correctAnswers + p.wrongAnswers > 0
          ? Math.round((p.correctAnswers / (p.correctAnswers + p.wrongAnswers)) * 100)
          : 0,
        avgResponseTime: 0,
        avgStrokeScore: p.strokeScore,
        isWinner: idx === 0,
      }));

      setGameResults({
        gameId: game.id,
        winner: rankings[0] || null,
        rankings,
        totalRounds: game.currentRound,
        totalPlayers: Object.keys(game.players).length,
      });
    } else {
      startNextRound();
    }
  }, [game, isHost, sortedPlayers, setGameResults, startNextRound]);

  useEffect(() => {
    if (!game || game.status !== 'playing') return;
    const allAnswered = Object.values(game.players).every(p => p.hasAnswered);
    if (allAnswered) {
      setTimeout(() => endRound(), 500);
    }
  }, [game, endRound]);

  return { continueGame };
}
