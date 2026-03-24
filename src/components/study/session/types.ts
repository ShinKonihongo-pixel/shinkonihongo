// Type definitions for study session components
import type { Flashcard, JLPTLevel, MemorizationStatus } from '../../../types/flashcard';
import type { AppSettings } from '../../../hooks/use-settings';
import type { NotebookHook } from '../level-lesson-selector/types';

export interface StudySessionProps {
  currentCard: Flashcard | undefined;
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onSetMemorization: (status: MemorizationStatus) => void;
  onResetAll: () => void;
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  onShuffle: () => void;
  onResetOrder: () => void;
  isShuffled: boolean;
  clickCount: number;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  settings: AppSettings;
  onBack?: () => void;
  selectedLevel?: JLPTLevel;
  frontFontSize?: number;
  onFrontFontSizeChange?: (size: number) => void;
  onSettingsChange?: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  notebookHook?: NotebookHook;
}

export interface StudySettingsModalProps {
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  frontFontSize?: number;
  onFrontFontSizeChange?: (size: number) => void;
  settings: AppSettings;
  onSettingsChange?: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onClose: () => void;
  isMobile: boolean;
}
