// Golden Bell Game Hook - Main orchestrator
// Combines all sub-hooks and exports unified interface

import type { Flashcard } from '../../types/flashcard';
import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';
import { useGameplay } from './use-gameplay';
import { useSkills } from './use-skills';
import { useTeamActions } from './use-team-actions';

interface UseGoldenBellProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
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
    deleteCurrentRoom, clearLocalGameState,
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
    roomId,
    setRoomId,
    isHost,
    clearBotTimers,
    deleteCurrentRoom,
    clearLocalGameState,
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

  // Skill system
  const {
    getEnabledSkills,
    triggerSkillPhase,
    assignRandomSkill,
    useSkill,
    completeSkillPhase,
    shouldTriggerSkillPhase,
    setCurrentSpinner,
  } = useSkills({
    game,
    currentUser,
    setGame,
    isHost,
  });

  // Team actions
  const {
    joinTeam,
    leaveTeam,
    shuffleTeams,
    updateTeamStats,
    autoAssignToTeam,
  } = useTeamActions({
    game,
    setGame,
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

    // Skills
    getEnabledSkills,
    triggerSkillPhase,
    assignRandomSkill,
    useSkill,
    completeSkillPhase,
    shouldTriggerSkillPhase,
    setCurrentSpinner,

    // Teams
    joinTeam,
    leaveTeam,
    shuffleTeams,
    updateTeamStats,
    autoAssignToTeam,
  };
}
