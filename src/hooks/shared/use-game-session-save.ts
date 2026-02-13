import { useEffect, useRef } from 'react';

interface UseGameSessionSaveConfig<TResults> {
  /** Current game status (e.g., 'waiting', 'playing', 'finished') */
  gameStatus: string | undefined;
  /** The results object - must be non-null when game is finished */
  results: TResults | null;
  /** Callback to execute when game finishes. Called exactly once per game finish. */
  onGameFinish: (results: TResults) => void;
  /** The status value that triggers saving (default: 'finished') */
  finishedStatus?: string;
}

/**
 * Triggers a save callback exactly once when a game finishes.
 * Prevents duplicate saves using a ref guard.
 *
 * Usage:
 * useGameSessionSave({
 *   gameStatus: game?.status,
 *   results: gameResults,
 *   onGameFinish: (results) => saveToStorage(results),
 * });
 */
export function useGameSessionSave<TResults>({
  gameStatus,
  results,
  onGameFinish,
  finishedStatus = 'finished',
}: UseGameSessionSaveConfig<TResults>) {
  const savedRef = useRef(false);

  // Reset saved flag when game restarts (status changes away from finished)
  useEffect(() => {
    if (gameStatus !== finishedStatus) {
      savedRef.current = false;
    }
  }, [gameStatus, finishedStatus]);

  useEffect(() => {
    if (gameStatus === finishedStatus && results && !savedRef.current) {
      savedRef.current = true;
      onGameFinish(results);
    }
  }, [gameStatus, results, onGameFinish, finishedStatus]);
}
