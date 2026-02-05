// Custom hook for keyboard navigation

import { useEffect } from 'react';
import type { ViewMode } from './types';

interface UseKeyboardNavigationProps {
  viewMode: ViewMode;
  currentSlideIndex: number;
  totalSlides: number;
  blankScreen: 'black' | 'white' | null;
  showJumpDialog: boolean;
  showLaser: boolean;
  showNotes: boolean;
  showHelp: boolean;
  showNextPreview: boolean;
  isAdmin: boolean;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onGoToSlide: (index: number, direction: 'next' | 'prev') => void;
  onToggleBlankScreen: (type: 'black' | 'white') => void;
  onClearBlankScreen: () => void;
  onShowJumpDialog: () => void;
  onCloseJumpDialog: () => void;
  onJumpToSlide: () => void;
  onEnterPresent: () => void;
  onExitPresent: () => void;
  onToggleGridView: () => void;
  onToggleLaser: () => void;
  onToggleNotes: () => void;
  onToggleHelp: () => void;
  onToggleNextPreview: () => void;
  onBackToList: () => void;
}

export function useKeyboardNavigation({
  viewMode,
  totalSlides,
  blankScreen,
  showJumpDialog,
  showLaser,
  showNotes,
  showHelp,
  showNextPreview,
  isAdmin,
  onNextSlide,
  onPrevSlide,
  onGoToSlide,
  onToggleBlankScreen,
  onClearBlankScreen,
  onShowJumpDialog,
  onCloseJumpDialog,
  onJumpToSlide,
  onEnterPresent,
  onExitPresent,
  onToggleGridView,
  onToggleLaser,
  onToggleNotes,
  onToggleHelp,
  onToggleNextPreview,
  onBackToList,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'levels' || viewMode === 'folders' || viewMode === 'lectures') return;

      if (showJumpDialog) {
        if (e.key === 'Escape') onCloseJumpDialog();
        else if (e.key === 'Enter') onJumpToSlide();
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
        case 'n':
        case 'N':
          e.preventDefault();
          if (blankScreen) onClearBlankScreen();
          else onNextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
        case 'p':
        case 'P':
          e.preventDefault();
          if (blankScreen) onClearBlankScreen();
          else onPrevSlide();
          break;
        case 'Escape':
          if (blankScreen) onClearBlankScreen();
          else if (viewMode === 'present') onExitPresent();
          else if (viewMode === 'grid') onToggleGridView();
          else onBackToList();
          break;
        case 'f':
        case 'F':
          if (viewMode === 'view' || viewMode === 'grid') onEnterPresent();
          break;
        case 'b':
        case 'B':
        case '.':
          e.preventDefault();
          onToggleBlankScreen('black');
          break;
        case 'w':
        case 'W':
        case ',':
          e.preventDefault();
          onToggleBlankScreen('white');
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          onShowJumpDialog();
          break;
        case 'Home':
          e.preventDefault();
          onGoToSlide(0, 'prev');
          break;
        case 'End':
          e.preventDefault();
          onGoToSlide(totalSlides - 1, 'next');
          break;
        case 'o':
        case 'O':
          e.preventDefault();
          if (viewMode !== 'present') onToggleGridView();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          if (viewMode === 'present') onToggleLaser();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          if (isAdmin && (viewMode === 'present' || viewMode === 'view')) onToggleNotes();
          break;
        case 'h':
        case 'H':
        case '?':
          e.preventDefault();
          onToggleHelp();
          break;
        case 'v':
        case 'V':
          e.preventDefault();
          if (viewMode === 'present') onToggleNextPreview();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    totalSlides,
    blankScreen,
    showJumpDialog,
    showLaser,
    showNotes,
    showHelp,
    showNextPreview,
    isAdmin,
    onNextSlide,
    onPrevSlide,
    onGoToSlide,
    onToggleBlankScreen,
    onClearBlankScreen,
    onShowJumpDialog,
    onCloseJumpDialog,
    onJumpToSlide,
    onEnterPresent,
    onExitPresent,
    onToggleGridView,
    onToggleLaser,
    onToggleNotes,
    onToggleHelp,
    onToggleNextPreview,
    onBackToList,
  ]);
}
