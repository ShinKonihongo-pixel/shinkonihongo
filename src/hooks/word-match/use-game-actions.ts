// Word match game actions - join, leave, kick, start, add bot, reset
// Join uses Firestore to find and subscribe to remote rooms

import { useCallback } from 'react';
import type { WordMatchGame, WordMatchPlayer, WordMatchResults } from '../../types/word-match';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';
import { findRoomByCode, updateGameRoom } from '../../services/game-rooms';

interface UseGameActionsProps {
  game: WordMatchGame | null;
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  setGame: (game: WordMatchGame | null | ((prev: WordMatchGame | null) => WordMatchGame | null)) => void;
  setGameResults: (results: WordMatchResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (id: string | null) => void;
  isHost: boolean;
  clearBotTimers: () => void;
  roundTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  startNextRound: () => void;
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
  startNextRound,
}: UseGameActionsProps) {
  // Join game via Firestore
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const room = await findRoomByCode(code);

      if (!room || room.gameType !== 'word-match') {
        throw new Error('Không tìm thấy phòng Word Match với mã này');
      }

      const roomData = room.data as unknown as WordMatchGame;

      if (roomData.status !== 'waiting') {
        throw new Error('Trò chơi đã bắt đầu');
      }

      const players = roomData.players || {};
      if (Object.keys(players).length >= (roomData.settings?.maxPlayers || 20)) {
        throw new Error('Phòng đã đầy');
      }

      // Already in the game? Just subscribe
      if (players[currentUser.id]) {
        setRoomId(room.id);
        return;
      }

      // Add player to the room via Firestore
      const player: WordMatchPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        score: 0,
        correctPairs: 0,
        perfectRounds: 0,
        isDisconnected: false,
        disconnectedTurns: 0,
        hasShield: false,
        shieldTurns: 0,
        isChallenged: false,
        currentMatches: [],
        hasSubmitted: false,
        streak: 0,
      };

      const updatedPlayers = { ...players, [currentUser.id]: player };
      await updateGameRoom(room.id, {
        players: updatedPlayers,
      });

      // Subscribe to the room (subscription in use-game-state will update local state)
      setRoomId(room.id);
      setGameResults(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia phòng');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, setRoomId, setGameResults, setLoading, setError]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (!game) return;
    clearBotTimers();
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    setGame(() => null);
  }, [game, clearBotTimers, roundTimerRef, setGame]);

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

    // Start first round after countdown
    setTimeout(() => {
      startNextRound();
    }, 3000);
  }, [game, isHost, setError, clearBotTimers, setGame, startNextRound]);

  // Add bot manually (for "Add Bot" button)
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
        correctPairs: 0,
        perfectRounds: 0,
        isDisconnected: false,
        disconnectedTurns: 0,
        hasShield: false,
        shieldTurns: 0,
        isChallenged: false,
        currentMatches: [],
        hasSubmitted: false,
        streak: 0,
        isBot: true,
      };

      return { ...prev, players: newPlayers };
    });
  }, [setGame]);

  // Reset game
  const resetGame = useCallback(() => {
    setGame(() => null);
    setGameResults(null);
    setError(null);
  }, [setGame, setGameResults, setError]);

  return {
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    addBot,
    resetGame,
  };
}
