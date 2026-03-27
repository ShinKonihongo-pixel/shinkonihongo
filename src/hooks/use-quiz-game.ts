// Hook for managing Quiz Game state and actions

import { useState, useEffect, useRef } from 'react';
import type { GameResults } from '../types/quiz-game';
import * as gameService from '../services/quiz-game-firestore';
import { useQuizGameLifecycle } from './use-quiz-game-lifecycle';
import { useQuizGamePlay } from './use-quiz-game-play';
import { useQuizGameBots } from './use-quiz-game-bots';
import { useQuizGameRooms } from './use-quiz-game-rooms';

interface UseQuizGameOptions {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  playerRole?: string;
}

export function useQuizGame({ playerId, playerName, playerAvatar, playerRole }: UseQuizGameOptions) {
  const lifecycle = useQuizGameLifecycle({ playerId, playerName, playerAvatar, playerRole });
  const { game, setGame, setError, leavingRef } = lifecycle;

  const [gameResults, setGameResults] = useState<GameResults | null>(null);

  const rooms = useQuizGameRooms();
  const play = useQuizGamePlay({ game, playerId });
  useQuizGameBots({ game, playerId });

  // Subscribe to game updates when game is set
  const gameIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!game?.id) return;

    const unsubscribe = gameService.subscribeToGame(game.id, (updatedGame) => {
      if (!updatedGame) {
        setGame(null);
        if (!leavingRef.current) setError('Game đã bị xóa');
        return;
      }

      if (!updatedGame.players[playerId] && updatedGame.status === 'waiting') {
        setGame(null);
        if (!leavingRef.current) setError('Bạn đã bị kick khỏi phòng');
        return;
      }

      setGame(updatedGame);

      if (updatedGame.status === 'finished' && !gameResults) {
        gameService.getGameResults(updatedGame.id).then(setGameResults);
      }
    });

    return () => unsubscribe();
  }, [game?.id, gameResults]); // eslint-disable-line react-hooks/exhaustive-deps

  gameIdRef.current = game?.id;

  const leaveGameWrapped = async () => {
    await lifecycle.leaveGame();
    setGameResults(null);
  };

  const resetGameWrapped = () => {
    lifecycle.resetGame();
    setGameResults(null);
  };

  // Computed values
  const isHost = game?.hostId === playerId;
  const currentPlayer = game?.players[playerId] || null;
  const currentQuestion = game ? game.questions[game.currentRound] : null;
  const playerCount = game ? Object.keys(game.players).length : 0;
  const sortedPlayers = game
    ? Object.values(game.players).filter(p => !p.isSpectator).sort((a, b) => b.score - a.score)
    : [];

  return {
    // State
    game,
    gameResults,
    availableRooms: rooms.availableRooms,
    loadingRooms: rooms.loadingRooms,
    loading: lifecycle.loading,
    error: lifecycle.error,

    // Computed
    isHost,
    currentPlayer,
    currentQuestion,
    playerCount,
    sortedPlayers,

    // Actions
    createGame: lifecycle.createGame,
    joinGame: lifecycle.joinGame,
    joinGameById: lifecycle.joinGameById,
    leaveGame: leaveGameWrapped,
    kickPlayer: lifecycle.kickPlayer,
    startGame: lifecycle.startGame,
    submitAnswer: play.submitAnswer,
    revealAnswer: play.revealAnswer,
    nextRound: play.nextRound,
    continueFromPowerUp: play.continueFromPowerUp,
    continueFromLeaderboard: play.continueFromLeaderboard,
    usePowerUp: play.usePowerUp,
    updateHostMessage: play.updateHostMessage,
    resetGame: resetGameWrapped,
    fetchAvailableRooms: rooms.fetchAvailableRooms,
    subscribeToRooms: rooms.subscribeToRooms,
    setError: lifecycle.setError,
  };
}
