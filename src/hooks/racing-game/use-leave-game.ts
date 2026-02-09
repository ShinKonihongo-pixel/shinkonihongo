// Leave game logic
import { useCallback } from 'react';
import type { RacingGame } from '../../types/racing-game';

interface UseLeaveGameProps {
  game: RacingGame | null;
  setGame: React.Dispatch<React.SetStateAction<RacingGame | null>>;
  setGameResults: React.Dispatch<React.SetStateAction<any>>;
  setAvailableRooms: React.Dispatch<React.SetStateAction<RacingGame[]>>;
  currentUserId: string;
  isHost: boolean;
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  botTimer2Ref: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function useLeaveGame({
  game,
  setGame,
  setGameResults,
  setAvailableRooms,
  currentUserId,
  isHost,
  botTimerRef,
  botTimer2Ref,
}: UseLeaveGameProps) {
  const leaveGame = useCallback(() => {
    if (!game) return;

    // Clear bot timers
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
    if (botTimer2Ref.current) {
      clearTimeout(botTimer2Ref.current);
      botTimer2Ref.current = null;
    }

    const { [currentUserId]: _removed, ...remainingPlayers } = game.players;

    if (Object.keys(remainingPlayers).length === 0) {
      // Remove game if empty
      setAvailableRooms(prev => prev.filter(g => g.id !== game.id));
    } else {
      // Update game
      const updatedGame = {
        ...game,
        players: remainingPlayers,
        hostId: isHost ? Object.keys(remainingPlayers)[0] : game.hostId,
      };
      setAvailableRooms(prev => prev.map(g => g.id === game.id ? updatedGame : g));
    }

    setGame(null);
    setGameResults(null);
  }, [game, currentUserId, isHost, setGame, setGameResults, setAvailableRooms, botTimerRef, botTimer2Ref]);

  return { leaveGame };
}
