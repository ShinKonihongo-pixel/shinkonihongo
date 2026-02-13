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
  // State management (with Firestore sync)
  const {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer, currentQuestion,
    sortedPlayers, aliveCount,
    scheduleBotJoin, clearBotTimers,
  } = useGameState({ currentUserId: currentUser.id });

  // Game creation (writes to Firestore)
  const { createGame } = useGameCreation({
    currentUser,
    setGame,
    setGameResults,
    setLoading,
    setError,
    setRoomId,
    flashcards,
    scheduleBotJoin,
  });

  // Game actions (join via Firestore, leave, kick, start)
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
    setRoomId,
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
    loading,
    error,
    roomId,

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
