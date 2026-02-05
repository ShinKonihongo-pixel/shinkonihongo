// Start game logic
import { useCallback } from 'react';
import type { RacingGame } from '../../types/racing-game';

interface UseStartGameProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  setError: (error: string | null) => void;
  isHost: boolean;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  botTimer2Ref: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function useStartGame({
  game,
  setGame,
  setError,
  isHost,
  timerRef,
  botTimerRef,
  botTimer2Ref,
}: UseStartGameProps) {
  const startGame = useCallback(() => {
    if (!game || !isHost) return;

    if (Object.keys(game.players).length < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người chơi`);
      return;
    }

    // Clear bot timers
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
    if (botTimer2Ref.current) {
      clearTimeout(botTimer2Ref.current);
      botTimer2Ref.current = null;
    }

    setGame(prev => prev ? {
      ...prev,
      status: 'starting',
      startedAt: new Date().toISOString(),
    } : null);

    timerRef.current = setTimeout(() => {
      setGame(prev => prev ? {
        ...prev,
        status: 'question',
        questionStartTime: Date.now(),
      } : null);

      timerRef.current = setTimeout(() => {
        setGame(prev => prev ? { ...prev, status: 'answering' } : null);
      }, 2000);
    }, 3000);
  }, [game, isHost, setGame, setError, timerRef, botTimerRef, botTimer2Ref]);

  return { startGame };
}
