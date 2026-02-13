// Main AI Challenge hook - orchestrates all modules
// Manages 1v1 quiz battle against AI

import type { Flashcard } from '../../types/flashcard';
import type { AIChallengeSettings, AIDifficulty } from '../../types/ai-challenge';
import { useGameState } from './use-game-state';
import { useGameStart } from './use-game-start';
import { useGameplay } from './use-gameplay';
import { useGameFlow } from './use-game-flow';

export type { JLPTLevel } from './utils';

// AI Challenge settings from app settings
interface AIChallengeAppSettings {
  questionCount: number;
  timePerQuestion: number;
  accuracyModifier: number;
  speedMultiplier: number;
  autoAddDifficulty: 'random' | 'easy' | 'medium' | 'hard';
}

// Hook props
export interface UseAIChallengeProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: 'vip' | 'admin' | 'superadmin' | 'user';
  };
  flashcards: Flashcard[];
  aiSettings?: AIChallengeAppSettings;
  currentLevel: string;
}

export function useAIChallenge({ currentUser, flashcards, aiSettings, currentLevel }: UseAIChallengeProps) {
  const {
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
  } = useGameState({ currentUserId: currentUser.id, currentLevel: currentLevel as any });

  const { startGame } = useGameStart({
    flashcards,
    currentUser,
    progress,
    aiSettings,
    setGame,
    setResult,
    countdownTimerRef,
    checkAIUnlocked,
  });

  const { submitAnswer, handleTimeout, nextQuestion } = useGameplay({
    game,
    currentQuestion,
    aiSettings,
    currentLevel: currentLevel as any,
    progress,
    setGame,
    setResult,
    setProgressByLevel,
    aiTimerRef,
  });

  const { resetGame, rematch } = useGameFlow({
    game,
    setGame,
    setResult,
    aiTimerRef,
    countdownTimerRef,
    startGame,
  });

  return {
    // State
    game,
    result,
    currentQuestion,
    aiOpponent,
    progress,
    aiOpponents,

    // Actions
    startGame,
    submitAnswer,
    handleTimeout,
    nextQuestion,
    resetGame,
    rematch,
    checkAIUnlocked,
  };
}
