import { useRef, useCallback, useEffect } from 'react';

/**
 * Manages named timer refs with auto-cleanup on unmount.
 *
 * Usage:
 * const { setTimer, clearTimer, clearAll, timersRef } = useGameTimers(['question', 'bot', 'round']);
 * setTimer('question', setTimeout(() => ..., 1000));
 * clearTimer('bot');
 */
export function useGameTimers<K extends string>(timerNames: K[]) {
  // Create a stable ref map (one ref per timer name)
  const timersRef = useRef<Record<K, NodeJS.Timeout | null>>(
    Object.fromEntries(timerNames.map(name => [name, null])) as Record<K, NodeJS.Timeout | null>
  );

  const setTimer = useCallback((name: K, timeout: NodeJS.Timeout) => {
    // Clear existing timer with this name first
    const existing = timersRef.current[name];
    if (existing) clearTimeout(existing);
    timersRef.current[name] = timeout;
  }, []);

  const clearTimer = useCallback((name: K) => {
    const existing = timersRef.current[name];
    if (existing) {
      clearTimeout(existing);
      timersRef.current[name] = null;
    }
  }, []);

  const clearAll = useCallback(() => {
    Object.keys(timersRef.current).forEach(name => {
      const existing = timersRef.current[name as K];
      if (existing) {
        clearTimeout(existing);
        timersRef.current[name as K] = null;
      }
    });
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(timer => {
        if (timer) clearTimeout(timer as NodeJS.Timeout);
      });
    };
  }, []);

  return { setTimer, clearTimer, clearAll, timersRef };
}
