// Image-Word game actions — thin wrapper around shared useGameRoomActions

import { useCallback } from 'react';
import type { ImageWordMultiplayerGame, ImageWordMultiplayerPlayer, ImageWordMultiplayerResults } from '../../types/image-word';
import type { GameUser, SetGame } from '../shared/game-types';
import { useGameRoomActions } from '../shared/use-game-room-actions';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';

interface UseGameActionsProps {
  game: ImageWordMultiplayerGame | null;
  currentUser: GameUser;
  setGame: SetGame<ImageWordMultiplayerGame>;
  setGameResults: (results: ImageWordMultiplayerResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
  roundTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  deleteCurrentRoom: () => void;
}

export function useGameActions({
  game, currentUser, setGame, setGameResults,
  setLoading, setError, setRoomId,
  isHost, clearBotTimers, roundTimerRef, deleteCurrentRoom,
}: UseGameActionsProps) {
  const clearTimersFn = useCallback(() => {
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
  }, [roundTimerRef]);

  const { joinGame, leaveGame, kickPlayer, startGame, resetGame } = useGameRoomActions<
    ImageWordMultiplayerGame,
    ImageWordMultiplayerPlayer,
    ImageWordMultiplayerResults
  >(
    {
      game, currentUser, setGame, setGameResults,
      setLoading, setError, setRoomId,
      isHost, clearBotTimers, deleteCurrentRoom,
    },
    {
      gameType: 'image-word',
      gameName: 'Nối Hình - Từ',
      createJoinPlayer: (user) => ({
        odinhId: user.id,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        score: 0,
        matchedPairs: [],
        wrongAttempts: 0,
        isComplete: false,
      }),
      clearTimersFn,
    },
  );

  // Add bot manually
  const addBot = useCallback(() => {
    setGame(prev => {
      if (!prev || prev.status !== 'waiting') return prev;
      const currentCount = Object.keys(prev.players).length;
      if (currentCount >= prev.settings.maxPlayers) return prev;

      const bots = generateBots(1);
      const bot = bots[0];
      const botId = `bot-${generateId()}`;
      const newPlayers = { ...prev.players };
      newPlayers[botId] = {
        odinhId: botId,
        displayName: bot.name,
        avatar: bot.avatar,
        score: 0,
        matchedPairs: [],
        wrongAttempts: 0,
        isComplete: false,
        isBot: true,
      };
      return { ...prev, players: newPlayers };
    });
  }, [setGame]);

  return { joinGame, leaveGame, kickPlayer, startGame, addBot, resetGame };
}
