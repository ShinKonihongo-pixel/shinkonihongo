// Bot behavior and auto-answering logic

import { useCallback } from 'react';
import type { SpeedQuizGame } from '../../types/speed-quiz';

interface UseBotLogicProps {
  game: SpeedQuizGame | null;
  setGame: (game: SpeedQuizGame | null | ((prev: SpeedQuizGame | null) => SpeedQuizGame | null)) => void;
}

export function useBotLogic({ game, setGame }: UseBotLogicProps) {
  const scheduleBotAnswers = useCallback(() => {
    if (!game) return;

    const bots = Object.values(game.players).filter(p => p.isBot);
    bots.forEach(bot => {
      const delay = (bot.isSlowed ? 4000 : 2000) + Math.random() * 4000;
      const accuracy = 0.65 + Math.random() * 0.25;

      setTimeout(() => {
        setGame(prev => {
          if (!prev || prev.status !== 'playing') return prev;
          if (prev.players[bot.odinhId]?.hasAnswered) return prev;

          const isCorrect = Math.random() < accuracy;
          const answer = isCorrect
            ? prev.currentQuestion?.answer || ''
            : 'wrong answer';

          const newPlayers = { ...prev.players };
          newPlayers[bot.odinhId] = {
            ...newPlayers[bot.odinhId],
            hasAnswered: true,
            currentAnswer: answer,
            answerTime: Date.now() - (prev.roundStartTime || 0),
            isCorrect,
          };

          return { ...prev, players: newPlayers };
        });
      }, delay);
    });
  }, [game, setGame]);

  return {
    scheduleBotAnswers,
  };
}
