// Submit answer logic
import { useCallback } from 'react';
import type { RacingGame, RacingPlayer, RacingQuestion } from '../../types/racing-game';

interface UseSubmitAnswerProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  currentUserId: string;
  currentPlayer?: RacingPlayer;
  currentQuestion: RacingQuestion | null;
}

export function useSubmitAnswer({
  game,
  setGame,
  currentUserId,
  currentPlayer,
  currentQuestion,
}: UseSubmitAnswerProps) {
  const submitAnswer = useCallback((answerIndex: number) => {
    if (!game || !currentQuestion || game.status !== 'answering') return;
    if (currentPlayer?.currentAnswer !== undefined) return;

    const answerTime = Date.now() - (game.questionStartTime || Date.now());
    const isCorrect = answerIndex === currentQuestion.correctIndex;

    setGame(prev => {
      if (!prev) return null;

      const player = prev.players[currentUserId];
      if (!player) return prev;

      let newSpeed = player.currentSpeed;
      let newDistance = player.distance;
      let newStreak = isCorrect ? player.streak + 1 : 0;
      let newCorrect = player.correctAnswers + (isCorrect ? 1 : 0);
      let points = 0;

      if (isCorrect && !player.isFrozen) {
        let speedGain = currentQuestion.speedBonus;

        const doubleSpeed = player.activeFeatures.find(f => f.type === 'double_speed');
        if (doubleSpeed) speedGain *= 2;

        const speedBoost = player.activeFeatures.find(f => f.type === 'speed_boost');
        if (speedBoost) speedGain *= 1.2;

        if (newStreak >= 3) {
          speedGain *= 1 + (newStreak - 2) * 0.1;
        }

        newSpeed = Math.min(player.vehicle.maxSpeed, newSpeed + speedGain);
        const distanceGain = (newSpeed / prev.settings.trackLength) * 2;
        newDistance = Math.min(100, newDistance + distanceGain);
        points = Math.round(currentQuestion.speedBonus * 10 * (1 + newStreak * 0.1));
      }

      const updatedFeatures = player.activeFeatures
        .map(f => ({ ...f, remainingRounds: f.remainingRounds - 1 }))
        .filter(f => f.remainingRounds > 0);

      const updatedPlayer: RacingPlayer = {
        ...player,
        currentSpeed: newSpeed,
        distance: newDistance,
        correctAnswers: newCorrect,
        totalAnswers: player.totalAnswers + 1,
        streak: newStreak,
        currentAnswer: answerIndex,
        answerTime,
        activeFeatures: updatedFeatures,
        hasShield: updatedFeatures.some(f => f.type === 'shield'),
        isFrozen: false,
        isFinished: newDistance >= 100,
        finishPosition: newDistance >= 100 ? Object.values(prev.players).filter(p => p.isFinished).length + 1 : undefined,
        totalPoints: player.totalPoints + points,
      };

      return {
        ...prev,
        players: { ...prev.players, [currentUserId]: updatedPlayer },
      };
    });
  }, [game, currentQuestion, currentPlayer, currentUserId, setGame]);

  return { submitAnswer };
}
