// Keyboard shortcuts hook

import { useEffect } from 'react';

interface UsePlayerKeyboardProps {
  isExpanded: boolean;
  musicVolume: number;
  onPlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleMute: () => void;
  onCollapse: () => void;
}

export function usePlayerKeyboard({
  isExpanded,
  musicVolume,
  onPlayPause,
  onNextTrack,
  onPrevTrack,
  onVolumeUp,
  onVolumeDown,
  onToggleMute,
  onCollapse,
}: UsePlayerKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if player is expanded
      if (!isExpanded) return;

      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) onNextTrack();
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) onPrevTrack();
          break;
        case 'ArrowUp':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onVolumeUp();
          }
          break;
        case 'ArrowDown':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onVolumeDown();
          }
          break;
        case 'm':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onToggleMute();
          }
          break;
        case 'Escape':
          onCollapse();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, musicVolume, onPlayPause, onNextTrack, onPrevTrack, onVolumeUp, onVolumeDown, onToggleMute, onCollapse]);
}
