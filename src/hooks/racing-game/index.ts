// Main racing game hook - composes smaller hooks
import { useCallback } from 'react';
import type { UseRacingGameProps } from './types';
import { useGameState } from './use-game-state';
import { useTimers } from './use-timers';
import { useBotLogic } from './use-bot-logic';
import { useGameCreation } from './use-game-creation';
import { usePlayerActions } from './use-player-actions';
import { useHostActions } from './use-host-actions';
import { useSpecialFeatures } from './use-special-features';
import { useTrapSystem } from './use-trap-system';
import { useInventory } from './use-inventory';
import { useTeamActions } from './use-team-actions';
import { useVehicleSelection } from './use-vehicle-selection';

export function useRacingGame({ currentUser, flashcards = [] }: UseRacingGameProps) {
  // Game state
  const {
    game,
    setGame,
    gameResults,
    setGameResults,
    availableRooms,
    setAvailableRooms,
    loading,
    setLoading,
    error,
    setError,
    selectedVehicle,
    setSelectedVehicle,
    selectedGameMode,
    setSelectedGameMode,
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    finishedPlayers,
  } = useGameState(currentUser.id);

  // Timers
  const {
    timerRef,
    questionTimerRef,
    botTimerRef,
    botTimer2Ref,
    botAnswerTimersRef,
  } = useTimers();

  // Bot logic
  useBotLogic({ game, setGame, botAnswerTimersRef });

  // Game creation
  const { createGame } = useGameCreation({
    currentUser,
    flashcards,
    selectedVehicle,
    setGame,
    setAvailableRooms,
    setLoading,
    setError,
    botTimerRef,
    botTimer2Ref,
  });

  // Player actions
  const { joinGame, leaveGame, submitAnswer } = usePlayerActions({
    currentUser,
    selectedVehicle,
    game,
    setGame,
    setGameResults,
    availableRooms,
    setAvailableRooms,
    setLoading,
    setError,
    isHost,
    currentPlayer,
    currentQuestion,
    botTimerRef,
    botTimer2Ref,
  });

  // Host actions
  const { kickPlayer, startGame, revealAnswer, nextQuestion } = useHostActions({
    game,
    setGame,
    setGameResults,
    setAvailableRooms,
    setError,
    currentUserId: currentUser.id,
    isHost,
    timerRef,
    botTimerRef,
    botTimer2Ref,
  });

  // Special features
  const { openMysteryBox, applySpecialFeature } = useSpecialFeatures({
    game,
    setGame,
    currentUserId: currentUser.id,
    currentQuestion,
  });

  // Trap system
  const {
    placeTrap,
    triggerTrap,
    handleEscapeTap,
    checkTrapCollision,
    spawnRandomTrap,
  } = useTrapSystem({
    game,
    setGame,
    currentUserId: currentUser.id,
  });

  // Inventory
  const { useInventoryItem, addToInventory } = useInventory({
    game,
    setGame,
    currentUserId: currentUser.id,
    applySpecialFeature,
  });

  // Team actions
  const { assignPlayerToTeam, updateTeamScores } = useTeamActions({
    game,
    setGame,
  });

  // Vehicle selection
  const { selectVehicle } = useVehicleSelection({
    game,
    setGame,
    setSelectedVehicle,
    currentUserId: currentUser.id,
  });

  // Reset game
  const resetGame = useCallback(() => {
    setGame(null);
    setGameResults(null);
    setError(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
  }, [setGame, setGameResults, setError, timerRef, questionTimerRef]);

  return {
    // State
    game,
    gameResults,
    availableRooms,
    loading,
    error,
    selectedVehicle,
    selectedGameMode,

    // Computed
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    finishedPlayers,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    submitAnswer,
    revealAnswer,
    nextQuestion,
    openMysteryBox,
    applySpecialFeature,
    selectVehicle,
    resetGame,
    setError,
    setSelectedGameMode,

    // Team actions
    assignPlayerToTeam,
    updateTeamScores,

    // Trap actions
    placeTrap,
    triggerTrap,
    checkTrapCollision,
    spawnRandomTrap,
    handleEscapeTap,

    // Inventory actions
    useInventoryItem,
    addToInventory,
  };
}

// Re-export types
export type { UseRacingGameProps } from './types';
