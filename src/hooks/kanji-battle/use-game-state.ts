// Game state management hook

import { useState, useMemo, useRef, useEffect } from 'react';
import type { KanjiBattleGame, KanjiBattleResults } from '../../types/kanji-battle';

interface UseGameStateProps {
  currentUserId: string;
}

export function useGameState({ currentUserId }: UseGameStateProps) {
  const [game, setGame] = useState<KanjiBattleGame | null>(null);
  const [gameResults, setGameResults] = useState<KanjiBattleResults | null>(null);
  const [availableRooms] = useState<KanjiBattleGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isHost = useMemo(() => game?.hostId === currentUserId, [game, currentUserId]);
  const currentPlayer = useMemo(() => game?.players[currentUserId], [game, currentUserId]);

  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => b.score - a.score);
  }, [game]);

  const isSkillPhase = useMemo(() => {
    if (!game || !game.settings.skillsEnabled) return false;
    return game.currentRound > 0 && game.currentRound % game.settings.skillInterval === 0;
  }, [game]);

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

  const clearTimers = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    if (botAnswerTimerRef.current) clearTimeout(botAnswerTimerRef.current);
  };

  return {
    game, setGame,
    gameResults, setGameResults,
    availableRooms,
    loading, setLoading,
    error, setError,
    isHost, currentPlayer,
    sortedPlayers, isSkillPhase,
    botTimerRef, roundTimerRef, botAnswerTimerRef,
    clearTimers,
  };
}
