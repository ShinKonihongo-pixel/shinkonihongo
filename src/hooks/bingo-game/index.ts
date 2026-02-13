// Bingo Game Hook - Main entry point
// Manages all game state and logic
// Game state is synced to Firestore for cross-device multiplayer

import { useState, useCallback, useEffect, useRef } from 'react';
import type { UseBingoGameProps, BingoGameState, BingoGameRefs } from './types';
import type { BingoGame } from '../../types/bingo-game';
import { useGameComputed } from './use-game-computed';
import { useGameCreate } from './use-game-create';
import { useGameManagement } from './use-game-management';
import { useGameDraw } from './use-game-draw';
import { useGameBingo } from './use-game-bingo';
import { useGameSkills } from './use-game-skills';
import { useBotAutoplay } from './use-bot-autoplay';
import {
  updateGameRoom,
  deleteGameRoom,
  subscribeToGameRoom,
} from '../../services/game-rooms';

export function useBingoGame({ currentUser }: UseBingoGameProps) {
  // Game state
  const [state, setState] = useState<BingoGameState>({
    game: null,
    gameResults: null,
    availableRooms: [],
    loading: false,
    error: null,
  });

  // Firestore room ID
  const [roomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Refs for timers
  const refs: BingoGameRefs = {
    botTimerRef: useRef<NodeJS.Timeout | null>(null),
    botTimer2Ref: useRef<NodeJS.Timeout | null>(null),
    botDrawTimerRef: useRef<NodeJS.Timeout | null>(null),
  };

  // Firestore subscription - updates local state from remote changes
  useEffect(() => {
    if (!roomId) return;
    return subscribeToGameRoom<BingoGame>(roomId, (remoteGame) => {
      if (!remoteGame) {
        setState(prev => ({ ...prev, game: null }));
        return;
      }
      setState(prev => ({ ...prev, game: remoteGame }));
    });
  }, [roomId]);

  // setGame wrapper: updates local state AND syncs to Firestore
  const setGame = useCallback((
    updater: ((prev: BingoGame | null) => BingoGame | null) | BingoGame | null
  ) => {
    setState(prev => {
      const newGame = typeof updater === 'function' ? updater(prev.game) : updater;

      if (newGame && roomIdRef.current) {
        // Sync to Firestore (fire-and-forget)
        const { id: _id, ...data } = newGame;
        updateGameRoom(roomIdRef.current, data as Record<string, unknown>).catch(err =>
          console.error('Failed to sync bingo state:', err)
        );
      } else if (!newGame && roomIdRef.current) {
        // Game reset/ended - clean up Firestore room
        deleteGameRoom(roomIdRef.current).catch(console.error);
        roomIdRef.current = null;
        setRoomId(null);
      }

      return { ...prev, game: newGame };
    });
  }, []);

  // Computed values
  const computed = useGameComputed(state.game, currentUser);

  // Game creation
  const create = useGameCreate(setGame, setState, refs, currentUser, setRoomId);

  // Game management
  const management = useGameManagement(state, setGame, setState, refs, currentUser, computed.isHost, setRoomId);

  // Game draw
  const draw = useGameDraw(state, setGame, setState, currentUser, computed.currentPlayer);

  // Game bingo
  const bingo = useGameBingo(state, setGame, setState, currentUser, computed.currentPlayer);

  // Skills
  const skills = useGameSkills(state, setGame, setState, currentUser, computed.currentPlayer);

  // Bot autoplay
  useBotAutoplay(state, setGame, setState, refs, computed.isHost);

  // Cleanup timers on unmount
  useEffect(() => {
    const botTimer = refs.botTimerRef;
    const botTimer2 = refs.botTimer2Ref;
    const botDrawTimer = refs.botDrawTimerRef;
    return () => {
      if (botTimer.current) clearTimeout(botTimer.current);
      if (botTimer2.current) clearTimeout(botTimer2.current);
      if (botDrawTimer.current) clearTimeout(botDrawTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    if (refs.botTimerRef.current) clearTimeout(refs.botTimerRef.current);
    if (refs.botTimer2Ref.current) clearTimeout(refs.botTimer2Ref.current);
    if (refs.botDrawTimerRef.current) clearTimeout(refs.botDrawTimerRef.current);
    setGame(null);
    setState(prev => ({ ...prev, gameResults: null }));
  }, [refs.botTimerRef, refs.botTimer2Ref, refs.botDrawTimerRef, setGame]);

  // Set error
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  return {
    // State
    game: state.game,
    gameResults: state.gameResults,
    availableRooms: state.availableRooms,
    loading: state.loading,
    error: state.error,
    roomId,

    // Computed
    isHost: computed.isHost,
    currentPlayer: computed.currentPlayer,
    sortedPlayers: computed.sortedPlayers,
    isSkillPhase: computed.isSkillPhase,

    // Actions
    createGame: create.createGame,
    joinGame: management.joinGame,
    leaveGame: management.leaveGame,
    kickPlayer: management.kickPlayer,
    startGame: management.startGame,
    drawNumber: draw.drawNumber,
    claimBingo: bingo.claimBingo,
    useSkill: skills.useSkill,
    skipSkill: skills.skipSkill,
    resetGame,
    setError,
  };
}
