// Lecture Editor Types

import type { SlideFormData, SlideElement, AdminNote, LectureFormData } from '../../../types/lecture';
import type { JLPTLevel } from '../../../types/flashcard';

export interface LectureEditorPageProps {
  lectureId?: string;
  initialFolderId?: string;
  initialLevel?: JLPTLevel;
  onBack: () => void;
}

export interface LectureFormState {
  title: string;
  description: string;
  coverImage: string;
  jlptLevel: JLPTLevel;
  folderId?: string;
  isPublished: boolean;
}

export interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: ResizeHandle | null;
  startX: number;
  startY: number;
  startPosition: { x: number; y: number; width: number; height: number };
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export interface TextSelection {
  elementId: string;
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface DeleteSlideConfirm {
  index: number;
}

// Use same RibbonTab type as editor-types
export type RibbonTab = 'home' | 'insert' | 'design' | 'transitions';

// Re-export commonly used types
export type { SlideFormData, SlideElement, AdminNote, LectureFormData };
