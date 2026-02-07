// Bot behavior and auto-answering logic

import { useCallback } from 'react';
import type { KanjiBattleGame } from '../../types/kanji-battle';

interface UseBotLogicProps {
  game: KanjiBattleGame | null;
  setGame: (game: KanjiBattleGame | null | ((prev: KanjiBattleGame | null) => KanjiBattleGame | null)) => void;
}

export function useBotLogic({ game, setGame }: UseBotLogicProps) {
  const scheduleBotAnswers = useCallback(() => {
    if (!game) return;

    const isWriteMode = game.settings.gameMode === 'write';
    const bots = Object.values(game.players).filter(p => p.isBot);

    bots.forEach(bot => {
      const delay = (bot.isSlowed ? 4000 : 2000) + Math.random() * 4000;
      const accuracy = 0.65 + Math.random() * 0.25;

      setTimeout(() => {
        setGame(prev => {
          if (!prev || prev.status !== 'playing') return prev;
          if (prev.players[bot.odinhId]?.hasAnswered) return prev;

          const isCorrect = Math.random() < accuracy;

          const newPlayers = { ...prev.players };

          if (isWriteMode) {
            // Write mode: bots complete with random accuracy 50-90%
            const strokeScore = isCorrect ? Math.round(50 + Math.random() * 40) : Math.round(10 + Math.random() * 25);
            newPlayers[bot.odinhId] = {
              ...newPlayers[bot.odinhId],
              hasAnswered: true,
              currentAnswer: `[drawing:${strokeScore}%]`,
              answerTime: Date.now() - (prev.roundStartTime || 0),
              isCorrect: strokeScore >= 40,
              strokeScore,
              drawingTimeMs: delay,
            };
          } else {
            // Read mode: same as before
            const answer = isCorrect
              ? prev.currentQuestion?.meaning || ''
              : 'wrong answer';
            newPlayers[bot.odinhId] = {
              ...newPlayers[bot.odinhId],
              hasAnswered: true,
              currentAnswer: answer,
              answerTime: Date.now() - (prev.roundStartTime || 0),
              isCorrect,
            };
          }

          return { ...prev, players: newPlayers };
        });
      }, delay);
    });
  }, [game, setGame]);

  return { scheduleBotAnswers };
}
