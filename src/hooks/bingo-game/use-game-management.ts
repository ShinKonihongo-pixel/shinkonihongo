// Game management actions (join, leave, kick, start)
// Join uses Firestore to find and subscribe to remote rooms

import { useCallback } from 'react';
import type { UseBingoGameProps, BingoGameState, BingoGameRefs } from './types';
import type { BingoGame, BingoPlayer } from '../../types/bingo-game';
import { generateBingoRows } from '../../types/bingo-game';
import { findRoomByCode, updateGameRoom } from '../../services/game-rooms';

export function useGameManagement(
  state: BingoGameState,
  setGame: (updater: ((prev: BingoGame | null) => BingoGame | null) | BingoGame | null) => void,
  setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  refs: BingoGameRefs,
  currentUser: UseBingoGameProps['currentUser'],
  isHost: boolean,
  setRoomId: (id: string | null) => void
) {
  const { botTimerRef, botTimer2Ref, botDrawTimerRef } = refs;

  // Join existing game via Firestore
  const joinGame = useCallback(async (code: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const room = await findRoomByCode(code);

      if (!room || room.gameType !== 'bingo') {
        throw new Error('Không tìm thấy phòng Bingo với mã này');
      }

      const roomData = room.data as unknown as BingoGame;

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
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      // Add player to the room via Firestore
      const playerRows = generateBingoRows(
        roomData.settings.rowsPerPlayer,
        roomData.settings.numbersPerRow,
        roomData.settings.numberRange
      );

      const player: BingoPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        role: currentUser.role,
        rows: playerRows,
        markedCount: 0,
        completedRows: 0,
        canBingo: false,
        hasBingoed: false,
        isBlocked: false,
        luckBonus: 1.0,
        luckTurnsLeft: 0,
        hasSkillAvailable: false,
        hasFiftyFifty: false,
        correctAnswers: 0,
        totalAnswers: 0,
      };

      const updatedPlayers = { ...players, [currentUser.id]: player };
      await updateGameRoom(room.id, {
        players: updatedPlayers,
      });

      // Subscribe to the room (subscription in index.ts will update local state)
      setRoomId(room.id);
      setState(prev => ({ ...prev, gameResults: null }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Không thể tham gia trò chơi'
      }));
      throw err;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [currentUser, setRoomId, setState]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (!state.game) return;
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);
    if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);
    setGame(null);
    setState(prev => ({ ...prev, gameResults: null }));
  }, [state.game, setGame, setState, botTimerRef, botTimer2Ref, botDrawTimerRef]);

  // Kick player (host only)
  const kickPlayer = useCallback((playerId: string) => {
    if (!state.game || !isHost || playerId === currentUser.id) return;

    setGame(prev => {
      if (!prev) return null;
      const { [playerId]: _removed, ...remainingPlayers } = prev.players;
      return { ...prev, players: remainingPlayers };
    });
  }, [state.game, currentUser, isHost, setGame]);

  // Start game
  const startGame = useCallback(async () => {
    if (!state.game || !isHost) return;

    const playerCount = Object.keys(state.game.players).length;
    if (playerCount < state.game.settings.minPlayers) {
      setState(prev => ({
        ...prev,
        error: `Cần ít nhất ${state.game?.settings.minPlayers} người chơi`
      }));
      return;
    }

    // Clear bot join timers
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);

    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'starting',
        startedAt: new Date().toISOString(),
      };
    });

    // After countdown, start playing
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'playing',
          currentTurn: 1,
        };
      });
    }, 3000);
  }, [state.game, isHost, setGame, setState, botTimerRef, botTimer2Ref]);

  return {
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
  };
}
