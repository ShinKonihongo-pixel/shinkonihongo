// Word match effects - auto-end round

import { useEffect } from 'react';
import type { WordMatchGame } from '../../types/word-match';

interface UseEffectsProps {
  game: WordMatchGame | null;
  endRound: () => void;
}

export function useEffects({ game, endRound }: UseEffectsProps) {
  // Auto-end round when all submitted
  useEffect(() => {
    if (!game || game.status !== 'playing') return;

    const allSubmitted = Object.values(game.players).every(
      p => p.hasSubmitted || p.isDisconnected
    );
    if (allSubmitted) {
      setTimeout(() => endRound(), 500);
    }
  }, [game, endRound]);
}
