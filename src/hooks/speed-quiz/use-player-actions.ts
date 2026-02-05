// Player actions (answer, hint, skills)

import { useCallback } from 'react';
import type {
  SpeedQuizGame,
  SpeedQuizPlayer,
  SpeedQuizSkillType,
} from '../../types/speed-quiz';

interface UsePlayerActionsProps {
  game: SpeedQuizGame | null;
  currentPlayer: SpeedQuizPlayer | undefined;
  currentUserId: string;
  setGame: (game: SpeedQuizGame | null | ((prev: SpeedQuizGame | null) => SpeedQuizGame | null)) => void;
}

export function usePlayerActions({
  game,
  currentPlayer,
  currentUserId,
  setGame,
}: UsePlayerActionsProps) {
  const submitAnswer = useCallback((answer: string) => {
    if (!game || !currentPlayer || game.status !== 'playing') return;
    if (currentPlayer.hasAnswered) return;

    const isCorrect = answer.toLowerCase().trim() === game.currentQuestion?.answer.toLowerCase().trim();
    const answerTime = Date.now() - (game.roundStartTime || 0);

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      newPlayers[currentUserId] = {
        ...newPlayers[currentUserId],
        hasAnswered: true,
        currentAnswer: answer,
        answerTime,
        isCorrect,
      };

      const allAnswered = Object.values(newPlayers).every(p => p.hasAnswered);

      return {
        ...prev,
        players: newPlayers,
        status: allAnswered ? 'result' : 'playing',
      };
    });
  }, [game, currentPlayer, currentUserId, setGame]);

  const useHint = useCallback(() => {
    if (!game || !currentPlayer) return;
    if (currentPlayer.hintsRemaining <= 0) return;
    if (currentPlayer.hasAnswered) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      const player = newPlayers[currentUserId];
      newPlayers[currentUserId] = {
        ...player,
        hintsUsed: player.hintsUsed + 1,
        hintsRemaining: player.hintsRemaining - 1,
      };

      return { ...prev, players: newPlayers };
    });

    return game.currentQuestion?.hints[currentPlayer.hintsUsed] || null;
  }, [game, currentPlayer, currentUserId, setGame]);

  const useSkill = useCallback((skillType: SpeedQuizSkillType, targetId?: string) => {
    if (!game || !currentPlayer) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      const player = newPlayers[currentUserId];

      switch (skillType) {
        case 'double_points':
          newPlayers[currentUserId] = {
            ...player,
            hasDoublePoints: true,
            doublePointsTurns: 2,
          };
          break;

        case 'steal_points':
          if (targetId && newPlayers[targetId]) {
            const stolen = Math.min(50, newPlayers[targetId].score);
            newPlayers[targetId].score -= stolen;
            newPlayers[currentUserId].score += stolen;
          }
          break;

        case 'shield':
          newPlayers[currentUserId] = {
            ...player,
            hasShield: true,
            shieldTurns: 2,
          };
          break;

        case 'extra_hint':
          newPlayers[currentUserId] = {
            ...player,
            hintsRemaining: player.hintsRemaining + 2,
          };
          break;

        case 'slow_others':
          Object.keys(newPlayers).forEach(id => {
            if (id !== currentUserId) {
              newPlayers[id] = {
                ...newPlayers[id],
                isSlowed: true,
                slowedTurns: 1,
              };
            }
          });
          break;

        case 'reveal_first':
          break;
      }

      return { ...prev, players: newPlayers, status: 'result' };
    });
  }, [game, currentPlayer, currentUserId, setGame]);

  const skipSkill = useCallback(() => {
    setGame(prev => prev ? { ...prev, status: 'result' } : null);
  }, [setGame]);

  return {
    submitAnswer,
    useHint,
    useSkill,
    skipSkill,
  };
}
