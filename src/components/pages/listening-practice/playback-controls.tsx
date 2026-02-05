// Playback Controls Component
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLooping: boolean;
  isShuffled: boolean;
  disabled?: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
}

export function PlaybackControls({
  isPlaying,
  isLooping,
  isShuffled,
  disabled = false,
  onTogglePlay,
  onPrevious,
  onNext,
  onToggleLoop,
  onToggleShuffle,
}: PlaybackControlsProps) {
  return (
    <div className="playback-controls">
      <button className="control-btn" onClick={onPrevious}>
        <SkipBack size={24} />
      </button>
      <button className="control-btn play-btn" onClick={onTogglePlay} disabled={disabled}>
        {isPlaying ? <Pause size={32} /> : <Play size={32} />}
      </button>
      <button className="control-btn" onClick={onNext}>
        <SkipForward size={24} />
      </button>
      <button
        className={`control-btn ${isLooping ? 'active' : ''}`}
        onClick={onToggleLoop}
      >
        <Repeat size={20} />
      </button>
      <button
        className={`control-btn ${isShuffled ? 'active' : ''}`}
        onClick={onToggleShuffle}
      >
        <Shuffle size={20} />
      </button>
    </div>
  );
}
