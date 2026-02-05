import type { JLPTLevel, Flashcard, GrammarCard } from '../../../types/flashcard';

export type BaseLesson = {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  parentId: string | null;
  order: number;
};

export interface LevelLessonSelectorProps {
  type: 'vocabulary' | 'grammar';
  cards: Flashcard[] | GrammarCard[];
  getLessonsByLevel: (level: JLPTLevel) => BaseLesson[];
  getChildLessons: (parentId: string) => BaseLesson[];
  onStart: (selectedLessons: string[], level: JLPTLevel) => void;
  onGoHome: () => void;
}

export type { JLPTLevel, Flashcard, GrammarCard };
