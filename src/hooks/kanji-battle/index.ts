// Main kanji battle hook - orchestrates all modules

import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';
import { useRoundLogic } from './use-round-logic';
import { usePlayerActions } from './use-player-actions';
import { useBotLogic } from './use-bot-logic';
import { useGameFlow } from './use-game-flow';

interface UseKanjiBattleProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
}

export function useKanjiBattle({ currentUser }: UseKanjiBattleProps) {
  const {
    game, setGame,
    gameResults, setGameResults,
    availableRooms,
    loading, setLoading,
    error, setError,
    isHost, currentPlayer,
    sortedPlayers, isSkillPhase,
    botTimerRef, roundTimerRef,
    clearTimers,
  } = useGameState({ currentUserId: currentUser.id });

  const { scheduleBotAnswers } = useBotLogic({ game, setGame });

  const { startNextRound, endRound } = useRoundLogic({
    game, setGame, roundTimerRef, scheduleBotAnswers,
  });

  const { createGame } = useGameCreation({
    currentUser, setGame, setGameResults, setLoading, setError, botTimerRef,
  });

  const {
    joinGame, leaveGame, kickPlayer, startGame, resetGame,
  } = useGameActions({
    currentUser, game, setGame, setGameResults, setLoading, setError,
    isHost, botTimerRef, clearTimers, startNextRound,
  });

  const {
    submitAnswer, submitDrawing, useHint, useSkill, skipSkill,
  } = usePlayerActions({
    game, currentPlayer, currentUserId: currentUser.id, setGame,
  });

  const { continueGame } = useGameFlow({
    game, isHost, sortedPlayers, setGameResults, startNextRound, endRound,
  });

  return {
    game, gameResults, availableRooms, loading, error,
    isHost, currentPlayer, sortedPlayers, isSkillPhase,
    createGame, joinGame, leaveGame, kickPlayer, startGame,
    submitAnswer, submitDrawing, useHint, continueGame,
    useSkill, skipSkill, resetGame, setError,
  };
}
