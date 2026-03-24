// Domain context: vocabulary flashcards + lessons
// Isolated so vocab state changes don't re-render grammar/kanji/reading/exercise consumers

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Flashcard, Lesson, JLPTLevel } from '../types/flashcard';
import { useFlashcards } from '../hooks/use-flashcards';
import { useLessons } from '../hooks/use-lessons';

export interface VocabDataContextValue {
  // Flashcards
  cards: Flashcard[];
  addCard: (data: Parameters<ReturnType<typeof useFlashcards>['addCard']>[0], createdBy?: string) => Promise<Flashcard>;
  updateCard: (id: string, data: Partial<Flashcard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  getStatsByLevel: () => Record<JLPTLevel, number>;

  // Lessons
  lessons: Lesson[];
  addLesson: (name: string, jlptLevel: JLPTLevel, parentId: string | null, createdBy?: string) => Promise<Lesson>;
  updateLesson: (id: string, name: string) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  toggleLock: (id: string) => Promise<void>;
  toggleLessonHide: (id: string) => Promise<void>;
  reorderLessons: (reorderedLessons: { id: string; order: number }[]) => Promise<void>;
}

const VocabDataContext = createContext<VocabDataContextValue | null>(null);

interface Props {
  children: ReactNode;
  levelFilter?: string;
}

export function VocabDataProvider({ children, levelFilter }: Props) {
  const {
    cards,
    addCard,
    updateCard,
    deleteCard,
    getStatsByLevel,
  } = useFlashcards(levelFilter);

  const {
    lessons,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessonsByLevel,
    getChildLessons,
    toggleLock,
    toggleHide,
    reorderLessons,
  } = useLessons();

  const value = useMemo<VocabDataContextValue>(() => ({
    cards, addCard, updateCard, deleteCard, getStatsByLevel,
    lessons, addLesson, updateLesson, deleteLesson, getLessonsByLevel, getChildLessons,
    toggleLock, toggleLessonHide: toggleHide, reorderLessons,
  }), [
    cards, addCard, updateCard, deleteCard, getStatsByLevel,
    lessons, addLesson, updateLesson, deleteLesson, getLessonsByLevel, getChildLessons,
    toggleLock, toggleHide, reorderLessons,
  ]);

  return <VocabDataContext.Provider value={value}>{children}</VocabDataContext.Provider>;
}

export function useVocabData() {
  const ctx = useContext(VocabDataContext);
  if (!ctx) throw new Error('useVocabData must be used within VocabDataProvider');
  return ctx;
}
