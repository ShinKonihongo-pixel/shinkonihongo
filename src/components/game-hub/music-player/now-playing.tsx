// Now playing display with album art

import { MUSIC_CATEGORY_LABELS, type MusicTrack } from '../../../hooks/use-game-sounds';

interface NowPlayingProps {
  track: MusicTrack;
  isPlaying: boolean;
}

export function NowPlaying({ track, isPlaying }: NowPlayingProps) {
  return (
    <div className="fp-now-playing">
      <div className={`fp-album-art ${isPlaying ? 'playing' : ''}`}>
        <span className="fp-album-emoji">{track.emoji}</span>
        {/* Vinyl grooves effect */}
        <div className="fp-vinyl-grooves" />
        {/* Spinning animation overlay */}
        {isPlaying && <div className="fp-spin-overlay" />}
      </div>
      <div className="fp-track-details">
        <span className="fp-track-name">{track.name}</span>
        <span className="fp-track-category">
          {MUSIC_CATEGORY_LABELS[track.category]}
        </span>
      </div>
      {/* Equalizer visualization */}
      {isPlaying && (
        <div className="fp-equalizer">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="fp-eq-bar" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}
