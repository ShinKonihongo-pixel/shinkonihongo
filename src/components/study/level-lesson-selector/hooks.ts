import { useMemo } from 'react';
import type { JLPTLevel, Flashcard, GrammarCard, KanjiCard, BaseLesson } from './types';
import { JLPT_LEVELS } from './constants';

export function useCardCountByLevel(
  cards: Flashcard[] | GrammarCard[] | KanjiCard[],
  type: 'vocabulary' | 'grammar' | 'kanji',
  levels?: JLPTLevel[]
) {
  return useMemo(() => {
    // Single pass through all cards instead of N passes per level
    const counts: Record<string, number> = {};
    const displayLevels = levels ?? JLPT_LEVELS;
    displayLevels.forEach(level => { counts[level] = 0; });
    for (const card of cards) {
      const level = (card as Flashcard).jlptLevel;
      if (level in counts) counts[level]++;
    }
    return counts;
  }, [cards, levels]);
}

export function useLevelLessons(
  selectedLevel: JLPTLevel | null,
  getLessonsByLevel: (level: JLPTLevel) => BaseLesson[]
) {
  return useMemo(() => {
    if (!selectedLevel) return [];
    const allLessons = getLessonsByLevel(selectedLevel);
    return allLessons.filter(l => !l.parentId);
  }, [selectedLevel, getLessonsByLevel]);
}

export function useCardsPerLesson(
  levelLessons: BaseLesson[],
  cards: Flashcard[] | GrammarCard[] | KanjiCard[],
  getChildLessons: (parentId: string) => BaseLesson[],
  type: 'vocabulary' | 'grammar' | 'kanji'
) {
  return useMemo(() => {
    // Build a reverse map: lessonId → parent lesson id (for O(1) lookup)
    const lessonToParent = new Map<string, string>();
    const counts: Record<string, number> = {};
    levelLessons.forEach(lesson => {
      counts[lesson.id] = 0;
      lessonToParent.set(lesson.id, lesson.id);
      const childLessons = getChildLessons(lesson.id);
      childLessons.forEach(child => lessonToParent.set(child.id, lesson.id));
    });
    // Single pass through cards
    for (const card of cards) {
      const cardLessonId = (card as Flashcard).lessonId;
      const parentId = lessonToParent.get(cardLessonId);
      if (parentId) counts[parentId]++;
    }
    return counts;
  }, [levelLessons, cards, getChildLessons, type]);
}

export function useTotalSelectedCards(
  selectedLessons: string[],
  cardsPerLesson: Record<string, number>
) {
  return useMemo(() => {
    if (selectedLessons.length === 0) return 0;
    let total = 0;
    selectedLessons.forEach(lessonId => {
      total += cardsPerLesson[lessonId] || 0;
    });
    return total;
  }, [selectedLessons, cardsPerLesson]);
}
