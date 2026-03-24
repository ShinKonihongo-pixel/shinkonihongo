// Hook for managing Quiz Game state and actions

import { useState, useCallback, useEffect, useRef } from 'react';
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
  playerAvatar?: string;
  playerRole?: string;
}

export function useQuizGame({ playerId, playerName, playerAvatar, playerRole }: UseQuizGameOptions) {
  const [game, setGame] = useState<QuizGame | null>(null);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [availableRooms, setAvailableRooms] = useState<QuizGame[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: suppress error when player voluntarily leaves
  const leavingRef = useRef(false);

  // Subscribe to game updates when game is set
  useEffect(() => {
    if (!game?.id) return;

    const unsubscribe = gameService.subscribeToGame(game.id, (updatedGame) => {
      if (!updatedGame) {
        // Game was deleted — skip error if we voluntarily left
        setGame(null);
        if (!leavingRef.current) {
          setError('Game đã bị xóa');
        }
        return;
      }

      // Detect if current player was kicked (skip if voluntary leave)
      if (!updatedGame.players[playerId] && updatedGame.status === 'waiting') {
        setGame(null);
        if (!leavingRef.current) {
          setError('Bạn đã bị kick khỏi phòng');
        }
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

  // Bot auto-answer: when status is 'question', bots answer after 1-6s with 80-100% accuracy
  const botAnswerTimersRef = useRef<NodeJS.Timeout[]>([]);
  useEffect(() => {
    // Clear previous timers
    botAnswerTimersRef.current.forEach(t => clearTimeout(t));
    botAnswerTimersRef.current = [];

    if (!game || game.status !== 'question' || game.hostId !== playerId) return;

    const question = game.questions[game.currentRound];
    if (!question) return;

    for (const [pid, player] of Object.entries(game.players)) {
      if (!(player as any).isBot || player.currentAnswer !== null) continue;

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
          console.error('Bot answer failed:', err);
        }
      }, delay);
      botAnswerTimersRef.current.push(timer);
    }

    return () => {
      botAnswerTimersRef.current.forEach(t => clearTimeout(t));
      botAnswerTimersRef.current = [];
    };
  }, [game?.status, game?.currentRound, game?.id, playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Create a new game
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

  // Join an existing game by code
  const joinGame = useCallback(async (gameCode: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { game: joinedGame, error: joinError } = await gameService.joinGame(
        gameCode,
        playerId,
        playerName,
        playerAvatar,
        playerRole
      );

      if (joinError) {
        setError(joinError);
        return false;
      }

      setGame(joinedGame);
      return true;
    } catch (_err) {
      setError('Không thể tham gia game');
      return false;
    } finally {
      setLoading(false);
    }
  }, [playerId, playerName, playerAvatar, playerRole]);

  // Leave current game (set flag to suppress subscription errors)
  const leaveGame = useCallback(async (): Promise<void> => {
    if (!game) return;
    leavingRef.current = true;
    try {
      await gameService.leaveGame(game.id, playerId);
      setGame(null);
      setGameResults(null);
      setError(null);
    } catch (err) {
      console.error('Error leaving game:', err);
    } finally {
      leavingRef.current = false;
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
    } catch (_err) {
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

  // Update host message in lobby
  const updateHostMessage = useCallback(async (message: string): Promise<void> => {
    if (!game) return;
    try {
      await gameService.updateGame(game.id, { hostMessage: message });
    } catch (err) {
      console.error('Error updating host message:', err);
    }
  }, [game]);

  // Reset game state
  const resetGame = useCallback(() => {
    setGame(null);
    setGameResults(null);
    setError(null);
  }, []);

  // Fetch available rooms
  const fetchAvailableRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const rooms = await gameService.getAvailableRooms();
      setAvailableRooms(rooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Subscribe to available rooms (real-time)
  const subscribeToRooms = useCallback((callback?: (rooms: QuizGame[]) => void) => {
    setLoadingRooms(true);
    const unsubscribe = gameService.subscribeToAvailableRooms((rooms) => {
      setAvailableRooms(rooms);
      setLoadingRooms(false);
      callback?.(rooms);
    });
    return unsubscribe;
  }, []);

  // Join game by ID directly
  const joinGameById = useCallback(async (gameId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const targetGame = await gameService.getGame(gameId);
      if (!targetGame) {
        setError('Phòng không tồn tại');
        return false;
      }
      const { game: joinedGame, error: joinError } = await gameService.joinGame(
        targetGame.code,
        playerId,
        playerName,
        playerAvatar
      );

      if (joinError) {
        setError(joinError);
        return false;
      }

      setGame(joinedGame);
      return true;
    } catch (_err) {
      setError('Không thể tham gia game');
      return false;
    } finally {
      setLoading(false);
    }
  }, [playerId, playerName, playerAvatar, playerRole]);

  // Auto-add AI bot after random 15-60s when host is alone in lobby
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botScheduledForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!game || game.hostId !== playerId || game.status !== 'waiting' || !game.id) return;
    const pCount = Object.keys(game.players).length;

    // Opponent joined → cancel bot timer
    if (pCount >= 2) {
      if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
      botScheduledForRef.current = null;
      return;
    }

    // Already scheduled for this game
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
        // Write directly to Firestore — subscription picks it up
        await updateGameFields(gameId, { [`players.${botId}`]: botPlayer });
      } catch (err) {
        console.error('Bot auto-join failed:', err);
      }
    }, delay);

    return () => {
      if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    };
  }, [game?.id, game?.status, game?.hostId, playerId, Object.keys(game?.players ?? {}).length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup bot timer on unmount
  useEffect(() => () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); }, []);

  // Computed values
  const isHost = game?.hostId === playerId;
  const currentPlayer = game?.players[playerId] || null;
  const currentQuestion = game ? game.questions[game.currentRound] : null;
  const playerCount = game ? Object.keys(game.players).length : 0;
  // Active players only (exclude spectators) for scoring/rankings
  const sortedPlayers = game
    ? Object.values(game.players).filter(p => !p.isSpectator).sort((a, b) => b.score - a.score)
    : [];

  return {
    // State
    game,
    gameResults,
    availableRooms,
    loadingRooms,
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
    joinGameById,
    leaveGame,
    kickPlayer,
    startGame,
    submitAnswer,
    revealAnswer,
    nextRound,
    continueFromPowerUp,
    continueFromLeaderboard,
    usePowerUp,
    updateHostMessage,
    resetGame,
    fetchAvailableRooms,
    subscribeToRooms,
    setError,
  };
}
