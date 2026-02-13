// Game flow control for AI Challenge
// Handles reset and rematch logic

import { useCallback } from 'react';
import type { AIChallengeGame, AIChallengeResult, AIDifficulty, AIChallengeSettings } from '../../types/ai-challenge';

interface UseGameFlowProps {
  game: AIChallengeGame | null;
  setGame: React.Dispatch<React.SetStateAction<AIChallengeGame | null>>;
  setResult: React.Dispatch<React.SetStateAction<AIChallengeResult | null>>;
  aiTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  countdownTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  startGame: (difficulty: AIDifficulty, settings?: Partial<AIChallengeSettings>) => void;
}

export function useGameFlow({
  game,
  setGame,
  setResult,
  aiTimerRef,
  countdownTimerRef,
  startGame,
}: UseGameFlowProps) {
  // Reset game
  const resetGame = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    setGame(null);
    setResult(null);
  }, [aiTimerRef, countdownTimerRef, setGame, setResult]);

  // Rematch with same AI
  const rematch = useCallback(() => {
    if (!game) return;
    const difficulty = game.aiDifficulty;
    resetGame();
    // Small delay before starting new game
    setTimeout(() => {
      startGame(difficulty);
    }, 100);
  }, [game, resetGame, startGame]);

  return {
    resetGame,
    rematch,
  };
}
