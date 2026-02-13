// Main word match hook - orchestrates all modules

import type { Flashcard } from '../../types/flashcard';
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
    isHost, currentPlayer,
    sortedPlayers,
    roundTimerRef,
    scheduleBotJoin,
    clearBotTimers,
  } = useGameState({ currentUserId: currentUser.id });

  const { startNextRound, endRound, submitMatches } = useRoundLogic({
    game, setGame, roundTimerRef, currentUser,
  });

  const { createGame } = useGameCreation({
    currentUser, flashcards, setGame, setGameResults, setLoading, setError, scheduleBotJoin,
  });

  const {
    joinGame, leaveGame, kickPlayer, startGame, addBot, resetGame,
  } = useGameActions({
    currentUser, game, setGame, setGameResults, setLoading, setError,
    isHost, clearBotTimers, roundTimerRef, startNextRound,
  });

  useEffects({ game, endRound });

  const { continueGame, applyEffect } = useGameFlow({
    game, isHost, sortedPlayers, setGame, setGameResults, startNextRound,
  });

  return {
    game,
    gameResults,
    loading,
    error,
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
