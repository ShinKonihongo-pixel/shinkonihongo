// Kanji Drop game actions — thin wrapper around shared useGameRoomActions

import { useCallback } from 'react';
import type { KanjiDropMultiplayerGame, KanjiDropMultiplayerPlayer, KanjiDropMultiplayerResults } from '../../components/pages/kanji-drop/kanji-drop-multiplayer-types';
import type { GameUser, SetGame } from '../shared/game-types';
import { useGameRoomActions } from '../shared/use-game-room-actions';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';

interface UseGameActionsProps {
  game: KanjiDropMultiplayerGame | null;
  currentUser: GameUser;
  setGame: SetGame<KanjiDropMultiplayerGame>;
  setGameResults: (results: KanjiDropMultiplayerResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
  deleteCurrentRoom: () => void;
}

export function useGameActions({
  game, currentUser, setGame, setGameResults,
  setLoading, setError, setRoomId,
  isHost, clearBotTimers, deleteCurrentRoom,
}: UseGameActionsProps) {
  const { joinGame, leaveGame, kickPlayer, startGame, resetGame } = useGameRoomActions<
    KanjiDropMultiplayerGame,
    KanjiDropMultiplayerPlayer,
    KanjiDropMultiplayerResults
  >(
    {
      game, currentUser, setGame, setGameResults,
      setLoading, setError, setRoomId,
      isHost, clearBotTimers, deleteCurrentRoom,
    },
    {
      gameType: 'kanji-drop',
      gameName: 'Kanji Drop',
      createJoinPlayer: (user, roomData) => ({
        odinhId: user.id,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        score: 0,
        currentLevel: roomData.settings.levelStart,
        clearedCount: 0,
        levelsCompleted: 0,
      }),
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
        currentLevel: prev.settings.levelStart,
        clearedCount: 0,
        levelsCompleted: 0,
        isBot: true,
        botIntelligence: bot.intelligence,
      };
      return { ...prev, players: newPlayers };
    });
  }, [setGame]);

  return { joinGame, leaveGame, kickPlayer, startGame, addBot, resetGame };
}
