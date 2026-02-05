// Computed game values

import { useMemo } from 'react';
import type { BingoGame } from '../../types/bingo-game';
import type { UseBingoGameProps } from './types';

export function useGameComputed(
  game: BingoGame | null,
  currentUser: UseBingoGameProps['currentUser']
) {
  const isHost = useMemo(() => game?.hostId === currentUser.id, [game, currentUser]);

  const currentPlayer = useMemo(
    () => game?.players[currentUser.id],
    [game, currentUser]
  );

  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => {
      // By completed rows first
      if (b.completedRows !== a.completedRows) return b.completedRows - a.completedRows;
      // Then by marked count
      return b.markedCount - a.markedCount;
    });
  }, [game]);

  const isSkillPhase = useMemo(() => {
    if (!game || !game.settings.skillsEnabled) return false;
    return game.currentTurn > 0 && game.currentTurn % game.settings.skillInterval === 0;
  }, [game]);

  return {
    isHost,
    currentPlayer,
    sortedPlayers,
    isSkillPhase,
  };
}
