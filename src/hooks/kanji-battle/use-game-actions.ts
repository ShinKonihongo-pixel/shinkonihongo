// Kanji Battle game actions — thin wrapper around shared useGameRoomActions

import { useCallback } from 'react';
import type { KanjiBattleGame, KanjiBattlePlayer, KanjiBattleResults } from '../../types/kanji-battle';
import type { GameUser, SetGame } from '../shared/game-types';
import { useGameRoomActions } from '../shared/use-game-room-actions';

interface UseGameActionsProps {
  currentUser: GameUser;
  game: KanjiBattleGame | null;
  setGame: SetGame<KanjiBattleGame>;
  setGameResults: (results: KanjiBattleResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  botTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  clearTimers: () => void;
  startNextRound: () => void;
  deleteCurrentRoom: () => void;
}

export function useGameActions({
  currentUser, game, setGame, setGameResults,
  setLoading, setError, setRoomId,
  isHost, botTimerRef, clearTimers, startNextRound, deleteCurrentRoom,
}: UseGameActionsProps) {
  const clearBotTimers = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
  }, [botTimerRef]);

  const { joinGame, leaveGame, kickPlayer, startGame, resetGame } = useGameRoomActions<
    KanjiBattleGame,
    KanjiBattlePlayer,
    KanjiBattleResults
  >(
    {
      game, currentUser, setGame, setGameResults,
      setLoading, setError, setRoomId,
      isHost, clearBotTimers, deleteCurrentRoom,
    },
    {
      gameType: 'kanji-battle',
      gameName: 'Kanji Battle',
      createJoinPlayer: (user, roomData) => ({
        odinhId: user.id,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        hintsUsed: 0,
        hintsRemaining: roomData.settings?.hintsPerPlayer || 3,
        hasAnswered: false,
        hasShield: false,
        shieldTurns: 0,
        hasDoublePoints: false,
        doublePointsTurns: 0,
        isSlowed: false,
        slowedTurns: 0,
        streak: 0,
      }),
      onAfterStart: startNextRound,
      clearTimersFn: clearTimers,
    },
  );

  return { joinGame, leaveGame, kickPlayer, startGame, resetGame };
}
