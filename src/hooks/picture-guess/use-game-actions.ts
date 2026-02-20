// Picture Guess game actions — thin wrapper around shared useGameRoomActions
// Has custom startGame logic (showing → guessing transitions)

import { useCallback } from 'react';
import type { PictureGuessGame, PictureGuessPlayer, PictureGuessResults } from '../../types/picture-guess';
import type { GameUser, SetGame } from '../shared/game-types';
import { useGameRoomActions } from '../shared/use-game-room-actions';

interface UseGameActionsProps {
  currentUser: GameUser;
  game: PictureGuessGame | null;
  setGame: SetGame<PictureGuessGame>;
  setGameResults: (results: PictureGuessResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
  deleteCurrentRoom: () => void;
}

export function useGameActions({
  currentUser, game, setGame, setGameResults,
  setLoading, setError, setRoomId,
  isHost, clearBotTimers, deleteCurrentRoom,
}: UseGameActionsProps) {
  // Custom start logic: showing → guessing transitions
  const onAfterStart = useCallback(() => {
    setGame(prev => {
      if (!prev) return null;
      return { ...prev, status: 'showing', currentPuzzleIndex: 0 };
    });

    // Auto-transition to guessing after showing image
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return { ...prev, status: 'guessing', puzzleStartTime: Date.now() };
      });
    }, 2000);
  }, [setGame]);

  const { joinGame, leaveGame, startGame, resetGame } = useGameRoomActions<
    PictureGuessGame,
    PictureGuessPlayer,
    PictureGuessResults
  >(
    {
      game, currentUser, setGame, setGameResults,
      setLoading, setError, setRoomId,
      isHost, clearBotTimers, deleteCurrentRoom,
    },
    {
      gameType: 'picture-guess',
      gameName: 'Picture Guess',
      createJoinPlayer: (user) => ({
        odinhId: user.id,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        score: 0,
        correctGuesses: 0,
        totalGuesses: 0,
        streak: 0,
        hintsUsed: 0,
        status: 'playing' as const,
      }),
      onAfterStart,
    },
  );

  return { joinGame, leaveGame, startGame, resetGame };
}
