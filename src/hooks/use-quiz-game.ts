// Hook for managing Quiz Game state and actions

import { useState, useCallback, useEffect } from 'react';
import type {
  QuizGame,
  CreateGameData,
  GameResults,
  PowerUpType,
} from '../types/quiz-game';
import type { Flashcard } from '../types/flashcard';
import type { JLPTQuestion } from '../types/jlpt-question';
import * as gameService from '../services/quiz-game-firestore';

interface UseQuizGameOptions {
  playerId: string;
  playerName: string;
}

export function useQuizGame({ playerId, playerName }: UseQuizGameOptions) {
  const [game, setGame] = useState<QuizGame | null>(null);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to game updates when game is set
  useEffect(() => {
    if (!game?.id) return;

    const unsubscribe = gameService.subscribeToGame(game.id, (updatedGame) => {
      if (!updatedGame) {
        // Game was deleted
        setGame(null);
        setError('Game đã bị xóa');
        return;
      }
      setGame(updatedGame);

      // Fetch results when game is finished
      if (updatedGame.status === 'finished' && !gameResults) {
        gameService.getGameResults(updatedGame.id).then(setGameResults);
      }
    });

    return () => unsubscribe();
  }, [game?.id, gameResults]);

  // Create a new game
  const createGame = useCallback(async (
    data: CreateGameData,
    flashcards: Flashcard[],
    jlptQuestions?: JLPTQuestion[]
  ): Promise<QuizGame | null> => {
    setLoading(true);
    setError(null);
    try {
      const newGame = await gameService.createGame(data, playerId, playerName, flashcards, jlptQuestions);
      setGame(newGame);
      return newGame;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tạo game thất bại';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [playerId, playerName]);

  // Join an existing game by code
  const joinGame = useCallback(async (gameCode: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { game: joinedGame, error: joinError } = await gameService.joinGame(
        gameCode,
        playerId,
        playerName
      );

      if (joinError) {
        setError(joinError);
        return false;
      }

      setGame(joinedGame);
      return true;
    } catch (err) {
      setError('Không thể tham gia game');
      return false;
    } finally {
      setLoading(false);
    }
  }, [playerId, playerName]);

  // Leave current game
  const leaveGame = useCallback(async (): Promise<void> => {
    if (!game) return;
    try {
      await gameService.leaveGame(game.id, playerId);
      setGame(null);
      setGameResults(null);
      setError(null);
    } catch (err) {
      console.error('Error leaving game:', err);
    }
  }, [game, playerId]);

  // Kick a player (host only)
  const kickPlayer = useCallback(async (targetPlayerId: string): Promise<boolean> => {
    if (!game) return false;
    return gameService.kickPlayer(game.id, playerId, targetPlayerId);
  }, [game, playerId]);

  // Start the game (host only)
  const startGame = useCallback(async (): Promise<boolean> => {
    if (!game) return false;
    setError(null);
    try {
      const success = await gameService.startGame(game.id, playerId);
      if (!success) {
        setError('Không đủ người chơi để bắt đầu');
      }
      return success;
    } catch (err) {
      setError('Không thể bắt đầu game');
      return false;
    }
  }, [game, playerId]);

  // Submit answer
  const submitAnswer = useCallback(async (answerIndex: number): Promise<void> => {
    if (!game) return;
    try {
      await gameService.submitAnswer(game.id, playerId, answerIndex);
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  }, [game, playerId]);

  // Reveal answer (host only)
  const revealAnswer = useCallback(async (): Promise<void> => {
    if (!game) return;
    try {
      await gameService.revealAnswer(game.id, playerId);
    } catch (err) {
      console.error('Error revealing answer:', err);
    }
  }, [game, playerId]);

  // Next round (host only)
  const nextRound = useCallback(async (): Promise<void> => {
    if (!game) return;
    try {
      await gameService.nextRound(game.id, playerId);
    } catch (err) {
      console.error('Error going to next round:', err);
    }
  }, [game, playerId]);

  // Continue from power-up selection (host only)
  const continueFromPowerUp = useCallback(async (): Promise<void> => {
    if (!game) return;
    try {
      await gameService.continueFromSpecial(game.id, playerId);
    } catch (err) {
      console.error('Error continuing from power-up:', err);
    }
  }, [game, playerId]);

  // Continue from leaderboard (host only)
  const continueFromLeaderboard = useCallback(async (): Promise<void> => {
    if (!game) return;
    try {
      await gameService.continueFromLeaderboard(game.id, playerId);
    } catch (err) {
      console.error('Error continuing from leaderboard:', err);
    }
  }, [game, playerId]);

  // Use a power-up
  const usePowerUp = useCallback(async (
    powerUpType: PowerUpType,
    targetPlayerId?: string
  ): Promise<boolean> => {
    if (!game) return false;
    try {
      return await gameService.usePowerUp(game.id, playerId, powerUpType, targetPlayerId);
    } catch (err) {
      console.error('Error using power-up:', err);
      return false;
    }
  }, [game, playerId]);

  // Reset game state
  const resetGame = useCallback(() => {
    setGame(null);
    setGameResults(null);
    setError(null);
  }, []);

  // Computed values
  const isHost = game?.hostId === playerId;
  const currentPlayer = game?.players[playerId] || null;
  const currentQuestion = game ? game.questions[game.currentRound] : null;
  const playerCount = game ? Object.keys(game.players).length : 0;
  const sortedPlayers = game
    ? Object.values(game.players).sort((a, b) => b.score - a.score)
    : [];

  return {
    // State
    game,
    gameResults,
    loading,
    error,

    // Computed
    isHost,
    currentPlayer,
    currentQuestion,
    playerCount,
    sortedPlayers,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    submitAnswer,
    revealAnswer,
    nextRound,
    continueFromPowerUp,
    continueFromLeaderboard,
    usePowerUp,
    resetGame,
    setError,
  };
}
