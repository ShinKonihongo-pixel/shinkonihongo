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

// Extended props with card update callback
export interface ListeningPracticePagePropsExtended extends ListeningPracticePageProps {
  onUpdateCard?: (id: string, data: Partial<Flashcard>) => void;
}

// View mode for navigation
export type ViewMode = 'level-select' | 'vocabulary' | 'custom-audio';

// Extended view modes (includes lesson-list)
export type ExtendedViewMode = ViewMode | 'lesson-list';

// Memorization filter
export type MemorizationFilter = 'all' | 'learned' | 'not-learned';

// Difficulty option for filter dropdown
export interface DifficultyOption {
  value: DifficultyLevel | 'all';
  label: string;
}
