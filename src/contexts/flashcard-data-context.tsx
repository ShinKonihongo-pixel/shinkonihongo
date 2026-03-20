// Context for flashcard, lesson, grammar, kanji, exercise, and reading data
// Consolidates data-fetching hooks to reduce App.tsx complexity

import { createContext, useContext, type ReactNode } from 'react';
import type { Flashcard, Lesson, JLPTLevel, GrammarCard, GrammarLesson } from '../types/flashcard';
import type { KanjiCard, KanjiLesson } from '../types/kanji';
import type { ReadingPassage, ReadingFolder } from '../types/reading';
import { useFlashcards } from '../hooks/use-flashcards';
import { useLessons } from '../hooks/use-lessons';
import { useGrammarCards } from '../hooks/use-grammar-cards';
import { useGrammarLessons } from '../hooks/use-grammar-lessons';
import { useKanjiCards } from '../hooks/use-kanji-cards';
import { useKanjiLessons } from '../hooks/use-kanji-lessons';
import { useExercises } from '../hooks/use-exercises';
import { useReading } from '../hooks/use-reading';

interface FlashcardDataContextValue {
  // Flashcards
  cards: Flashcard[];
  addCard: (data: Parameters<ReturnType<typeof useFlashcards>['addCard']>[0], createdBy?: string) => Promise<Flashcard>;
  updateCard: (id: string, data: Partial<Flashcard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  getStatsByLevel: () => Record<JLPTLevel, number>;

  // Lessons (vocabulary)
  lessons: Lesson[];
  addLesson: (name: string, jlptLevel: JLPTLevel, parentId: string | null, createdBy?: string) => Promise<Lesson>;
  updateLesson: (id: string, name: string) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  toggleLock: (id: string) => Promise<void>;
  toggleLessonHide: (id: string) => Promise<void>;
  reorderLessons: (reorderedLessons: { id: string; order: number }[]) => Promise<void>;

  // Grammar cards
  grammarCards: GrammarCard[];
  updateGrammarCard: (id: string, data: Partial<GrammarCard>) => Promise<void>;

  // Grammar lessons
  grammarLessons: GrammarLesson[];
  getGrammarLessonsByLevel: (level: JLPTLevel) => GrammarLesson[];
  getGrammarChildLessons: (parentId: string) => GrammarLesson[];

  // Kanji cards
  kanjiCards: KanjiCard[];
  updateKanjiCard: (id: string, data: Partial<KanjiCard>) => Promise<void>;

  // Kanji lessons
  kanjiLessons: KanjiLesson[];
  getKanjiLessonsByLevel: (level: JLPTLevel) => KanjiLesson[];
  getKanjiChildLessons: (parentId: string) => KanjiLesson[];

  // Exercises
  getPublishedExercises: () => ReturnType<ReturnType<typeof useExercises>['getPublishedExercises']>;

  // Reading
  readingPassages: ReadingPassage[];
  readingFolders: ReadingFolder[];
  getReadingFoldersByLevel: (level: JLPTLevel) => ReadingFolder[];
  getReadingPassagesByFolder: (folderId: string) => ReadingPassage[];
}

const FlashcardDataContext = createContext<FlashcardDataContextValue | null>(null);

interface FlashcardDataProviderProps {
  children: ReactNode;
  levelFilter?: string; // JLPT level filter — undefined = load all (admin mode)
}

export function FlashcardDataProvider({ children, levelFilter }: FlashcardDataProviderProps) {
  // Flashcards — filtered by JLPT level for regular users
  const {
    cards,
    addCard,
    updateCard,
    deleteCard,
    getStatsByLevel,
  } = useFlashcards(levelFilter);

  // Lessons (vocabulary) — small collection, always load all
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

  // Grammar cards — filtered by JLPT level
  const { grammarCards, updateGrammarCard } = useGrammarCards(levelFilter);

  // Grammar lessons — small collection, always load all
  const {
    lessons: grammarLessons,
    getParentLessonsByLevel: getGrammarLessonsByLevel,
    getChildLessons: getGrammarChildLessons,
  } = useGrammarLessons();

  // Kanji cards — filtered by JLPT level
  const { kanjiCards, updateKanjiCard } = useKanjiCards(levelFilter);

  // Kanji lessons — small collection, always load all
  const {
    lessons: kanjiLessons,
    getParentLessonsByLevel: getKanjiLessonsByLevel,
    getChildLessons: getKanjiChildLessons,
  } = useKanjiLessons();

  // Exercises
  const { getPublishedExercises } = useExercises();

  // Reading
  const {
    passages: readingPassages,
    folders: readingFolders,
    getFoldersByLevel: getReadingFoldersByLevel,
    getPassagesByFolder: getReadingPassagesByFolder,
  } = useReading();

  const value: FlashcardDataContextValue = {
    // Flashcards
    cards,
    addCard,
    updateCard,
    deleteCard,
    getStatsByLevel,

    // Lessons (vocabulary)
    lessons,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessonsByLevel,
    getChildLessons,
    toggleLock,
    toggleLessonHide: toggleHide,
    reorderLessons,

    // Grammar cards
    grammarCards,
    updateGrammarCard,

    // Grammar lessons
    grammarLessons,
    getGrammarLessonsByLevel,
    getGrammarChildLessons,

    // Kanji cards
    kanjiCards,
    updateKanjiCard,

    // Kanji lessons
    kanjiLessons,
    getKanjiLessonsByLevel,
    getKanjiChildLessons,

    // Exercises
    getPublishedExercises,

    // Reading
    readingPassages,
    readingFolders,
    getReadingFoldersByLevel,
    getReadingPassagesByFolder,
  };

  return (
    <FlashcardDataContext.Provider value={value}>
      {children}
    </FlashcardDataContext.Provider>
  );
}

export function useFlashcardData() {
  const context = useContext(FlashcardDataContext);
  if (!context) {
    throw new Error('useFlashcardData must be used within FlashcardDataProvider');
  }
  return context;
}
