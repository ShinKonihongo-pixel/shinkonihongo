// Main image-word hook - orchestrates all modules
// Combines all sub-hooks and exports unified interface with Firestore sync

import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';

interface UseImageWordMultiplayerProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
}

export function useImageWordMultiplayer({ currentUser }: UseImageWordMultiplayerProps) {
  const {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    roundTimerRef,
    scheduleBotJoin,
    clearBotTimers,
    deleteCurrentRoom,
  } = useGameState({ currentUserId: currentUser.id });

  const { createGame } = useGameCreation({
    currentUser, setGame, setGameResults, setLoading, setError, setRoomId, scheduleBotJoin,
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
