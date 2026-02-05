// Hook for managing vocabulary practice state
import { useState, useMemo, useCallback } from 'react';
import type { Flashcard, JLPTLevel } from '../../../types/flashcard';
import type { MemorizationFilter } from './listening-practice-types';

interface UseVocabularyStateOptions {
  cards: Flashcard[];
  selectedLevel: JLPTLevel | null;
  selectedLessonIds: string[];
}

export function useVocabularyState({
  cards,
  selectedLevel,
  selectedLessonIds,
}: UseVocabularyStateOptions) {
  const [memorizationFilter, setMemorizationFilter] = useState<MemorizationFilter>('all');

  const filteredCards = useMemo(() => {
    if (!selectedLevel || selectedLessonIds.length === 0) return [];

    return cards.filter((card) => {
      if (card.jlptLevel !== selectedLevel) return false;
      if (!selectedLessonIds.includes(card.lessonId)) return false;

      if (memorizationFilter === 'learned' && card.memorizationStatus !== 'memorized')
        return false;
      if (memorizationFilter === 'not-learned' && card.memorizationStatus === 'memorized')
        return false;

      return true;
    });
  }, [cards, selectedLevel, selectedLessonIds, memorizationFilter]);

  const resetFilter = useCallback(() => {
    setMemorizationFilter('all');
  }, []);

  return {
    memorizationFilter,
    setMemorizationFilter,
    filteredCards,
    resetFilter,
  };
}
