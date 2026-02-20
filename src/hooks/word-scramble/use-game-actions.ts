// Word Scramble game actions - join, leave, kick, start, add bot, reset

import { useCallback } from 'react';
import type { WordScrambleMultiplayerGame, WordScrambleMultiplayerPlayer, WordScrambleMultiplayerResults } from '../../components/pages/word-scramble/word-scramble-types';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';
import { findRoomByCode, updateGameRoom } from '../../services/game-rooms';

interface UseGameActionsProps {
  game: WordScrambleMultiplayerGame | null;
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  setGame: (game: WordScrambleMultiplayerGame | null | ((prev: WordScrambleMultiplayerGame | null) => WordScrambleMultiplayerGame | null)) => void;
  setGameResults: (results: WordScrambleMultiplayerResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
  roundTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  deleteCurrentRoom: () => void;
}

export function useGameActions({
  game,
  currentUser,
  setGame,
  setGameResults,
  setLoading,
  setError,
  setRoomId,
  isHost,
  clearBotTimers,
  roundTimerRef,
  deleteCurrentRoom,
}: UseGameActionsProps) {
  // Join game via Firestore
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const room = await findRoomByCode(code);

      if (!room || room.gameType !== 'word-scramble') {
        throw new Error('Không tìm thấy phòng Sắp Xếp Từ với mã này');
      }

      const roomData = room.data as unknown as WordScrambleMultiplayerGame;

      if (roomData.status !== 'waiting') {
        throw new Error('Trò chơi đã bắt đầu');
      }

      const players = roomData.players || {};
      if (Object.keys(players).length >= (roomData.settings?.maxPlayers || 20)) {
        throw new Error('Phòng đã đầy');
      }

      if (players[currentUser.id]) {
        setRoomId(room.id);
        return;
      }

      const player: WordScrambleMultiplayerPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        streak: 0,
        maxStreak: 0,
      };

      const updatedPlayers = { ...players, [currentUser.id]: player };
      await updateGameRoom(room.id, { players: updatedPlayers });

      setRoomId(room.id);
      setGameResults(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia phòng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, setRoomId, setGameResults, setLoading, setError]);

  // Leave game — delete Firestore room directly
  const leaveGame = useCallback(() => {
    if (!game) return;
    clearBotTimers();
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    deleteCurrentRoom();
    setGame(() => null);
  }, [game, clearBotTimers, roundTimerRef, deleteCurrentRoom, setGame]);

  // Kick player (host only)
  const kickPlayer = useCallback((playerId: string) => {
    if (!game || !isHost || playerId === currentUser.id) return;

    setGame(prev => {
      if (!prev) return null;
      const { [playerId]: _removed, ...remainingPlayers } = prev.players;
      return { ...prev, players: remainingPlayers };
    });
  }, [game, currentUser, isHost, setGame]);

  // Start game
  const startGame = useCallback(async () => {
    if (!game || !isHost) return;

    const playerCount = Object.keys(game.players).length;
    if (playerCount < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người chơi`);
      return;
    }

    clearBotTimers();

    setGame(prev => prev ? { ...prev, status: 'starting', startedAt: new Date().toISOString() } : null);

    setTimeout(() => {
      setGame(prev => prev ? { ...prev, status: 'playing' } : null);
    }, 3000);
  }, [game, isHost, setError, clearBotTimers, setGame]);

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
        correctAnswers: 0,
        wrongAnswers: 0,
        streak: 0,
        maxStreak: 0,
        isBot: true,
      };

      return { ...prev, players: newPlayers };
    });
  }, [setGame]);

  // Reset game
  const resetGame = useCallback(() => {
    clearBotTimers();
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    deleteCurrentRoom();
    setGame(() => null);
    setGameResults(null);
    setError(null);
  }, [clearBotTimers, roundTimerRef, deleteCurrentRoom, setGame, setGameResults, setError]);

  return {
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    addBot,
    resetGame,
  };
}
