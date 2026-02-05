// Game state management hook
import { useState, useMemo } from 'react';
import type {
  RacingGame,
  RacingGameResults,
  RacingVehicle,
  GameMode,
} from '../../types/racing-game';
import { DEFAULT_VEHICLES } from '../../types/racing-game';

export function useGameState(currentUserId: string) {
  const [game, setGame] = useState<RacingGame | null>(null);
  const [gameResults, setGameResults] = useState<RacingGameResults | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RacingGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<RacingVehicle>(DEFAULT_VEHICLES[0]);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('individual');

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUserId, [game?.hostId, currentUserId]);
  const currentPlayer = useMemo(() => game?.players[currentUserId], [game?.players, currentUserId]);

  const questions = game?.questions;
  const currentQuestionIndex = game?.currentQuestionIndex ?? 0;
  const currentQuestion = useMemo(() =>
    questions ? questions[currentQuestionIndex] : null,
    [questions, currentQuestionIndex]
  );

  const players = game?.players;
  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return Object.values(players).sort((a, b) => b.distance - a.distance);
  }, [players]);

  const finishedPlayers = useMemo(() =>
    sortedPlayers.filter(p => p.isFinished),
    [sortedPlayers]
  );

  return {
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
  };
}
