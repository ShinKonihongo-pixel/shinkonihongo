// Game state management for AI Challenge
// Handles core state, progress tracking, and derived values

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { AIChallengeGame, AIChallengeResult, AIDifficulty } from '../../types/ai-challenge';
import { AI_OPPONENTS, isAIUnlocked } from '../../types/ai-challenge';
import { loadAllProgress, type JLPTLevel } from './utils';

interface UseGameStateProps {
  currentUserId: string;
  currentLevel: JLPTLevel;
}

export function useGameState({ currentUserId, currentLevel }: UseGameStateProps) {
  const [game, setGame] = useState<AIChallengeGame | null>(null);
  const [result, setResult] = useState<AIChallengeResult | null>(null);

  // Load saved progress for all levels
  const [progressByLevel, setProgressByLevel] = useState(loadAllProgress);

  // Get progress for current level
  const progress = useMemo(
    () => progressByLevel[currentLevel] || { totalWins: 0, totalGames: 0 },
    [progressByLevel, currentLevel]
  );

  // Refs for timers
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, []);

  // Get current question
  const currentQuestion = useMemo(() => {
    if (!game) return null;
    return game.questions[game.currentQuestionIndex] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- game changes frequently, only recalculate on index change
  }, [game?.currentQuestionIndex]);

  // Get AI opponent info
  const aiOpponent = useMemo(() => {
    if (!game) return null;
    return AI_OPPONENTS[game.aiDifficulty];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- game changes frequently, only recalculate on difficulty change
  }, [game?.aiDifficulty]);

  // Check if AI is unlocked
  const checkAIUnlocked = useCallback(
    (difficulty: AIDifficulty) => {
      return isAIUnlocked(difficulty, progress.totalWins);
    },
    [progress.totalWins]
  );

  // Get all AI opponents with unlock status
  const aiOpponents = useMemo(() => {
    return Object.values(AI_OPPONENTS).map((ai) => ({
      ...ai,
      isUnlocked: isAIUnlocked(ai.id, progress.totalWins),
    }));
  }, [progress.totalWins]);

  return {
    game,
    setGame,
    result,
    setResult,
    progressByLevel,
    setProgressByLevel,
    progress,
    aiTimerRef,
    countdownTimerRef,
    currentQuestion,
    aiOpponent,
    checkAIUnlocked,
    aiOpponents,
  };
}
