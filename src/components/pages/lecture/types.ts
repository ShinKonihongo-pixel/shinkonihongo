// Types for lecture page components

import type { JLPTLevel } from '../../../types/flashcard';
import type { Lecture, LectureFolder } from '../../../types/lecture';

export type ViewMode = 'levels' | 'folders' | 'lectures' | 'view' | 'present' | 'grid';

export interface LecturePageProps {
  onNavigateToEditor?: (lectureId?: string) => void;
}

export interface LevelConfig {
  levels: JLPTLevel[];
  colors: Record<JLPTLevel, string>;
  descriptions: Record<JLPTLevel, string>;
}

export interface NavigationState {
  viewMode: ViewMode;
  selectedLevel: JLPTLevel | null;
  selectedFolder: LectureFolder | null;
  selectedLecture: Lecture | null;
  currentSlideIndex: number;
  searchQuery: string;
}

export interface PresentationState {
  autoAdvance: boolean;
  autoAdvanceInterval: number;
  slideDirection: 'next' | 'prev' | null;
  blankScreen: 'black' | 'white' | null;
  showJumpDialog: boolean;
  jumpInput: string;
  presentationTime: number;
  showLaser: boolean;
  laserPosition: { x: number; y: number };
  showNotes: boolean;
  showHelp: boolean;
  showNextPreview: boolean;
  showFloatingNotes: boolean;
  userNotes: Record<string, string>;
  resumePrompt: { lectureId: string; slideIndex: number } | null;
}
