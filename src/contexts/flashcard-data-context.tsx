// Backward-compatible context: composes 5 domain sub-contexts.
// Consumers can migrate to domain hooks (useVocabData, useGrammarData, etc.)
// for finer-grained re-render isolation, or keep using useFlashcardData() unchanged.

import { useMemo, type ReactNode } from 'react';
import type { Flashcard, Lesson, JLPTLevel, GrammarCard, GrammarLesson } from '../types/flashcard';
import type { KanjiCard, KanjiLesson } from '../types/kanji';
import type { ReadingPassage, ReadingFolder } from '../types/reading';
import type { Exercise } from '../types/exercise';
import { useFlashcards } from '../hooks/use-flashcards';

import { VocabDataProvider, useVocabData } from './vocab-data-context';
import { GrammarDataProvider, useGrammarData } from './grammar-data-context';
import { KanjiDataProvider, useKanjiData } from './kanji-data-context';
import { ReadingDataProvider, useReadingData } from './reading-data-context';
import { ExerciseDataProvider, useExerciseData } from './exercise-data-context';

// Re-export domain hooks for direct consumption
export { useVocabData } from './vocab-data-context';
export { useGrammarData } from './grammar-data-context';
export { useKanjiData } from './kanji-data-context';
export { useReadingData } from './reading-data-context';
export { useExerciseData } from './exercise-data-context';

export interface FlashcardDataContextValue {
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
  getPublishedExercises: () => Exercise[];

  // Reading
  readingPassages: ReadingPassage[];
  readingFolders: ReadingFolder[];
  getReadingFoldersByLevel: (level: JLPTLevel) => ReadingFolder[];
  getReadingPassagesByFolder: (folderId: string) => ReadingPassage[];
}

interface FlashcardDataProviderProps {
  children: ReactNode;
  levelFilter?: string;
}

export function FlashcardDataProvider({ children, levelFilter }: FlashcardDataProviderProps) {
  return (
    <VocabDataProvider levelFilter={levelFilter}>
      <GrammarDataProvider levelFilter={levelFilter}>
        <KanjiDataProvider levelFilter={levelFilter}>
          <ReadingDataProvider>
            <ExerciseDataProvider>
              {children}
            </ExerciseDataProvider>
          </ReadingDataProvider>
        </KanjiDataProvider>
      </GrammarDataProvider>
    </VocabDataProvider>
  );
}

// Backward-compatible aggregating hook — merges all domain contexts into one object.
// Note: this hook still re-renders when ANY domain changes. For optimal perf, use
// the domain-specific hooks (useVocabData, useGrammarData, etc.) directly.
export function useFlashcardData(): FlashcardDataContextValue {
  const vocab = useVocabData();
  const grammar = useGrammarData();
  const kanji = useKanjiData();
  const reading = useReadingData();
  const exercise = useExerciseData();

  return useMemo(() => ({
    ...vocab,
    ...grammar,
    ...kanji,
    ...reading,
    ...exercise,
  }), [vocab, grammar, kanji, reading, exercise]);
}
