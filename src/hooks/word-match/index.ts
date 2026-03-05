// Main word match hook - orchestrates all modules
// Combines all sub-hooks and exports unified interface with Firestore sync

import type { Flashcard } from '../../types/flashcard';
import type { WordMatchPlayer } from '../../types/word-match';
import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';
import { useRoundLogic } from './use-round-logic';
import { useEffects } from './use-effects';
import { useGameFlow } from './use-game-flow';

interface UseWordMatchProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards?: Flashcard[];
}

export function useWordMatch({ currentUser, flashcards = [] }: UseWordMatchProps) {
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

  const { startNextRound, endRound, submitMatches } = useRoundLogic({
    game, setGame, roundTimerRef, currentUser,
  });

  const { createGame } = useGameCreation({
    currentUser, flashcards, setGame, setGameResults, setLoading, setError, setRoomId, scheduleBotJoin,
  });

  const {
    joinGame, leaveGame, kickPlayer, startGame, addBot, resetGame,
  } = useGameActions({
    currentUser, game, setGame, setGameResults, setLoading, setError, setRoomId,
    isHost, clearBotTimers, roundTimerRef, startNextRound, deleteCurrentRoom,
  });

  useEffects({ game, endRound });

  const { continueGame, applyEffect } = useGameFlow({
    game, isHost, sortedPlayers: sortedPlayers as WordMatchPlayer[], setGame, setGameResults, startNextRound,
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
    submitMatches,
    applyEffect,
    continueGame,
    resetGame,
    setError,
  };
}
