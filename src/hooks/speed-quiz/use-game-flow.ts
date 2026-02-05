// Game flow management (continue, results)

import { useCallback, useEffect } from 'react';
import type {
  SpeedQuizGame,
  SpeedQuizPlayer,
  SpeedQuizPlayerResult,
  SpeedQuizResults,
} from '../../types/speed-quiz';

interface UseGameFlowProps {
  game: SpeedQuizGame | null;
  isHost: boolean;
  sortedPlayers: SpeedQuizPlayer[];
  setGameResults: (results: SpeedQuizResults | null) => void;
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
      const rankings: SpeedQuizPlayerResult[] = sortedPlayers.map((p, idx) => ({
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

  return {
    continueGame,
  };
}
