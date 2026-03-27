// Sub-hook: room listing and real-time subscription

import { useState, useCallback } from 'react';
import type { QuizGame } from '../types/quiz-game';
import * as gameService from '../services/quiz-game-firestore';
import { handleError } from '../utils/error-handler';

export function useQuizGameRooms() {
  const [availableRooms, setAvailableRooms] = useState<QuizGame[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const fetchAvailableRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const rooms = await gameService.getAvailableRooms();
      setAvailableRooms(rooms);
    } catch (err) {
      handleError(err, { context: 'useQuizGame' });
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const subscribeToRooms = useCallback((callback?: (rooms: QuizGame[]) => void) => {
    setLoadingRooms(true);
    const unsubscribe = gameService.subscribeToAvailableRooms((rooms) => {
      setAvailableRooms(rooms);
      setLoadingRooms(false);
      callback?.(rooms);
    });
    return unsubscribe;
  }, []);

  return { availableRooms, loadingRooms, fetchAvailableRooms, subscribeToRooms };
}
