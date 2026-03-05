// Main kanji-drop multiplayer hook — orchestrates all modules

import type { CreateKanjiDropRoomData } from '../../components/pages/kanji-drop/kanji-drop-multiplayer-types';
import { useGameState } from './use-game-state';
import { useGameCreation } from './use-game-creation';
import { useGameActions } from './use-game-actions';
import { useProgressSync } from './use-progress-sync';
import { useBotSimulation } from './use-bot-simulation';

interface UseKanjiDropMultiplayerProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
}

export function useKanjiDropMultiplayer({ currentUser }: UseKanjiDropMultiplayerProps) {
  const {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    scheduleBotJoin, clearBotTimers,
    deleteCurrentRoom,
  } = useGameState({ currentUserId: currentUser.id });

  const { createGame } = useGameCreation({
    currentUser, setGame, setGameResults, setLoading, setError, setRoomId, scheduleBotJoin,
  });

  const {
    joinGame, leaveGame, kickPlayer, startGame, addBot, resetGame,
  } = useGameActions({
    currentUser, game, setGame, setGameResults, setLoading, setError, setRoomId,
    isHost, clearBotTimers, deleteCurrentRoom,
  });

  const { syncProgress } = useProgressSync({ currentUserId: currentUser.id, setGame });

  // Simulate bot gameplay — bots progress through levels at random speed/intelligence
  useBotSimulation({ game, setGame });

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
    syncProgress,
    setError,
  };
}

export type { CreateKanjiDropRoomData };
