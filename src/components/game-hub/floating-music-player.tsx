// Floating Music Player - Premium game background music controller
// Professional Spotify-like interface with visualizer and advanced controls

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  ChevronUp,
  ChevronDown,
  X,
  Shuffle,
  Repeat,
  ListMusic,
  Disc3,
  Sparkles,
  Plus,
  Trash2,
  Link,
  FileAudio,
  ExternalLink,
} from 'lucide-react';
import {
  useGameSounds,
  MUSIC_TRACKS,
  MUSIC_CATEGORY_LABELS,
  type MusicTrack,
  type MusicCategory,
} from '../../hooks/use-game-sounds';

// Popular free music sources
const MUSIC_SOURCES = [
  { name: 'Pixabay Music', url: 'https://pixabay.com/music/', icon: '🎵' },
  { name: 'Free Music Archive', url: 'https://freemusicarchive.org/', icon: '📚' },
  { name: 'Uppbeat', url: 'https://uppbeat.io/', icon: '🎧' },
  { name: 'Mixkit', url: 'https://mixkit.co/free-stock-music/', icon: '🎼' },
];

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
    addCustomTrack,
    removeCustomTrack,
  } = useGameSounds();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showTrackList, setShowTrackList] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [selectedCategory, setSelectedCategory] = useState<MusicCategory | 'all'>('all');
  const [isHovering, setIsHovering] = useState(false);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom track modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackEmoji, setNewTrackEmoji] = useState('🎵');
  const [urlError, setUrlError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Quick emoji picker for custom tracks
  const emojiOptions = ['🎵', '🎶', '🎼', '🎧', '🎤', '🎸', '🥁', '🎹', '🎺', '🎻', '🪕', '🎷', '💿', '📀', '🔊', '💫', '⭐', '🌟', '✨', '🌸', '🌺', '🌼', '🌻', '🔥', '❤️'];

  // Get current track info
  const selectedTrack = useMemo(() => {
    return allTracks.find(t => t.id === settings.musicTrack) || MUSIC_TRACKS[0];
  }, [allTracks, settings.musicTrack]);

  // Filter tracks by category
  const filteredTracks = useMemo(() => {
    if (selectedCategory === 'all') return allTracks;
    return allTracks.filter(t => t.category === selectedCategory);
  }, [allTracks, selectedCategory]);

  // Get track index for next/previous
  const currentTrackIndex = useMemo(() => {
    return filteredTracks.findIndex(t => t.id === settings.musicTrack);
  }, [filteredTracks, settings.musicTrack]);

  // Categories with counts
  const categories = useMemo(() => {
    const cats: { value: MusicCategory | 'all'; label: string; count: number }[] = [
      { value: 'all', label: '🎵 Tất cả', count: allTracks.length },
    ];
    const categoryKeys: MusicCategory[] = ['epic', 'chill', 'action', 'fun', 'japanese', 'custom'];
    categoryKeys.forEach(cat => {
      const count = allTracks.filter(t => t.category === cat).length;
      if (count > 0) {
        cats.push({ value: cat, label: MUSIC_CATEGORY_LABELS[cat], count });
      }
    });
    return cats;
  }, [allTracks]);

  // Count custom tracks
  const customTrackCount = settings.customMusicTracks.length;

  // Validate URL is audio
  const validateAudioUrl = useCallback(async (url: string): Promise<boolean> => {
    // Check basic URL format
    try {
      new URL(url);
    } catch {
      setUrlError('URL không hợp lệ');
      return false;
    }

    // Check common audio extensions
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];
    const hasAudioExt = audioExtensions.some(ext => url.toLowerCase().includes(ext));

    // Also accept common streaming/CDN patterns
    const isLikelyAudio = hasAudioExt ||
      url.includes('soundcloud.com') ||
      url.includes('pixabay.com/music') ||
      url.includes('mixkit.co') ||
      url.includes('freemusicarchive.org') ||
      url.includes('uppbeat.io');

    if (!isLikelyAudio) {
      setUrlError('URL phải là file âm thanh (.mp3, .wav, .ogg, .m4a)');
      return false;
    }

    setUrlError('');
    return true;
  }, []);

  // Handle add custom track
  const handleAddCustomTrack = useCallback(async () => {
    if (!newTrackUrl.trim() || !newTrackName.trim()) {
      setUrlError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsValidating(true);
    const isValid = await validateAudioUrl(newTrackUrl.trim());
    setIsValidating(false);

    if (!isValid) return;

    // Generate unique ID
    const trackId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    addCustomTrack({
      id: trackId,
      name: newTrackName.trim(),
      emoji: newTrackEmoji,
      url: newTrackUrl.trim(),
      duration: '?:??',
    });

    // Reset form
    setNewTrackUrl('');
    setNewTrackName('');
    setNewTrackEmoji('🎵');
    setShowAddModal(false);

    // Switch to custom category to show new track
    setSelectedCategory('custom');
  }, [newTrackUrl, newTrackName, newTrackEmoji, validateAudioUrl, addCustomTrack]);

  // Handle remove custom track
  const handleRemoveTrack = useCallback((trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Xóa bài hát này?')) {
      removeCustomTrack(trackId);
    }
  }, [removeCustomTrack]);

  // Auto-hide when not hovering (mini mode only)
  useEffect(() => {
    if (!isExpanded && !isHovering && isMusicPlaying) {
      autoHideTimerRef.current = setTimeout(() => {
        // Could add auto-hide logic here
      }, 5000);
    }
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, [isExpanded, isHovering, isMusicPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if player is expanded
      if (!isExpanded) return;

      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) handleNextTrack();
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) handlePrevTrack();
          break;
        case 'ArrowUp':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            updateSettings({ musicVolume: Math.min(100, settings.musicVolume + 10) });
          }
          break;
        case 'ArrowDown':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            updateSettings({ musicVolume: Math.max(0, settings.musicVolume - 10) });
          }
          break;
        case 'm':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleToggleMute();
          }
          break;
        case 'Escape':
          setIsExpanded(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, settings.musicVolume]);

  // Toggle play/pause
  const handlePlayPause = useCallback(() => {
    if (isMusicPlaying) {
      stopMusic();
    } else {
      // Enable music if disabled
      if (!settings.musicEnabled) {
        updateSettings({ musicEnabled: true });
      }
      startMusic();
    }
  }, [isMusicPlaying, settings.musicEnabled, startMusic, stopMusic, updateSettings]);

  // Get next track (considering shuffle)
  const getNextTrackIndex = useCallback(() => {
    if (isShuffling) {
      return Math.floor(Math.random() * filteredTracks.length);
    }
    return (currentTrackIndex + 1) % filteredTracks.length;
  }, [isShuffling, currentTrackIndex, filteredTracks.length]);

  // Next track
  const handleNextTrack = useCallback(() => {
    const nextIndex = getNextTrackIndex();
    const wasPlaying = isMusicPlaying;
    if (wasPlaying) stopMusic();
    updateSettings({ musicTrack: filteredTracks[nextIndex].id });
    setTimeout(() => {
      if (wasPlaying) startMusic();
    }, 100);
  }, [getNextTrackIndex, isMusicPlaying, filteredTracks, stopMusic, updateSettings, startMusic]);

  // Previous track
  const handlePrevTrack = useCallback(() => {
    const prevIndex = currentTrackIndex === 0 ? filteredTracks.length - 1 : currentTrackIndex - 1;
    const wasPlaying = isMusicPlaying;
    if (wasPlaying) stopMusic();
    updateSettings({ musicTrack: filteredTracks[prevIndex].id });
    setTimeout(() => {
      if (wasPlaying) startMusic();
    }, 100);
  }, [currentTrackIndex, filteredTracks, isMusicPlaying, stopMusic, updateSettings, startMusic]);

  // Select specific track
  const handleSelectTrack = useCallback((track: MusicTrack) => {
    const wasPlaying = isMusicPlaying;
    if (wasPlaying) stopMusic();
    updateSettings({ musicTrack: track.id });
    setShowTrackList(false);
    setTimeout(() => {
      if (wasPlaying || !isMusicPlaying) {
        if (!settings.musicEnabled) updateSettings({ musicEnabled: true });
        startMusic();
      }
    }, 100);
  }, [isMusicPlaying, settings.musicEnabled, stopMusic, updateSettings, startMusic]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    updateSettings({ musicEnabled: !settings.musicEnabled });
    if (settings.musicEnabled && isMusicPlaying) {
      stopMusic();
    }
  }, [settings.musicEnabled, isMusicPlaying, updateSettings, stopMusic]);

  // Volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value, 10);
    updateSettings({ musicVolume: vol });
    // Auto-enable if adjusting volume
    if (!settings.musicEnabled && vol > 0) {
      updateSettings({ musicEnabled: true });
    }
  }, [settings.musicEnabled, updateSettings]);

  // Quick volume presets
  const volumePresets = [
    { value: 25, label: '25%' },
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: 'Max' },
  ];

  // Get volume icon based on level
  const VolumeIcon = settings.musicVolume === 0 || !settings.musicEnabled
    ? VolumeX
    : settings.musicVolume < 50
      ? Volume1
      : Volume2;

  // Minimized view - compact floating button with visualizer
  if (!isExpanded) {
    return (
      <div
        className="floating-player floating-player-mini"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <button
          className={`fp-mini-btn ${isMusicPlaying ? 'playing' : ''}`}
          onClick={() => setIsExpanded(true)}
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
              handlePlayPause();
            }}
            title={isMusicPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isMusicPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`floating-player fp-pro ${showTrackList ? 'fp-expanded' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header with gradient accent */}
      <div className="fp-header">
        <div className="fp-title">
          <Sparkles size={14} className="fp-title-icon" />
          <span>Music Player</span>
        </div>
        <div className="fp-header-actions">
          <button
            className="fp-btn fp-btn-mini"
            onClick={() => setIsExpanded(false)}
            title="Thu nhỏ (Esc)"
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

      {/* Now Playing - Album art style */}
      <div className="fp-now-playing">
        <div className={`fp-album-art ${isMusicPlaying ? 'playing' : ''}`}>
          <span className="fp-album-emoji">{selectedTrack.emoji}</span>
          {/* Vinyl grooves effect */}
          <div className="fp-vinyl-grooves" />
          {/* Spinning animation overlay */}
          {isMusicPlaying && <div className="fp-spin-overlay" />}
        </div>
        <div className="fp-track-details">
          <span className="fp-track-name">{selectedTrack.name}</span>
          <span className="fp-track-category">
            {MUSIC_CATEGORY_LABELS[selectedTrack.category]}
          </span>
        </div>
        {/* Equalizer visualization */}
        {isMusicPlaying && (
          <div className="fp-equalizer">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="fp-eq-bar" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Main Controls */}
      <div className="fp-controls">
        <button
          className={`fp-btn fp-btn-control fp-btn-shuffle ${isShuffling ? 'active' : ''}`}
          onClick={() => setIsShuffling(!isShuffling)}
          title={isShuffling ? 'Tắt phát ngẫu nhiên' : 'Phát ngẫu nhiên'}
        >
          <Shuffle size={16} />
        </button>
        <button
          className="fp-btn fp-btn-control"
          onClick={handlePrevTrack}
          title="Bài trước (Ctrl+←)"
        >
          <SkipBack size={18} />
        </button>
        <button
          className={`fp-btn fp-btn-play ${isMusicPlaying ? 'playing' : ''}`}
          onClick={handlePlayPause}
          title={isMusicPlaying ? 'Tạm dừng (Space)' : 'Phát (Space)'}
        >
          {isMusicPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          className="fp-btn fp-btn-control"
          onClick={handleNextTrack}
          title="Bài tiếp (Ctrl+→)"
        >
          <SkipForward size={18} />
        </button>
        <button
          className={`fp-btn fp-btn-control fp-btn-repeat ${repeatMode !== 'none' ? 'active' : ''}`}
          onClick={() => setRepeatMode(prev =>
            prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
          )}
          title={repeatMode === 'none' ? 'Lặp lại tất cả' : repeatMode === 'all' ? 'Lặp lại một bài' : 'Tắt lặp lại'}
        >
          <Repeat size={16} />
          {repeatMode === 'one' && <span className="fp-repeat-one">1</span>}
        </button>
      </div>

      {/* Volume Control - Enhanced */}
      <div className="fp-volume">
        <button
          className="fp-btn fp-btn-mini"
          onClick={handleToggleMute}
          title={settings.musicEnabled ? 'Tắt tiếng (Ctrl+M)' : 'Bật tiếng (Ctrl+M)'}
        >
          <VolumeIcon size={16} />
        </button>
        <div className="fp-volume-track">
          <input
            type="range"
            min="0"
            max="100"
            value={settings.musicEnabled ? settings.musicVolume : 0}
            onChange={handleVolumeChange}
            className="fp-volume-slider"
          />
          <div
            className="fp-volume-fill"
            style={{ width: `${settings.musicEnabled ? settings.musicVolume : 0}%` }}
          />
        </div>
        <span className="fp-volume-value">{settings.musicEnabled ? settings.musicVolume : 0}%</span>
      </div>

      {/* Quick volume presets */}
      <div className="fp-volume-presets">
        {volumePresets.map(preset => (
          <button
            key={preset.value}
            className={`fp-preset-btn ${settings.musicVolume === preset.value ? 'active' : ''}`}
            onClick={() => updateSettings({ musicVolume: preset.value, musicEnabled: true })}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Track List Toggle & Add Custom */}
      <div className="fp-track-toggle">
        <button
          className={`fp-tracks-btn ${showTrackList ? 'active' : ''}`}
          onClick={() => setShowTrackList(!showTrackList)}
        >
          <ListMusic size={16} />
          <span>Danh sách phát</span>
          <ChevronUp size={14} className={`fp-toggle-icon ${showTrackList ? 'rotated' : ''}`} />
        </button>
        <button
          className="fp-add-btn"
          onClick={() => setShowAddModal(true)}
          title="Thêm nhạc tuỳ chỉnh"
        >
          <Plus size={16} />
          <span>Thêm nhạc</span>
        </button>
      </div>

      {/* Track List (expandable) */}
      {showTrackList && (
        <div className="fp-track-list">
          {/* Category filter */}
          <div className="fp-category-filter">
            {categories.map(cat => (
              <button
                key={cat.value}
                className={`fp-cat-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
                <span className="fp-cat-count">{cat.count}</span>
              </button>
            ))}
          </div>

          {/* Track items */}
          <div className="fp-tracks-scroll">
            {filteredTracks.map((track, index) => (
              <button
                key={track.id}
                className={`fp-track-item ${track.id === settings.musicTrack ? 'active' : ''} ${track.category === 'custom' ? 'custom' : ''}`}
                onClick={() => handleSelectTrack(track)}
              >
                <span className="fp-track-num">{index + 1}</span>
                <span className="fp-track-item-emoji">{track.emoji}</span>
                <div className="fp-track-item-info">
                  <span className="fp-track-item-name">{track.name}</span>
                  <span className="fp-track-item-cat">
                    {track.category === 'custom' && <Link size={10} className="fp-custom-icon" />}
                    {MUSIC_CATEGORY_LABELS[track.category]}
                  </span>
                </div>
                {track.id === settings.musicTrack && isMusicPlaying && (
                  <div className="fp-track-playing-indicator">
                    <span /><span /><span />
                  </div>
                )}
                {track.category === 'custom' && (
                  <button
                    className="fp-track-delete"
                    onClick={(e) => handleRemoveTrack(track.id, e)}
                    title="Xóa bài hát"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </button>
            ))}

            {/* Empty state for custom category */}
            {selectedCategory === 'custom' && customTrackCount === 0 && (
              <div className="fp-empty-custom">
                <FileAudio size={32} />
                <p>Chưa có nhạc tuỳ chỉnh</p>
                <button onClick={() => setShowAddModal(true)}>
                  <Plus size={14} />
                  Thêm nhạc ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="fp-shortcuts-hint">
        <span>Space: Play/Pause</span>
        <span>•</span>
        <span>Ctrl+←/→: Prev/Next</span>
      </div>

      {/* Add Custom Track Modal */}
      {showAddModal && (
        <div className="fp-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="fp-modal" onClick={e => e.stopPropagation()}>
            <div className="fp-modal-header">
              <h3>
                <Plus size={18} />
                Thêm nhạc tuỳ chỉnh
              </h3>
              <button className="fp-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="fp-modal-body">
              {/* Track name */}
              <div className="fp-form-group">
                <label>Tên bài hát</label>
                <input
                  type="text"
                  placeholder="Nhập tên bài hát..."
                  value={newTrackName}
                  onChange={e => setNewTrackName(e.target.value)}
                  maxLength={50}
                />
              </div>

              {/* Track URL */}
              <div className="fp-form-group">
                <label>
                  <Link size={14} />
                  URL nhạc (MP3, WAV, OGG...)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/music.mp3"
                  value={newTrackUrl}
                  onChange={e => {
                    setNewTrackUrl(e.target.value);
                    setUrlError('');
                  }}
                />
                {urlError && <span className="fp-error">{urlError}</span>}
              </div>

              {/* Emoji picker */}
              <div className="fp-form-group">
                <label>Biểu tượng</label>
                <div className="fp-emoji-picker">
                  {emojiOptions.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className={`fp-emoji-btn ${newTrackEmoji === emoji ? 'active' : ''}`}
                      onClick={() => setNewTrackEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Music sources */}
              <div className="fp-music-sources">
                <label>Nguồn nhạc miễn phí:</label>
                <div className="fp-sources-list">
                  {MUSIC_SOURCES.map(source => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fp-source-link"
                    >
                      <span>{source.icon}</span>
                      <span>{source.name}</span>
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="fp-modal-footer">
              <button
                className="fp-modal-cancel"
                onClick={() => setShowAddModal(false)}
              >
                Huỷ
              </button>
              <button
                className="fp-modal-submit"
                onClick={handleAddCustomTrack}
                disabled={!newTrackName.trim() || !newTrackUrl.trim() || isValidating}
              >
                {isValidating ? 'Đang kiểm tra...' : (
                  <>
                    <Plus size={16} />
                    Thêm nhạc
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
