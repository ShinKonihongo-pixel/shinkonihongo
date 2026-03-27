// Sub-hook: in-game actions (answer, reveal, next, power-ups, host message)

import { useCallback } from 'react';
import type { QuizGame, PowerUpType } from '../types/quiz-game';
import * as gameService from '../services/quiz-game-firestore';
import { handleError } from '../utils/error-handler';

interface UseQuizGamePlayOptions {
  game: QuizGame | null;
  playerId: string;
}

export function useQuizGamePlay({ game, playerId }: UseQuizGamePlayOptions) {
  const submitAnswer = useCallback(async (answerIndex: number): Promise<void> => {
    if (!game) return;
    try {
      await gameService.submitAnswer(game.id, playerId, answerIndex);
    } catch (err) {
      handleError(err, { context: 'useQuizGame' });
    }
  }, [game, playerId]);

  const revealAnswer = useCallback(async (): Promise<void> => {
    if (!game) return;
    try {
      await gameService.revealAnswer(game.id, playerId);
    } catch (err) {
      handleError(err, { context: 'useQuizGame' });
    }
  }, [game, playerId]);

  const nextRound = useCallback(async (): Promise<void> => {
    if (!game) return;
    try {
      await gameService.nextRound(game.id, playerId);
    } catch (err) {
      handleError(err, { context: 'useQuizGame' });
    }
  }, [game, playerId]);

  const continueFromPowerUp = useCallback(async (): Promise<void> => {
    if (!game) return;
    try {
      await gameService.continueFromSpecial(game.id, playerId);
    } catch (err) {
      handleError(err, { context: 'useQuizGame' });
    }
  }, [game, playerId]);

  const continueFromLeaderboard = useCallback(async (): Promise<void> => {
    if (!game) return;
    try {
      await gameService.continueFromLeaderboard(game.id, playerId);
    } catch (err) {
      handleError(err, { context: 'useQuizGame' });
    }
  }, [game, playerId]);

  const usePowerUp = useCallback(async (
    powerUpType: PowerUpType,
    targetPlayerId?: string
  ): Promise<boolean> => {
    if (!game) return false;
    try {
      return await gameService.usePowerUp(game.id, playerId, powerUpType, targetPlayerId);
    } catch (err) {
      handleError(err, { context: 'useQuizGame' });
      return false;
    }
  }, [game, playerId]);

  const updateHostMessage = useCallback(async (message: string): Promise<void> => {
    if (!game) return;
    try {
      await gameService.updateGame(game.id, { hostMessage: message });
    } catch (err) {
      handleError(err, { context: 'useQuizGame' });
    }
  }, [game]);

  return {
    submitAnswer,
    revealAnswer,
    nextRound,
    continueFromPowerUp,
    continueFromLeaderboard,
    usePowerUp,
    updateHostMessage,
  };
}
