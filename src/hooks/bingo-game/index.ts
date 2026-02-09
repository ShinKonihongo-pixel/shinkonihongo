// Bingo Game Hook - Main entry point
// Manages all game state and logic

import { useState, useCallback, useEffect, useRef } from 'react';
import type { UseBingoGameProps, BingoGameState, BingoGameRefs } from './types';
import { useGameComputed } from './use-game-computed';
import { useGameCreate } from './use-game-create';
import { useGameManagement } from './use-game-management';
import { useGameDraw } from './use-game-draw';
import { useGameBingo } from './use-game-bingo';
import { useGameSkills } from './use-game-skills';
import { useBotAutoplay } from './use-bot-autoplay';

export function useBingoGame({ currentUser }: UseBingoGameProps) {
  // Game state
  const [state, setState] = useState<BingoGameState>({
    game: null,
    gameResults: null,
    availableRooms: [],
    loading: false,
    error: null,
  });

  // Refs for timers
  const refs: BingoGameRefs = {
    botTimerRef: useRef<NodeJS.Timeout | null>(null),
    botTimer2Ref: useRef<NodeJS.Timeout | null>(null),
    botDrawTimerRef: useRef<NodeJS.Timeout | null>(null),
  };

  // Computed values
  const computed = useGameComputed(state.game, currentUser);

  // Game creation
  const create = useGameCreate(setState, refs, currentUser);

  // Game management
  const management = useGameManagement(state, setState, refs, currentUser, computed.isHost);

  // Game draw
  const draw = useGameDraw(state, setState, currentUser, computed.currentPlayer);

  // Game bingo
  const bingo = useGameBingo(state, setState, currentUser, computed.currentPlayer);

  // Skills
  const skills = useGameSkills(state, setState, currentUser, computed.currentPlayer);

  // Bot autoplay
  useBotAutoplay(state, setState, refs, computed.isHost);

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
    setState(prev => ({ ...prev, game: null, gameResults: null }));
  }, [refs.botTimerRef, refs.botTimer2Ref, refs.botDrawTimerRef]);

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
