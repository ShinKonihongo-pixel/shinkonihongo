// Floating Music Player - Shows during game play
// Allows users to control background music without leaving the game

import { useState, useMemo } from 'react';
import {
  Music,
  Music2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { useGameSounds, MUSIC_TRACKS, type MusicTrack } from '../../hooks/use-game-sounds';

interface FloatingMusicPlayerProps {
  onClose?: () => void;
}

export function FloatingMusicPlayer({ onClose }: FloatingMusicPlayerProps) {
  const {
    settings,
    updateSettings,
    startMusic,
    stopMusic,
    isMusicPlaying,
    allTracks,
  } = useGameSounds();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showTrackList, setShowTrackList] = useState(false);

  // Get current track info
  const selectedTrack = useMemo(() => {
    return allTracks.find(t => t.id === settings.musicTrack) || MUSIC_TRACKS[0];
  }, [allTracks, settings.musicTrack]);

  // Get track index for next/previous
  const currentTrackIndex = useMemo(() => {
    return allTracks.findIndex(t => t.id === settings.musicTrack);
  }, [allTracks, settings.musicTrack]);

  // Toggle play/pause
  const handlePlayPause = () => {
    if (isMusicPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  };

  // Next track
  const handleNextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % allTracks.length;
    const wasPlaying = isMusicPlaying;
    if (wasPlaying) stopMusic();
    updateSettings({ musicTrack: allTracks[nextIndex].id });
    // Auto-play if was playing
    setTimeout(() => {
      if (wasPlaying) startMusic();
    }, 100);
  };

  // Previous track
  const handlePrevTrack = () => {
    const prevIndex = currentTrackIndex === 0 ? allTracks.length - 1 : currentTrackIndex - 1;
    const wasPlaying = isMusicPlaying;
    if (wasPlaying) stopMusic();
    updateSettings({ musicTrack: allTracks[prevIndex].id });
    setTimeout(() => {
      if (wasPlaying) startMusic();
    }, 100);
  };

  // Select specific track
  const handleSelectTrack = (track: MusicTrack) => {
    const wasPlaying = isMusicPlaying;
    if (wasPlaying) stopMusic();
    updateSettings({ musicTrack: track.id });
    setShowTrackList(false);
    setTimeout(() => {
      if (wasPlaying) startMusic();
    }, 100);
  };

  // Toggle mute
  const handleToggleMute = () => {
    updateSettings({ musicEnabled: !settings.musicEnabled });
    if (settings.musicEnabled && isMusicPlaying) {
      stopMusic();
    }
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ musicVolume: parseInt(e.target.value, 10) });
  };

  // Minimized view - just show icon and play state
  if (!isExpanded) {
    return (
      <div className="floating-player floating-player-mini">
        <button
          className={`fp-mini-btn ${isMusicPlaying ? 'playing' : ''}`}
          onClick={() => setIsExpanded(true)}
          title="Mở trình phát nhạc"
        >
          {isMusicPlaying ? <Music2 size={20} /> : <Music size={20} />}
          {isMusicPlaying && <span className="fp-mini-pulse" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`floating-player ${showTrackList ? 'fp-expanded' : ''}`}>
      {/* Header */}
      <div className="fp-header">
        <div className="fp-title">
          <Music size={16} />
          <span>Nhạc nền</span>
        </div>
        <div className="fp-header-actions">
          <button
            className="fp-btn fp-btn-mini"
            onClick={() => setIsExpanded(false)}
            title="Thu nhỏ"
          >
            <ChevronDown size={16} />
          </button>
          {onClose && (
            <button
              className="fp-btn fp-btn-mini fp-btn-close"
              onClick={onClose}
              title="Đóng"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Current Track Display */}
      <div className="fp-track-display" onClick={() => setShowTrackList(!showTrackList)}>
        <span className="fp-track-emoji">{selectedTrack.emoji}</span>
        <div className="fp-track-info">
          <span className="fp-track-name">{selectedTrack.name}</span>
          <span className="fp-track-status">
            {isMusicPlaying ? '▶ Đang phát' : '⏸ Đã tạm dừng'}
          </span>
        </div>
        <ChevronUp
          size={16}
          className={`fp-track-expand ${showTrackList ? 'rotated' : ''}`}
        />
      </div>

      {/* Track List (expandable) */}
      {showTrackList && (
        <div className="fp-track-list">
          {allTracks.slice(0, 12).map(track => (
            <button
              key={track.id}
              className={`fp-track-item ${track.id === settings.musicTrack ? 'active' : ''}`}
              onClick={() => handleSelectTrack(track)}
            >
              <span className="fp-track-item-emoji">{track.emoji}</span>
              <span className="fp-track-item-name">{track.name}</span>
              {track.id === settings.musicTrack && isMusicPlaying && (
                <span className="fp-track-playing">♪</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="fp-controls">
        <button
          className="fp-btn fp-btn-control"
          onClick={handlePrevTrack}
          title="Bài trước"
        >
          <SkipBack size={18} />
        </button>
        <button
          className={`fp-btn fp-btn-play ${isMusicPlaying ? 'playing' : ''}`}
          onClick={handlePlayPause}
          title={isMusicPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isMusicPlaying ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button
          className="fp-btn fp-btn-control"
          onClick={handleNextTrack}
          title="Bài tiếp"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Volume Slider */}
      <div className="fp-volume">
        <button
          className="fp-btn fp-btn-mini"
          onClick={handleToggleMute}
          title={settings.musicEnabled ? 'Tắt tiếng' : 'Bật tiếng'}
        >
          {settings.musicEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.musicVolume}
          onChange={handleVolumeChange}
          className="fp-volume-slider"
          disabled={!settings.musicEnabled}
        />
        <span className="fp-volume-value">{settings.musicVolume}%</span>
      </div>
    </div>
  );
}
