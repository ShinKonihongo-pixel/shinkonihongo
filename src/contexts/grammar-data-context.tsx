// Domain context: grammar cards + grammar lessons
// Isolated so grammar state changes don't re-render vocab/kanji/reading/exercise consumers

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { GrammarCard, GrammarLesson, JLPTLevel } from '../types/flashcard';
import { useGrammarCards } from '../hooks/use-grammar-cards';
import { useGrammarLessons } from '../hooks/use-grammar-lessons';

export interface GrammarDataContextValue {
  grammarCards: GrammarCard[];
  updateGrammarCard: (id: string, data: Partial<GrammarCard>) => Promise<void>;

  grammarLessons: GrammarLesson[];
  getGrammarLessonsByLevel: (level: JLPTLevel) => GrammarLesson[];
  getGrammarChildLessons: (parentId: string) => GrammarLesson[];
}

const GrammarDataContext = createContext<GrammarDataContextValue | null>(null);

interface Props {
  children: ReactNode;
  levelFilter?: string;
}

export function GrammarDataProvider({ children, levelFilter }: Props) {
  const { grammarCards, updateGrammarCard } = useGrammarCards(levelFilter);

  const {
    lessons: grammarLessons,
    getParentLessonsByLevel: getGrammarLessonsByLevel,
    getChildLessons: getGrammarChildLessons,
  } = useGrammarLessons();

  const value = useMemo<GrammarDataContextValue>(() => ({
    grammarCards, updateGrammarCard,
    grammarLessons, getGrammarLessonsByLevel, getGrammarChildLessons,
  }), [
    grammarCards, updateGrammarCard,
    grammarLessons, getGrammarLessonsByLevel, getGrammarChildLessons,
  ]);

  return <GrammarDataContext.Provider value={value}>{children}</GrammarDataContext.Provider>;
}

export function useGrammarData() {
  const ctx = useContext(GrammarDataContext);
  if (!ctx) throw new Error('useGrammarData must be used within GrammarDataProvider');
  return ctx;
}
