// AI Challenge Hook - Manages 1v1 quiz battle against AI
// Handles game flow, AI behavior, scoring, and progress tracking

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  AIChallengeGame,
  AIChallengeQuestion,
  AIChallengeSettings,
  AIChallengeResult,
  AIDifficulty,
  RoundResult,
  AnswerRecord,
} from '../types/ai-challenge';
import {
  AI_OPPONENTS,
  DEFAULT_AI_CHALLENGE_SETTINGS,
  calculateAIAnswer,
  isAIUnlocked,
  getNextLockedAI,
} from '../types/ai-challenge';
import type { Flashcard } from '../types/flashcard';

// Storage key for player progress (per JLPT level)
const STORAGE_KEY_PREFIX = 'ai_challenge_progress_';

// JLPT levels
export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// Load progress from localStorage for specific level
function loadProgress(level: JLPTLevel): { totalWins: number; totalGames: number } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + level);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load AI Challenge progress:', e);
  }
  return { totalWins: 0, totalGames: 0 };
}

// Save progress to localStorage for specific level
function saveProgress(level: JLPTLevel, totalWins: number, totalGames: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + level, JSON.stringify({ totalWins, totalGames }));
  } catch (e) {
    console.error('Failed to save AI Challenge progress:', e);
  }
}

// Load progress for all levels
function loadAllProgress(): Record<JLPTLevel, { totalWins: number; totalGames: number }> {
  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1', 'BT'];
  const result: Record<string, { totalWins: number; totalGames: number }> = {};
  for (const level of levels) {
    result[level] = loadProgress(level);
  }
  return result as Record<JLPTLevel, { totalWins: number; totalGames: number }>;
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Convert flashcards to challenge questions
function convertToQuestions(
  cards: Flashcard[],
  count: number,
  timeLimit: number
): AIChallengeQuestion[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map((card) => {
    // Generate wrong options from other cards
    const otherCards = cards.filter((c) => c.id !== card.id);
    const wrongOptions = shuffleArray(otherCards)
      .slice(0, 3)
      .map((c) => c.meaning);

    const options = shuffleArray([card.meaning, ...wrongOptions]);
    const correctIndex = options.indexOf(card.meaning);

    return {
      id: generateId(),
      questionText: card.kanji || card.vocabulary,
      options,
      correctIndex,
      timeLimit,
      points: 100,
      category: card.kanji ? 'kanji' : 'vocabulary',
    };
  });
}

// AI Challenge settings from app settings
interface AIChallengeAppSettings {
  questionCount: number;
  timePerQuestion: number;
  accuracyModifier: number;
  speedMultiplier: number;
  autoAddDifficulty: 'random' | 'easy' | 'medium' | 'hard';
}

// Hook props
interface UseAIChallengeProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: 'vip' | 'admin' | 'superadmin' | 'user';
  };
  flashcards: Flashcard[];
  aiSettings?: AIChallengeAppSettings;
  currentLevel: JLPTLevel;
}

export function useAIChallenge({ currentUser, flashcards, aiSettings, currentLevel }: UseAIChallengeProps) {
  const [game, setGame] = useState<AIChallengeGame | null>(null);
  const [result, setResult] = useState<AIChallengeResult | null>(null);

  // Load saved progress for current level
  const [progressByLevel, setProgressByLevel] = useState(loadAllProgress);
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
    [flashcards, currentUser, progress, checkAIUnlocked, aiSettings]
  );

  // Submit player answer
  const submitAnswer = useCallback(
    (answerIndex: number) => {
      if (!game || game.status !== 'playing' || !currentQuestion) return;

      const timeMs = game.questionStartTime
        ? Date.now() - game.questionStartTime
        : 0;
      const isCorrect = answerIndex === currentQuestion.correctIndex;

      // Calculate AI answer with modifiers from settings
      const ai = AI_OPPONENTS[game.aiDifficulty];
      const aiResult = calculateAIAnswer(
        ai,
        currentQuestion.correctIndex,
        currentQuestion.options.length,
        aiSettings?.accuracyModifier ?? 0,
        aiSettings?.speedMultiplier ?? 1.0
      );

      // Player answered - check if faster than AI or wait for AI
      const playerAnswer: AnswerRecord = {
        questionId: currentQuestion.id,
        answerIndex,
        isCorrect,
        timeMs,
        points: isCorrect ? game.settings.pointsCorrect : 0,
      };

      // Add bonus if player answered correctly and faster than AI
      if (isCorrect && timeMs < aiResult.timeMs) {
        playerAnswer.points += game.settings.pointsBonus;
      }

      // Clear any pending AI timer
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }

      // Update game state to answered
      setGame((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'answered',
        };
      });

      // Wait for AI to "answer" (simulate delay)
      const aiDelay = Math.max(0, aiResult.timeMs - timeMs);

      aiTimerRef.current = setTimeout(() => {
        const aiAnswer: AnswerRecord = {
          questionId: currentQuestion.id,
          answerIndex: aiResult.answerIndex,
          isCorrect: aiResult.isCorrect,
          timeMs: aiResult.timeMs,
          points: aiResult.isCorrect ? game.settings.pointsCorrect : 0,
        };

        // Determine round winner
        let winner: 'player' | 'ai' | 'tie' = 'tie';
        if (isCorrect && !aiResult.isCorrect) {
          winner = 'player';
        } else if (!isCorrect && aiResult.isCorrect) {
          winner = 'ai';
        } else if (isCorrect && aiResult.isCorrect) {
          winner = timeMs < aiResult.timeMs ? 'player' : 'ai';
        }

        const roundResult: RoundResult = {
          questionId: currentQuestion.id,
          playerAnswer,
          aiAnswer,
          winner,
        };

        // Update stats
        setGame((prev) => {
          if (!prev) return null;

          const newStreak = isCorrect ? prev.playerStats.streak + 1 : 0;
          const newBestStreak = Math.max(prev.playerStats.bestStreak, newStreak);

          // Calculate new average time
          const totalTime =
            prev.playerStats.averageTimeMs * prev.playerStats.totalAnswers + timeMs;
          const newTotalAnswers = prev.playerStats.totalAnswers + 1;
          const newAverageTime = totalTime / newTotalAnswers;

          return {
            ...prev,
            status: 'revealing',
            playerStats: {
              ...prev.playerStats,
              score: prev.playerStats.score + playerAnswer.points,
              correctAnswers: prev.playerStats.correctAnswers + (isCorrect ? 1 : 0),
              totalAnswers: newTotalAnswers,
              streak: newStreak,
              bestStreak: newBestStreak,
              averageTimeMs: newAverageTime,
            },
            aiStats: {
              ...prev.aiStats,
              score: prev.aiStats.score + aiAnswer.points,
              correctAnswers:
                prev.aiStats.correctAnswers + (aiResult.isCorrect ? 1 : 0),
              totalAnswers: prev.aiStats.totalAnswers + 1,
            },
            roundResults: [...prev.roundResults, roundResult],
          };
        });
      }, Math.min(aiDelay, 2000)); // Cap AI delay to 2 seconds after player answers
    },
    [game, currentQuestion, aiSettings]
  );

  // Handle timeout (player didn't answer in time)
  const handleTimeout = useCallback(() => {
    if (!game || game.status !== 'playing' || !currentQuestion) return;

    // Player didn't answer
    const playerAnswer: AnswerRecord = {
      questionId: currentQuestion.id,
      answerIndex: null,
      isCorrect: false,
      timeMs: game.settings.timePerQuestion * 1000,
      points: 0,
    };

    // AI still answers with modifiers
    const ai = AI_OPPONENTS[game.aiDifficulty];
    const aiResult = calculateAIAnswer(
      ai,
      currentQuestion.correctIndex,
      currentQuestion.options.length,
      aiSettings?.accuracyModifier ?? 0,
      aiSettings?.speedMultiplier ?? 1.0
    );

    const aiAnswer: AnswerRecord = {
      questionId: currentQuestion.id,
      answerIndex: aiResult.answerIndex,
      isCorrect: aiResult.isCorrect,
      timeMs: aiResult.timeMs,
      points: aiResult.isCorrect ? game.settings.pointsCorrect : 0,
    };

    const winner: 'player' | 'ai' | 'tie' = aiResult.isCorrect ? 'ai' : 'tie';

    const roundResult: RoundResult = {
      questionId: currentQuestion.id,
      playerAnswer,
      aiAnswer,
      winner,
    };

    setGame((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'revealing',
        playerStats: {
          ...prev.playerStats,
          totalAnswers: prev.playerStats.totalAnswers + 1,
          streak: 0,
        },
        aiStats: {
          ...prev.aiStats,
          score: prev.aiStats.score + aiAnswer.points,
          correctAnswers:
            prev.aiStats.correctAnswers + (aiResult.isCorrect ? 1 : 0),
          totalAnswers: prev.aiStats.totalAnswers + 1,
        },
        roundResults: [...prev.roundResults, roundResult],
      };
    });
  }, [game, currentQuestion, aiSettings]);

  // Next question or finish game
  const nextQuestion = useCallback(() => {
    if (!game || game.status !== 'revealing') return;

    const nextIndex = game.currentQuestionIndex + 1;

    // Check if game is finished
    if (nextIndex >= game.questions.length) {
      // Calculate final result
      const playerWon = game.playerStats.score > game.aiStats.score;
      const isTie = game.playerStats.score === game.aiStats.score;

      // Update progress
      const newTotalGames = progress.totalGames + 1;
      const newTotalWins = playerWon ? progress.totalWins + 1 : progress.totalWins;

      // Check for new unlock
      const previousNextLocked = getNextLockedAI(progress.totalWins);
      const newNextLocked = getNextLockedAI(newTotalWins);
      const isNewUnlock = previousNextLocked !== newNextLocked && playerWon;

      const gameResult: AIChallengeResult = {
        winner: isTie ? 'tie' : playerWon ? 'player' : 'ai',
        playerScore: game.playerStats.score,
        aiScore: game.aiStats.score,
        playerCorrect: game.playerStats.correctAnswers,
        aiCorrect: game.aiStats.correctAnswers,
        totalQuestions: game.questions.length,
        bestStreak: game.playerStats.bestStreak,
        averageTimeMs: game.playerStats.averageTimeMs,
        aiDifficulty: game.aiDifficulty,
        isNewUnlock,
        unlockedAI: isNewUnlock ? previousNextLocked : null,
      };

      // Save progress for current level
      saveProgress(currentLevel, newTotalWins, newTotalGames);
      setProgressByLevel(prev => ({
        ...prev,
        [currentLevel]: { totalWins: newTotalWins, totalGames: newTotalGames }
      }));

      setGame((prev) => (prev ? { ...prev, status: 'finished' } : null));
      setResult(gameResult);
    } else {
      // Continue to next question
      setGame((prev) =>
        prev
          ? {
              ...prev,
              currentQuestionIndex: nextIndex,
              status: 'playing',
              questionStartTime: Date.now(),
            }
          : null
      );
    }
  }, [game, progress, currentLevel]);

  // Reset game
  const resetGame = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    setGame(null);
    setResult(null);
  }, []);

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
