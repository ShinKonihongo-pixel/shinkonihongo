// Bot auto-answer logic hook
import { useEffect } from 'react';
import type { RacingGame, RacingPlayer } from '../../types/racing-game';

interface UseBotLogicProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  botAnswerTimersRef: React.MutableRefObject<NodeJS.Timeout[]>;
}

export function useBotLogic({ game, setGame, botAnswerTimersRef }: UseBotLogicProps) {
  useEffect(() => {
    if (!game || game.status !== 'answering') return;

    const currentQ = game.questions[game.currentQuestionIndex];
    if (!currentQ) return;

    // Clear previous bot timers
    botAnswerTimersRef.current.forEach(t => clearTimeout(t));
    botAnswerTimersRef.current = [];

    // Get bots that haven't answered yet
    const bots = Object.values(game.players).filter(
      p => p.isBot && p.currentAnswer === undefined
    );

    // Each bot answers with random delay (1-8 seconds)
    bots.forEach(bot => {
      const delay = 1000 + Math.random() * 7000; // 1-8 seconds
      const timer = setTimeout(() => {
        // 60-80% accuracy per bot
        const accuracy = 0.6 + Math.random() * 0.2;
        const isCorrect = Math.random() < accuracy;
        const answerIndex = isCorrect
          ? currentQ.correctIndex
          : [0, 1, 2, 3].filter(i => i !== currentQ.correctIndex)[Math.floor(Math.random() * 3)];

        setGame(prev => {
          if (!prev || prev.status !== 'answering') return prev;

          const botPlayer = prev.players[bot.odinhId];
          if (!botPlayer || botPlayer.currentAnswer !== undefined) return prev;

          const answerTime = Date.now() - (prev.questionStartTime || Date.now());
          const correct = answerIndex === currentQ.correctIndex;

          let newSpeed = botPlayer.currentSpeed;
          let newDistance = botPlayer.distance;
          let newStreak = correct ? botPlayer.streak + 1 : 0;
          let points = 0;

          if (correct && !botPlayer.isFrozen) {
            let speedGain = currentQ.speedBonus;
            if (newStreak >= 3) speedGain *= 1 + (newStreak - 2) * 0.1;
            newSpeed = Math.min(botPlayer.vehicle.maxSpeed, newSpeed + speedGain);
            const distanceGain = (newSpeed / prev.settings.trackLength) * 2;
            newDistance = Math.min(100, newDistance + distanceGain);
            points = Math.round(currentQ.speedBonus * 10 * (1 + newStreak * 0.1));
          }

          const updatedFeatures = botPlayer.activeFeatures
            .map(f => ({ ...f, remainingRounds: f.remainingRounds - 1 }))
            .filter(f => f.remainingRounds > 0);

          const updatedBot: RacingPlayer = {
            ...botPlayer,
            currentSpeed: newSpeed,
            distance: newDistance,
            correctAnswers: botPlayer.correctAnswers + (correct ? 1 : 0),
            totalAnswers: botPlayer.totalAnswers + 1,
            streak: newStreak,
            currentAnswer: answerIndex,
            answerTime,
            activeFeatures: updatedFeatures,
            hasShield: updatedFeatures.some(f => f.type === 'shield'),
            isFrozen: false,
            isFinished: newDistance >= 100,
            finishPosition: newDistance >= 100
              ? Object.values(prev.players).filter(p => p.isFinished).length + 1
              : undefined,
            totalPoints: botPlayer.totalPoints + points,
          };

          return {
            ...prev,
            players: { ...prev.players, [bot.odinhId]: updatedBot },
          };
        });
      }, delay);

      botAnswerTimersRef.current.push(timer);
    });

    return () => {
      botAnswerTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, [game?.status, game?.currentQuestionIndex]);
}
