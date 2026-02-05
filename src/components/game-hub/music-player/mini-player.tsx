// Mini floating player view with visualizer

import { Music, Play, Pause, Disc3 } from 'lucide-react';

interface MiniPlayerProps {
  isMusicPlaying: boolean;
  isHovering: boolean;
  onExpand: () => void;
  onPlayPause: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function MiniPlayer({
  isMusicPlaying,
  isHovering,
  onExpand,
  onPlayPause,
  onMouseEnter,
  onMouseLeave,
}: MiniPlayerProps) {
  return (
    <div
      className="floating-player floating-player-mini"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className={`fp-mini-btn ${isMusicPlaying ? 'playing' : ''}`}
        onClick={onExpand}
        title="Mở trình phát nhạc"
      >
        {/* Rotating disc when playing */}
        {isMusicPlaying ? (
          <Disc3 size={22} className="fp-disc-icon" />
        ) : (
          <Music size={20} />
        )}
        {/* Pulse ring animation */}
        {isMusicPlaying && (
          <>
            <span className="fp-mini-pulse" />
            <span className="fp-mini-pulse fp-mini-pulse-2" />
          </>
        )}
        {/* Audio bars visualizer */}
        {isMusicPlaying && (
          <div className="fp-mini-bars">
            <span className="fp-bar" />
            <span className="fp-bar" />
            <span className="fp-bar" />
          </div>
        )}
      </button>
      {/* Quick play/pause on hover */}
      {isHovering && (
        <button
          className="fp-mini-play-btn"
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause();
          }}
          title={isMusicPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isMusicPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
      )}
    </div>
  );
}
