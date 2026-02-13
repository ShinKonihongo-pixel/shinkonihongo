// Main picture guess hook - orchestrates all modules
// Combines all sub-hooks and exports unified interface

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
  // State management (with Firestore sync)
  const {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer, currentPuzzle,
    sortedPlayers,
    scheduleBotJoin, clearBotTimers,
  } = useGameState({ currentUserId: currentUser.id });

  // Game creation (writes to Firestore)
  const { createGame } = useGameCreation({
    currentUser,
    flashcards,
    setGame,
    setGameResults,
    setLoading,
    setError,
    setRoomId,
    scheduleBotJoin,
  });

  // Game actions (join via Firestore, leave, start)
  const {
    joinGame, leaveGame, startGame, resetGame,
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
    loading,
    error,
    roomId,

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
