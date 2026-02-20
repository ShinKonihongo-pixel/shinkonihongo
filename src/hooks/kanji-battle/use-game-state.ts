// Kanji Battle game state — thin wrapper around shared useGameRoomState
// Has 3 timer refs, isSkillPhase computed, no useBotAutoJoin

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { KanjiBattleGame, KanjiBattleResults } from '../../types/kanji-battle';
import { useGameRoomState } from '../shared/use-game-room-state';

export function useGameState({ currentUserId }: { currentUserId: string }) {
  const {
    game, setGame,
    gameResults, setGameResults,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers,
    deleteCurrentRoom,
  } = useGameRoomState<KanjiBattleGame, KanjiBattleResults>(
    currentUserId,
    { gameLabel: 'kanji-battle' },
  );

  // Legacy state (unused but kept for API compat)
  const [availableRooms] = useState<KanjiBattleGame[]>([]);

  // Game-specific timer refs (3 timers)
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Game-specific computed
  const isSkillPhase = useMemo(() => {
    if (!game || !game.settings.skillsEnabled) return false;
    return game.currentRound > 0 && game.currentRound % game.settings.skillInterval === 0;
  }, [game]);

  const clearTimers = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    const botTimer = botTimerRef.current;
    const roundTimer = roundTimerRef.current;
    const botAnswerTimer = botAnswerTimerRef.current;
    return () => {
      if (botTimer) clearTimeout(botTimer);
      if (roundTimer) clearTimeout(roundTimer);
      if (botAnswerTimer) clearTimeout(botAnswerTimer);
    };
  }, []);

  return {
    game, setGame,
    gameResults, setGameResults,
    availableRooms,
    loading, setLoading,
    error, setError,
    roomId, setRoomId,
    isHost, currentPlayer,
    sortedPlayers, isSkillPhase,
    botTimerRef, roundTimerRef, botAnswerTimerRef,
    clearTimers,
    deleteCurrentRoom,
  };
}
