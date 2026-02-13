// Golden Bell Game Hook - Main orchestrator
// Combines all sub-hooks and exports unified interface

import type { Flashcard } from '../../types/flashcard';
import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';
import { useGameplay } from './use-gameplay';

interface UseGoldenBellProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  flashcards?: Flashcard[];
}

export function useGoldenBell({ currentUser, flashcards = [] }: UseGoldenBellProps) {
  // State management
  const {
    game, setGame,
    gameResults, setGameResults,
    availableRooms,
    loading, setLoading,
    error, setError,
    isHost, currentPlayer, currentQuestion,
    sortedPlayers, aliveCount,
    scheduleBotJoin, clearBotTimers,
  } = useGameState({ currentUserId: currentUser.id });

  // Game creation
  const { createGame } = useGameCreation({
    currentUser,
    setGame,
    setGameResults,
    setLoading,
    setError,
    flashcards,
    scheduleBotJoin,
  });

  // Game actions
  const {
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    resetGame,
  } = useGameActions({
    currentUser,
    game,
    setGame,
    setGameResults,
    setLoading,
    setError,
    availableRooms,
    isHost,
    clearBotTimers,
  });

  // Gameplay
  const {
    submitAnswer,
    revealAnswer,
    nextQuestion,
  } = useGameplay({
    game,
    currentPlayer,
    currentQuestion,
    currentUser,
    setGame,
    setGameResults,
    isHost,
  });

  return {
    // State
    game,
    gameResults,
    availableRooms,
    loading,
    error,

    // Computed
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    aliveCount,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    submitAnswer,
    revealAnswer,
    nextQuestion,
    resetGame,
    setError,
  };
}
