// Main Quiz Battle multiplayer hook — orchestrates all modules

import type { GameUser } from '../shared/game-types';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { CreateQuizBattleRoomData } from '../../components/pages/quiz-battle/quiz-battle-types';
import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';
import { useMatchFlow } from './use-match-flow';
import { useRatingSync } from './use-rating-sync';

interface UseQuizBattleProps {
  currentUser: GameUser;
  jlptQuestions: JLPTQuestion[];
}

export function useQuizBattle({ currentUser, jlptQuestions }: UseQuizBattleProps) {
  const {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    deleteCurrentRoom,
    clearLocalGameState,
  } = useGameState({ currentUserId: currentUser.id });

  const { createGame: createGameInner } = useGameCreation({
    currentUser, setGame, setGameResults, setLoading, setError, setRoomId,
  });

  // Bind jlptQuestions into createGame
  const createGame = (data: CreateQuizBattleRoomData) =>
    createGameInner(data, jlptQuestions);

  const {
    joinGame, leaveGame, kickPlayer, startGame, resetGame, submitAnswer,
  } = useGameActions({
    game, currentUser, setGame, setGameResults,
    setLoading, setError, setRoomId, roomId,
    isHost, deleteCurrentRoom, clearLocalGameState,
  });

  // Host drives the match flow
  useMatchFlow({
    game, isHost, currentUserId: currentUser.id, setGame, setGameResults,
  });

  const { myRating, getRatingForLevel } = useRatingSync({ currentUser });

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
    resetGame,
    submitAnswer,
    myRating,
    getRatingForLevel,
    setError,
  };
}

export type { CreateQuizBattleRoomData };
