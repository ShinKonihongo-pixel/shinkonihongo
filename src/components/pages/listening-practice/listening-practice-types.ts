// Listening Practice page types
// Extracted from listening-practice-page.tsx for better maintainability

import type { Flashcard, DifficultyLevel, JLPTLevel, Lesson } from '../../../types/flashcard';

// Main component props
export interface ListeningPracticePageProps {
  cards: Flashcard[];
  lessons: Lesson[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onGoHome?: () => void;
}

// View mode for navigation
export type ViewMode = 'level-select' | 'vocabulary' | 'custom-audio';

// Difficulty option for filter dropdown
export interface DifficultyOption {
  value: DifficultyLevel | 'all';
  label: string;
}
