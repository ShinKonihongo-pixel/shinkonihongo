// Kanji Drop multiplayer progress sync
// Debounced writes of player progress to Firestore on each level completion

import { useCallback, useRef } from 'react';
import type { KanjiDropMultiplayerGame } from '../../components/pages/kanji-drop/kanji-drop-multiplayer-types';
import type { SetGame } from '../shared/game-types';

interface ProgressData {
  currentLevel: number;
  score: number;
  clearedCount: number;
  levelsCompleted: number;
  finished?: boolean;
}

interface UseProgressSyncProps {
  currentUserId: string;
  setGame: SetGame<KanjiDropMultiplayerGame>;
}

export function useProgressSync({ currentUserId, setGame }: UseProgressSyncProps) {
  const lastSyncRef = useRef(0);

  const syncProgress = useCallback((data: ProgressData) => {
    const now = Date.now();
    // Debounce: at most once per 500ms (but always sync on finish)
    if (!data.finished && now - lastSyncRef.current < 500) return;
    lastSyncRef.current = now;

    setGame(prev => {
      if (!prev || prev.status !== 'playing') return prev;
      const player = prev.players[currentUserId];
      if (!player) return prev;

      const updatedPlayer = {
        ...player,
        currentLevel: data.currentLevel,
        score: data.score,
        clearedCount: data.clearedCount,
        levelsCompleted: data.levelsCompleted,
        ...(data.finished ? { finishedAt: new Date().toISOString() } : {}),
      };

      const updatedPlayers = { ...prev.players, [currentUserId]: updatedPlayer };

      // Check if all players finished → game is finished
      const allFinished = Object.values(updatedPlayers).every(p => p.finishedAt || p.isBot);

      return {
        ...prev,
        players: updatedPlayers,
        ...(allFinished ? { status: 'finished' as const } : {}),
      };
    });
  }, [currentUserId, setGame]);

  return { syncProgress };
}
