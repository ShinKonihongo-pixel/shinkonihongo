// Game start logic for AI Challenge
// Handles game initialization and countdown

import { useCallback } from 'react';
import type {
  AIChallengeGame,
  AIChallengeSettings,
  AIDifficulty,
  AIChallengeResult,
} from '../../types/ai-challenge';
import { DEFAULT_AI_CHALLENGE_SETTINGS } from '../../types/ai-challenge';
import type { Flashcard } from '../../types/flashcard';
import { convertToQuestions, generateId } from './utils';

interface AIChallengeAppSettings {
  questionCount: number;
  timePerQuestion: number;
  accuracyModifier: number;
  speedMultiplier: number;
  autoAddDifficulty: 'random' | 'easy' | 'medium' | 'hard';
}

interface UseGameStartProps {
  flashcards: Flashcard[];
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: 'vip' | 'admin' | 'superadmin' | 'user';
  };
  progress: { totalWins: number; totalGames: number };
  aiSettings?: AIChallengeAppSettings;
  setGame: React.Dispatch<React.SetStateAction<AIChallengeGame | null>>;
  setResult: React.Dispatch<React.SetStateAction<AIChallengeResult | null>>;
  countdownTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  checkAIUnlocked: (difficulty: AIDifficulty) => boolean;
}

export function useGameStart({
  flashcards,
  currentUser,
  progress,
  aiSettings,
  setGame,
  setResult,
  countdownTimerRef,
  checkAIUnlocked,
}: UseGameStartProps) {
  // Start new game
  const startGame = useCallback(
    (difficulty: AIDifficulty, settings?: Partial<AIChallengeSettings>) => {
      if (!checkAIUnlocked(difficulty)) {
        console.warn('AI not unlocked:', difficulty);
        return;
      }

      // Merge default settings with app settings and passed settings
      const gameSettings = {
        ...DEFAULT_AI_CHALLENGE_SETTINGS,
        ...(aiSettings ? {
          totalQuestions: aiSettings.questionCount,
          timePerQuestion: aiSettings.timePerQuestion,
        } : {}),
        ...settings,
      };
      const questions = convertToQuestions(
        flashcards,
        gameSettings.totalQuestions,
        gameSettings.timePerQuestion
      );

      if (questions.length < gameSettings.totalQuestions) {
        console.warn('Not enough flashcards for questions');
        return;
      }

      const newGame: AIChallengeGame = {
        id: generateId(),
        status: 'countdown',
        settings: gameSettings,
        aiDifficulty: difficulty,
        questions,
        currentQuestionIndex: 0,
        playerStats: {
          odinhId: currentUser.id,
          displayName: currentUser.displayName,
          avatar: currentUser.avatar,
          role: currentUser.role,
          score: 0,
          correctAnswers: 0,
          totalAnswers: 0,
          streak: 0,
          bestStreak: 0,
          averageTimeMs: 0,
        },
        aiStats: {
          difficulty,
          score: 0,
          correctAnswers: 0,
          totalAnswers: 0,
        },
        roundResults: [],
        questionStartTime: null,
        totalWins: progress.totalWins,
        totalGames: progress.totalGames,
      };

      setGame(newGame);
      setResult(null);

      // Start countdown then begin playing
      countdownTimerRef.current = setTimeout(() => {
        setGame((prev) =>
          prev
            ? {
                ...prev,
                status: 'playing',
                questionStartTime: Date.now(),
              }
            : null
        );
      }, 3000);
    },
    [flashcards, currentUser, progress, checkAIUnlocked, aiSettings, setGame, setResult, countdownTimerRef]
  );

  return {
    startGame,
  };
}
