// Sub-hook: game create / join / leave / kick / start

import { useState, useCallback, useRef } from 'react';
import type { QuizGame, CreateGameData } from '../types/quiz-game';
import type { Flashcard } from '../types/flashcard';
import type { JLPTQuestion } from '../types/jlpt-question';
import * as gameService from '../services/quiz-game-firestore';
import { handleError } from '../utils/error-handler';

interface UseQuizGameLifecycleOptions {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  playerRole?: string;
}

export function useQuizGameLifecycle({
  playerId,
  playerName,
  playerAvatar,
  playerRole,
}: UseQuizGameLifecycleOptions) {
  const [game, setGame] = useState<QuizGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: suppress error when player voluntarily leaves
  const leavingRef = useRef(false);

  const createGame = useCallback(async (
    data: CreateGameData,
    flashcards: Flashcard[],
    jlptQuestions?: JLPTQuestion[]
  ): Promise<QuizGame | null> => {
    setLoading(true);
    setError(null);
    try {
      const newGame = await gameService.createGame(data, playerId, playerName, playerAvatar, flashcards, jlptQuestions, playerRole);
      setGame(newGame);
      return newGame;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tạo game thất bại';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [playerId, playerName, playerAvatar, playerRole]);

  const joinGame = useCallback(async (gameCode: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { game: joinedGame, error: joinError } = await gameService.joinGame(
        gameCode, playerId, playerName, playerAvatar, playerRole
      );
      if (joinError) { setError(joinError); return false; }
      setGame(joinedGame);
      return true;
    } catch (_err) {
      setError('Không thể tham gia game');
      return false;
    } finally {
      setLoading(false);
    }
  }, [playerId, playerName, playerAvatar, playerRole]);

  const joinGameById = useCallback(async (gameId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const targetGame = await gameService.getGame(gameId);
      if (!targetGame) { setError('Phòng không tồn tại'); return false; }
      const { game: joinedGame, error: joinError } = await gameService.joinGame(
        targetGame.code, playerId, playerName, playerAvatar
      );
      if (joinError) { setError(joinError); return false; }
      setGame(joinedGame);
      return true;
    } catch (_err) {
      setError('Không thể tham gia game');
      return false;
    } finally {
      setLoading(false);
    }
  }, [playerId, playerName, playerAvatar, playerRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const leaveGame = useCallback(async (): Promise<void> => {
    if (!game) return;
    leavingRef.current = true;
    try {
      await gameService.leaveGame(game.id, playerId);
      setGame(null);
      setError(null);
    } catch (err) {
      handleError(err, { context: 'useQuizGame' });
    } finally {
      leavingRef.current = false;
    }
  }, [game, playerId]);

  const kickPlayer = useCallback(async (targetPlayerId: string): Promise<boolean> => {
    if (!game) return false;
    return gameService.kickPlayer(game.id, playerId, targetPlayerId);
  }, [game, playerId]);

  const startGame = useCallback(async (): Promise<boolean> => {
    if (!game) return false;
    setError(null);
    try {
      const success = await gameService.startGame(game.id, playerId);
      if (!success) setError('Không đủ người chơi để bắt đầu');
      return success;
    } catch (_err) {
      setError('Không thể bắt đầu game');
      return false;
    }
  }, [game, playerId]);

  const resetGame = useCallback(() => {
    setGame(null);
    setError(null);
  }, []);

  return {
    game,
    setGame,
    loading,
    error,
    setError,
    leavingRef,
    createGame,
    joinGame,
    joinGameById,
    leaveGame,
    kickPlayer,
    startGame,
    resetGame,
  };
}
