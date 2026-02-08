// Type definitions for study session components
import type { Flashcard, JLPTLevel, MemorizationStatus, DifficultyLevel } from '../../../types/flashcard';
import type { AppSettings } from '../../../hooks/use-settings';

export interface StudySessionProps {
  currentCard: Flashcard | undefined;
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onSetMemorization: (status: MemorizationStatus) => void;
  onSetDifficulty: (level: DifficultyLevel) => void;
  onResetAll: () => void;
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  filterDifficulty: DifficultyLevel | 'all';
  onFilterDifficultyChange: (level: DifficultyLevel | 'all') => void;
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
  onSettingsChange?: (key: keyof AppSettings, value: any) => void;
}

export interface StudySettingsModalProps {
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  filterDifficulty: DifficultyLevel | 'all';
  onFilterDifficultyChange: (level: DifficultyLevel | 'all') => void;
  frontFontSize?: number;
  onFrontFontSizeChange?: (size: number) => void;
  settings: AppSettings;
  onSettingsChange?: (key: keyof AppSettings, value: any) => void;
  onClose: () => void;
  isMobile: boolean;
}
