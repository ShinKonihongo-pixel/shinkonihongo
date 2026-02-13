// Main picture guess hook - orchestrates all modules

import type { Flashcard } from '../../types/flashcard';
import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';
import { useGameplay } from './use-gameplay';

interface UsePictureGuessProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  flashcards?: Flashcard[];
}

export function usePictureGuess({ currentUser, flashcards = [] }: UsePictureGuessProps) {
  const {
    game, setGame,
    gameResults, setGameResults,
    availableRooms,
    loading, setLoading,
    error, setError,
    isHost, currentPlayer, currentPuzzle,
    sortedPlayers,
    scheduleBotJoin, clearBotTimers,
  } = useGameState({ currentUserId: currentUser.id });

  const { createGame } = useGameCreation({
    currentUser,
    flashcards,
    setGame,
    setGameResults,
    setLoading,
    setError,
    scheduleBotJoin,
  });

  const {
    joinGame, leaveGame, startGame, resetGame,
  } = useGameActions({
    currentUser,
    game,
    availableRooms,
    setGame,
    setGameResults,
    setLoading,
    setError,
    isHost,
    clearBotTimers,
  });

  const {
    useHint, getHintContent, submitGuess, revealAnswer, nextPuzzle,
  } = useGameplay({
    currentUser,
    game,
    currentPuzzle,
    currentPlayer,
    setGame,
    setGameResults,
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
    currentPuzzle,
    sortedPlayers,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    startGame,
    useHint,
    getHintContent,
    submitGuess,
    revealAnswer,
    nextPuzzle,
    resetGame,
    setError,
  };
}
