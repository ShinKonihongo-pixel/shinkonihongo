// Main word-scramble multiplayer hook - orchestrates all modules

import type { Flashcard } from '../../types/flashcard';
import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';

interface UseWordScrambleMultiplayerProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards: Flashcard[];
}

export function useWordScrambleMultiplayer({ currentUser, flashcards }: UseWordScrambleMultiplayerProps) {
  const {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    roundTimerRef,
    scheduleBotJoin, clearBotTimers,
    deleteCurrentRoom,
  } = useGameState({ currentUserId: currentUser.id });

  const { createGame } = useGameCreation({
    currentUser, flashcards, setGame, setGameResults, setLoading, setError, setRoomId, scheduleBotJoin,
  });

  const {
    joinGame, leaveGame, kickPlayer, startGame, addBot, resetGame,
  } = useGameActions({
    currentUser, game, setGame, setGameResults, setLoading, setError, setRoomId,
    isHost, clearBotTimers, roundTimerRef, deleteCurrentRoom,
  });

  return {
    game,
    gameResults,
    loading,
    error,
    roomId,
    isHost,
    currentPlayer,
    sortedPlayers,
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    addBot,
    resetGame,
    setError,
  };
}
