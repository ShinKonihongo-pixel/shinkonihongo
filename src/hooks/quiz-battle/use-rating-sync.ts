// Quiz Battle rating sync — loads and exposes the current user's rating

import { useState, useEffect, useCallback } from 'react';
import type { QuizBattleRating } from '../../components/pages/quiz-battle/quiz-battle-types';
import type { JLPTLevel } from '../../types/jlpt-question';
import type { GameUser } from '../shared/game-types';
import { getOrCreateRating } from '../../services/quiz-battle/quiz-battle-service';

interface UseRatingSyncProps {
  currentUser: GameUser;
}

export function useRatingSync({ currentUser }: UseRatingSyncProps) {
  const [myRating, setMyRating] = useState<QuizBattleRating | null>(null);

  useEffect(() => {
    let cancelled = false;

    getOrCreateRating(currentUser.id, currentUser.displayName, currentUser.avatar)
      .then(rating => {
        if (!cancelled) setMyRating(rating as QuizBattleRating);
      })
      .catch(console.error);

    return () => { cancelled = true; };
  }, [currentUser.id, currentUser.displayName, currentUser.avatar]);

  const getRatingForLevel = useCallback((level: JLPTLevel): number => {
    return myRating?.ratings[level] ?? 1000;
  }, [myRating]);

  return { myRating, getRatingForLevel };
}
