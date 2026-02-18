import type { JLPTLevel, Flashcard, GrammarCard } from '../../../types/flashcard';
import type { KanjiCard } from '../../../types/kanji';
import type { useVocabularyNotebooks } from '../../../hooks/use-vocabulary-notebooks';

export type StudyMode = 'flashcard' | 'listening';

export type BaseLesson = {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  parentId: string | null;
  order: number;
};

export type NotebookHook = ReturnType<typeof useVocabularyNotebooks>;

export interface LevelLessonSelectorProps {
  type: 'vocabulary' | 'grammar' | 'kanji';
  cards: Flashcard[] | GrammarCard[] | KanjiCard[];
  getLessonsByLevel: (level: JLPTLevel) => BaseLesson[];
  getChildLessons: (parentId: string) => BaseLesson[];
  onStart: (selectedLessons: string[], level: JLPTLevel, mode: StudyMode) => void;
  onGoHome: () => void;
  levels?: JLPTLevel[];
  // Notebook integration (vocabulary only)
  notebookHook?: NotebookHook;
  allCards?: Flashcard[];
  onNotebookStudy?: (cards: Flashcard[]) => void;
}

export type { JLPTLevel, Flashcard, GrammarCard, KanjiCard };
