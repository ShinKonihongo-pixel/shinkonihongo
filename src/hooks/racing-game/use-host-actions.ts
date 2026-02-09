// Host actions hook - wrapper combining start, kick, reveal, next question
import { useCallback } from 'react';
import type { RacingGame, RacingGameResults } from '../../types/racing-game';
import { useStartGame } from './use-start-game';
import { useNextQuestion } from './use-next-question';

interface UseHostActionsProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  setGameResults: React.Dispatch<React.SetStateAction<RacingGameResults | null>>;
  setAvailableRooms: React.Dispatch<React.SetStateAction<RacingGame[]>>;
  setError: (error: string | null) => void;
  currentUserId: string;
  isHost: boolean;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  botTimer2Ref: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function useHostActions({
  game,
  setGame,
  setGameResults,
  setAvailableRooms,
  setError,
  currentUserId,
  isHost,
  timerRef,
  botTimerRef,
  botTimer2Ref,
}: UseHostActionsProps) {
  const kickPlayer = useCallback((playerId: string) => {
    if (!game || !isHost || playerId === currentUserId) return;

    const { [playerId]: _removed, ...remainingPlayers } = game.players;
    const updatedGame = { ...game, players: remainingPlayers };

    setGame(updatedGame);
    setAvailableRooms(prev => prev.map(g => g.id === game.id ? updatedGame : g));
  }, [game, currentUserId, isHost, setGame, setAvailableRooms]);

  const revealAnswer = useCallback(() => {
    if (!game || !isHost) return;
    setGame(prev => prev ? { ...prev, status: 'revealing' } : null);
  }, [game, isHost, setGame]);

  const { startGame } = useStartGame({
    game,
    setGame,
    setError,
    isHost,
    timerRef,
    botTimerRef,
    botTimer2Ref,
  });

  const { nextQuestion } = useNextQuestion({
    game,
    setGame,
    setGameResults,
    isHost,
    timerRef,
  });

  return { kickPlayer, startGame, revealAnswer, nextQuestion };
}
