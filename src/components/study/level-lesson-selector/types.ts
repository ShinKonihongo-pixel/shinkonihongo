import type { JLPTLevel, Flashcard, GrammarCard } from '../../../types/flashcard';
import type { KanjiCard } from '../../../types/kanji';

export type StudyMode = 'flashcard' | 'listening';

export type BaseLesson = {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  parentId: string | null;
  order: number;
};

export interface LevelLessonSelectorProps {
  type: 'vocabulary' | 'grammar' | 'kanji';
  cards: Flashcard[] | GrammarCard[] | KanjiCard[];
  getLessonsByLevel: (level: JLPTLevel) => BaseLesson[];
  getChildLessons: (parentId: string) => BaseLesson[];
  onStart: (selectedLessons: string[], level: JLPTLevel, mode: StudyMode) => void;
  onGoHome: () => void;
  levels?: JLPTLevel[];
}

export type { JLPTLevel, Flashcard, GrammarCard, KanjiCard };
