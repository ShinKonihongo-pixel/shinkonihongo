// Main playback controls

import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import type { RepeatMode } from './types';

interface PlayerControlsProps {
  isPlaying: boolean;
  isShuffling: boolean;
  repeatMode: RepeatMode;
  onPlayPause: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export function PlayerControls({
  isPlaying,
  isShuffling,
  repeatMode,
  onPlayPause,
  onPrevTrack,
  onNextTrack,
  onToggleShuffle,
  onToggleRepeat,
}: PlayerControlsProps) {
  return (
    <div className="fp-controls">
      <button
        className={`fp-btn fp-btn-control fp-btn-shuffle ${isShuffling ? 'active' : ''}`}
        onClick={onToggleShuffle}
        title={isShuffling ? 'Tắt phát ngẫu nhiên' : 'Phát ngẫu nhiên'}
      >
        <Shuffle size={16} />
      </button>
      <button
        className="fp-btn fp-btn-control"
        onClick={onPrevTrack}
        title="Bài trước (Ctrl+←)"
      >
        <SkipBack size={18} />
      </button>
      <button
        className={`fp-btn fp-btn-play ${isPlaying ? 'playing' : ''}`}
        onClick={onPlayPause}
        title={isPlaying ? 'Tạm dừng (Space)' : 'Phát (Space)'}
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>
      <button
        className="fp-btn fp-btn-control"
        onClick={onNextTrack}
        title="Bài tiếp (Ctrl+→)"
      >
        <SkipForward size={18} />
      </button>
      <button
        className={`fp-btn fp-btn-control fp-btn-repeat ${repeatMode !== 'none' ? 'active' : ''}`}
        onClick={onToggleRepeat}
        title={repeatMode === 'none' ? 'Lặp lại tất cả' : repeatMode === 'all' ? 'Lặp lại một bài' : 'Tắt lặp lại'}
      >
        <Repeat size={16} />
        {repeatMode === 'one' && <span className="fp-repeat-one">1</span>}
      </button>
    </div>
  );
}
