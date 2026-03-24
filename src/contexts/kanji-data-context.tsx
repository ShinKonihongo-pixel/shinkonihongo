// Domain context: kanji cards + kanji lessons
// Isolated so kanji state changes don't re-render vocab/grammar/reading/exercise consumers

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { KanjiCard, KanjiLesson } from '../types/kanji';
import type { JLPTLevel } from '../types/flashcard';
import { useKanjiCards } from '../hooks/use-kanji-cards';
import { useKanjiLessons } from '../hooks/use-kanji-lessons';

export interface KanjiDataContextValue {
  kanjiCards: KanjiCard[];
  updateKanjiCard: (id: string, data: Partial<KanjiCard>) => Promise<void>;

  kanjiLessons: KanjiLesson[];
  getKanjiLessonsByLevel: (level: JLPTLevel) => KanjiLesson[];
  getKanjiChildLessons: (parentId: string) => KanjiLesson[];
}

const KanjiDataContext = createContext<KanjiDataContextValue | null>(null);

interface Props {
  children: ReactNode;
  levelFilter?: string;
}

export function KanjiDataProvider({ children, levelFilter }: Props) {
  const { kanjiCards, updateKanjiCard } = useKanjiCards(levelFilter);

  const {
    lessons: kanjiLessons,
    getParentLessonsByLevel: getKanjiLessonsByLevel,
    getChildLessons: getKanjiChildLessons,
  } = useKanjiLessons();

  const value = useMemo<KanjiDataContextValue>(() => ({
    kanjiCards, updateKanjiCard,
    kanjiLessons, getKanjiLessonsByLevel, getKanjiChildLessons,
  }), [
    kanjiCards, updateKanjiCard,
    kanjiLessons, getKanjiLessonsByLevel, getKanjiChildLessons,
  ]);

  return <KanjiDataContext.Provider value={value}>{children}</KanjiDataContext.Provider>;
}

export function useKanjiData() {
  const ctx = useContext(KanjiDataContext);
  if (!ctx) throw new Error('useKanjiData must be used within KanjiDataProvider');
  return ctx;
}
