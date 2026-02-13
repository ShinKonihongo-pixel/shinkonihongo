// Core gameplay logic for AI Challenge
// Handles answer submission, AI responses, and round progression

import { useCallback } from 'react';
import type {
  AIChallengeGame,
  AIChallengeQuestion,
  AIChallengeResult,
  AnswerRecord,
  RoundResult,
} from '../../types/ai-challenge';
import { AI_OPPONENTS, calculateAIAnswer, getNextLockedAI } from '../../types/ai-challenge';
import { saveProgress, type JLPTLevel } from './utils';

interface AIChallengeAppSettings {
  questionCount: number;
  timePerQuestion: number;
  accuracyModifier: number;
  speedMultiplier: number;
  autoAddDifficulty: 'random' | 'easy' | 'medium' | 'hard';
}

interface UseGameplayProps {
  game: AIChallengeGame | null;
  currentQuestion: AIChallengeQuestion | null;
  aiSettings?: AIChallengeAppSettings;
  currentLevel: JLPTLevel;
  progress: { totalWins: number; totalGames: number };
  setGame: React.Dispatch<React.SetStateAction<AIChallengeGame | null>>;
  setResult: React.Dispatch<React.SetStateAction<AIChallengeResult | null>>;
  setProgressByLevel: React.Dispatch<React.SetStateAction<Record<JLPTLevel, { totalWins: number; totalGames: number }>>>;
  aiTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function useGameplay({
  game,
  currentQuestion,
  aiSettings,
  currentLevel,
  progress,
  setGame,
  setResult,
  setProgressByLevel,
  aiTimerRef,
}: UseGameplayProps) {
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
    [game, currentQuestion, aiSettings, setGame, aiTimerRef]
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
  }, [game, currentQuestion, aiSettings, setGame]);

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
  }, [game, progress, currentLevel, setGame, setResult, setProgressByLevel]);

  return {
    submitAnswer,
    handleTimeout,
    nextQuestion,
  };
}
