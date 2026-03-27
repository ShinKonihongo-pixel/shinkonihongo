// Sub-hook: bot auto-answer and bot auto-join timer effects

import { useEffect, useRef } from 'react';
import type { QuizGame } from '../types/quiz-game';
import { handleError } from '../utils/error-handler';

interface UseQuizGameBotsOptions {
  game: QuizGame | null;
  playerId: string;
}

export function useQuizGameBots({ game, playerId }: UseQuizGameBotsOptions) {
  // Bot auto-answer: when status is 'question', bots answer after 1-6s with 80-100% accuracy
  const botAnswerTimersRef = useRef<NodeJS.Timeout[]>([]);
  useEffect(() => {
    botAnswerTimersRef.current.forEach(t => clearTimeout(t));
    botAnswerTimersRef.current = [];

    if (!game || game.status !== 'question' || game.hostId !== playerId) return;

    const question = game.questions[game.currentRound];
    if (!question) return;

    for (const [pid, player] of Object.entries(game.players)) {
      if (!player.isBot || player.currentAnswer !== null) continue;

      const delay = 1000 + Math.floor(Math.random() * 5000); // 1-6s
      const timer = setTimeout(async () => {
        try {
          const accuracy = 0.8 + Math.random() * 0.2; // 80-100%
          const isCorrect = Math.random() < accuracy;
          const answer = isCorrect
            ? question.correctIndex
            : (question.correctIndex + 1 + Math.floor(Math.random() * 3)) % question.options.length;
          const { updateGameFields } = await import('../services/quiz-game/game-crud');
          await updateGameFields(game.id, {
            [`players.${pid}.currentAnswer`]: answer,
            [`players.${pid}.answerTime`]: delay,
          });
        } catch (err) {
          handleError(err, { context: 'useQuizGame/botAnswer', silent: true });
        }
      }, delay);
      botAnswerTimersRef.current.push(timer);
    }

    return () => {
      botAnswerTimersRef.current.forEach(t => clearTimeout(t));
      botAnswerTimersRef.current = [];
    };
  }, [game?.status, game?.currentRound, game?.id, playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-add AI bot after random 15-60s when host is alone in lobby
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botScheduledForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!game || game.hostId !== playerId || game.status !== 'waiting' || !game.id) return;
    const pCount = Object.keys(game.players).length;

    if (pCount >= 2) {
      if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
      botScheduledForRef.current = null;
      return;
    }

    if (botScheduledForRef.current === game.id) return;
    botScheduledForRef.current = game.id;

    const gameId = game.id;
    const delay = 15000 + Math.floor(Math.random() * 45000); // 15-60s

    botTimerRef.current = setTimeout(async () => {
      try {
        const { generateBots } = await import('../types/game-hub');
        const { generateId } = await import('../lib/game-utils');
        const { updateGameFields } = await import('../services/quiz-game/game-crud');

        const [bot] = generateBots(1);
        const botId = `bot-${generateId()}`;
        const botPlayer = {
          id: botId,
          name: bot.name,
          avatar: bot.avatar,
          role: 'bot',
          isBot: true,
          score: 0,
          isHost: false,
          isBlocked: false,
          hasDoublePoints: false,
          hasShield: false,
          hasTimeFreeze: false,
          currentAnswer: null,
          answerTime: null,
          streak: 0,
          joinedAt: new Date().toISOString(),
        };
        await updateGameFields(gameId, { [`players.${botId}`]: botPlayer });
      } catch (err) {
        handleError(err, { context: 'useQuizGame/botJoin', silent: true });
      }
    }, delay);

    return () => {
      if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    };
  }, [game?.id, game?.status, game?.hostId, playerId, Object.keys(game?.players ?? {}).length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup bot timer on unmount
  useEffect(() => () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); }, []);
}
