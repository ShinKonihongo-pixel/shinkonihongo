// Reading Practice page types
// Extracted from reading-practice-page.tsx for better maintainability

import type { ReadingPassage, ReadingFolder } from '../../../types/reading';
import type { JLPTLevel } from '../../../types/flashcard';

// Main component props
export interface ReadingPracticePageProps {
  passages: ReadingPassage[];
  folders: ReadingFolder[];
  getFoldersByLevel: (level: JLPTLevel) => ReadingFolder[];
  getPassagesByFolder: (folderId: string) => ReadingPassage[];
  onGoHome?: () => void;
}

// View modes for navigation flow
export type ViewMode = 'level-select' | 'folder-list' | 'passage-list' | 'practice' | 'completed';

// Legacy view state (kept for compatibility)
export type ViewState =
  | { type: 'select' }
  | { type: 'practice'; passage: ReadingPassage };
