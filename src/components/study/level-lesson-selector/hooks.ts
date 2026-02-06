import { useMemo } from 'react';
import type { JLPTLevel, Flashcard, GrammarCard, KanjiCard, BaseLesson } from './types';
import { JLPT_LEVELS } from './constants';

export function useCardCountByLevel(
  cards: Flashcard[] | GrammarCard[] | KanjiCard[],
  type: 'vocabulary' | 'grammar' | 'kanji'
) {
  return useMemo(() => {
    const counts: Record<string, number> = {};
    JLPT_LEVELS.forEach(level => {
      if (type === 'vocabulary') {
        counts[level] = (cards as Flashcard[]).filter(c => c.jlptLevel === level).length;
      } else {
        counts[level] = (cards as GrammarCard[]).filter(c => c.jlptLevel === level).length;
      }
    });
    return counts;
  }, [cards, type]);
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
    const counts: Record<string, number> = {};
    levelLessons.forEach(lesson => {
      const childLessons = getChildLessons(lesson.id);
      const lessonIds = [lesson.id, ...childLessons.map(l => l.id)];
      if (type === 'vocabulary') {
        counts[lesson.id] = (cards as Flashcard[]).filter(c => lessonIds.includes(c.lessonId)).length;
      } else {
        counts[lesson.id] = (cards as GrammarCard[]).filter(c => lessonIds.includes(c.lessonId)).length;
      }
    });
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
