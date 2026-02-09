// Game management actions (join, leave, kick, start)

import { useCallback } from 'react';
import type { UseBingoGameProps, BingoGameState, BingoGameRefs } from './types';

export function useGameManagement(
  state: BingoGameState,
  setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  refs: BingoGameRefs,
  currentUser: UseBingoGameProps['currentUser'],
  isHost: boolean
) {
  const { botTimerRef, botTimer2Ref, botDrawTimerRef } = refs;

  // Join existing game
  const joinGame = useCallback(async (_code: string) => {
    void _code;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      throw new Error('Chức năng tham gia phòng đang phát triển');
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Không thể tham gia trò chơi'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [setState]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);
    if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);
    setState(prev => ({ ...prev, game: null, gameResults: null }));
  }, [setState, botTimerRef, botTimer2Ref, botDrawTimerRef]);

  // Kick player (host only)
  const kickPlayer = useCallback((playerId: string) => {
    if (!state.game || !isHost || playerId === currentUser.id) return;

    setState(prev => {
      if (!prev.game) return prev;
      const { [playerId]: _removed, ...remainingPlayers } = prev.game.players;
      return { ...prev, game: { ...prev.game, players: remainingPlayers } };
    });
  }, [state.game, currentUser, isHost, setState]);

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

    setState(prev => ({
      ...prev,
      game: prev.game ? {
        ...prev.game,
        status: 'starting',
        startedAt: new Date().toISOString(),
      } : null
    }));

    // After countdown, start playing
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        game: prev.game ? {
          ...prev.game,
          status: 'playing',
          currentTurn: 1,
        } : null
      }));
    }, 3000);
  }, [state.game, isHost, setState, botTimerRef, botTimer2Ref]);

  return {
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
  };
}
