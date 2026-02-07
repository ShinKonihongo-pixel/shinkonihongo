// Player actions (answer, hint, skills, drawing)

import { useCallback } from 'react';
import type {
  KanjiBattleGame,
  KanjiBattlePlayer,
  KanjiBattleSkillType,
  StrokeMatchResult,
} from '../../types/kanji-battle';
import { calculateDrawingScore } from '../../lib/stroke-matcher';

interface UsePlayerActionsProps {
  game: KanjiBattleGame | null;
  currentPlayer: KanjiBattlePlayer | undefined;
  currentUserId: string;
  setGame: (game: KanjiBattleGame | null | ((prev: KanjiBattleGame | null) => KanjiBattleGame | null)) => void;
}

export function usePlayerActions({
  game,
  currentPlayer,
  currentUserId,
  setGame,
}: UsePlayerActionsProps) {
  // Submit text answer (read mode)
  const submitAnswer = useCallback((answer: string) => {
    if (!game || !currentPlayer || game.status !== 'playing') return;
    if (currentPlayer.hasAnswered) return;

    const normalizedAnswer = answer.toLowerCase().trim();
    const isCorrect = game.currentQuestion?.acceptedAnswers.some(
      accepted => accepted.toLowerCase().trim() === normalizedAnswer
    ) || false;
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
      return { ...prev, players: newPlayers };
    });
  }, [game, currentPlayer, currentUserId, setGame]);

  // Submit drawing (write mode)
  const submitDrawing = useCallback((strokeResults: StrokeMatchResult[], drawingTimeMs: number) => {
    if (!game || !currentPlayer || game.status !== 'playing') return;
    if (currentPlayer.hasAnswered) return;

    const totalStrokes = game.currentQuestion?.strokeCount || 1;
    const timeLimitMs = (game.settings.timePerQuestion || 15) * 1000;
    const score = calculateDrawingScore(strokeResults, totalStrokes, drawingTimeMs, timeLimitMs);
    const isCorrect = score >= 40; // 40% threshold for "correct"
    const answerTime = Date.now() - (game.roundStartTime || 0);

    setGame(prev => {
      if (!prev) return null;
      const newPlayers = { ...prev.players };
      newPlayers[currentUserId] = {
        ...newPlayers[currentUserId],
        hasAnswered: true,
        currentAnswer: `[drawing:${score}%]`,
        answerTime,
        isCorrect,
        strokeScore: score,
        drawingTimeMs,
      };
      return { ...prev, players: newPlayers };
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

  const useSkill = useCallback((skillType: KanjiBattleSkillType, targetId?: string) => {
    if (!game || !currentPlayer) return;
    setGame(prev => {
      if (!prev) return null;
      const newPlayers = { ...prev.players };
      const player = newPlayers[currentUserId];
      switch (skillType) {
        case 'double_points':
          newPlayers[currentUserId] = { ...player, hasDoublePoints: true, doublePointsTurns: 2 };
          break;
        case 'steal_points':
          if (targetId && newPlayers[targetId]) {
            const stolen = Math.min(50, newPlayers[targetId].score);
            newPlayers[targetId].score -= stolen;
            newPlayers[currentUserId].score += stolen;
          }
          break;
        case 'shield':
          newPlayers[currentUserId] = { ...player, hasShield: true, shieldTurns: 2 };
          break;
        case 'extra_hint':
          newPlayers[currentUserId] = { ...player, hintsRemaining: player.hintsRemaining + 2 };
          break;
        case 'slow_others':
          Object.keys(newPlayers).forEach(id => {
            if (id !== currentUserId) {
              newPlayers[id] = { ...newPlayers[id], isSlowed: true, slowedTurns: 1 };
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

  return { submitAnswer, submitDrawing, useHint, useSkill, skipSkill };
}
