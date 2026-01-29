// Game Sound Settings Panel - Audio and music configuration
// Extracted from settings-page.tsx for better maintainability

import { useState, useMemo, useRef } from 'react';
import { useGameSounds, MUSIC_CATEGORY_LABELS, type MusicCategory } from '../../../hooks/use-game-sounds';
import { Volume2, VolumeX, Music, Music2 } from 'lucide-react';

/**
 * Game Sound Settings Component
 * Manages sound effects and background music for games
 */
export function GameSoundSettings() {
  const {
    settings: soundSettings,
    updateSettings,
    playCorrect,
    playWrong,
    playVictory,
    playStart,
    startMusic,
    stopMusic,
    isMusicPlaying,
    currentTrack,
    addCustomTrack,
    removeCustomTrack,
    allTracks,
  } = useGameSounds();

  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customTrackName, setCustomTrackName] = useState('');
  const [customTrackUrl, setCustomTrackUrl] = useState('');
  const [customTrackEmoji, setCustomTrackEmoji] = useState('🎵');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current selected track info
  const selectedTrack = useMemo(() => {
    return allTracks.find(t => t.id === soundSettings.musicTrack);
  }, [allTracks, soundSettings.musicTrack]);

  // Group tracks by category
  const tracksByCategory = useMemo(() => {
    const categories: MusicCategory[] = ['epic', 'chill', 'action', 'fun', 'japanese', 'custom'];
    return categories.map(cat => ({
      category: cat,
      label: MUSIC_CATEGORY_LABELS[cat],
      tracks: allTracks.filter(t => t.category === cat),
    })).filter(g => g.tracks.length > 0);
  }, [allTracks]);

  const handleTestSound = (type: 'correct' | 'wrong' | 'victory' | 'start') => {
    switch (type) {
      case 'correct': playCorrect(); break;
      case 'wrong': playWrong(); break;
      case 'victory': playVictory(); break;
      case 'start': playStart(); break;
    }
  };

  const handleAddCustomTrack = () => {
    if (!customTrackName.trim() || !customTrackUrl.trim()) return;

    const trackId = `custom-${Date.now()}`;
    addCustomTrack({
      id: trackId,
      name: customTrackName.trim(),
      emoji: customTrackEmoji,
      url: customTrackUrl.trim(),
    });

    // Reset form
    resetCustomForm();
  };

  const resetCustomForm = () => {
    setCustomTrackName('');
    setCustomTrackUrl('');
    setCustomTrackEmoji('🎵');
    setUploadedFileName('');
    setUploadMode('url');
    setShowAddCustom(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|ogg|wav|webm|aac|m4a)$/i)) {
      alert('Chỉ hỗ trợ file âm thanh: MP3, OGG, WAV, WebM, AAC');
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn! Tối đa 10MB');
      return;
    }

    setUploadedFileName(file.name);

    // Auto-fill name from filename if empty
    if (!customTrackName.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setCustomTrackName(nameWithoutExt);
    }

    // Convert to data URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomTrackUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="settings-section sound-settings-section">
      <h3>
        <span className="section-icon">🔊</span>
        Âm thanh & Nhạc nền
      </h3>
      <p className="settings-description">Cài đặt hiệu ứng âm thanh và nhạc nền cho trò chơi</p>

      {/* Sound Effects Toggle */}
      <div className="setting-item">
        <label>
          {soundSettings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>Hiệu ứng âm thanh</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={soundSettings.soundEnabled}
            onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Sound Volume */}
      {soundSettings.soundEnabled && (
        <div className="setting-item">
          <label>Âm lượng hiệu ứng: {soundSettings.soundVolume}%</label>
          <div className="setting-control">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={soundSettings.soundVolume}
              onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
            />
            <span className="setting-value">{soundSettings.soundVolume}%</span>
          </div>
        </div>
      )}

      {/* Sound Test Buttons */}
      {soundSettings.soundEnabled && (
        <div className="sound-test-section">
          <label>Nghe thử:</label>
          <div className="sound-test-buttons">
            <button className="sound-test-btn correct" onClick={() => handleTestSound('correct')} title="Trả lời đúng">
              ✓ Đúng
            </button>
            <button className="sound-test-btn wrong" onClick={() => handleTestSound('wrong')} title="Trả lời sai">
              ✗ Sai
            </button>
            <button className="sound-test-btn victory" onClick={() => handleTestSound('victory')} title="Chiến thắng">
              🏆 Thắng
            </button>
            <button className="sound-test-btn start" onClick={() => handleTestSound('start')} title="Bắt đầu">
              🎮 Start
            </button>
          </div>
        </div>
      )}

      <div className="setting-divider"></div>

      {/* Background Music Toggle */}
      <div className="setting-item">
        <label>
          {soundSettings.musicEnabled ? <Music size={18} /> : <Music2 size={18} />}
          <span>Nhạc nền</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={soundSettings.musicEnabled}
            onChange={(e) => updateSettings({ musicEnabled: e.target.checked })}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Music Volume */}
      {soundSettings.musicEnabled && (
        <>
          <div className="setting-item">
            <label>Âm lượng nhạc: {soundSettings.musicVolume}%</label>
            <div className="setting-control">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={soundSettings.musicVolume}
                onChange={(e) => updateSettings({ musicVolume: Number(e.target.value) })}
              />
              <span className="setting-value">{soundSettings.musicVolume}%</span>
            </div>
          </div>

          {/* Current Track Display */}
          {selectedTrack && (
            <div className="music-current-track">
              <div className="current-track-info">
                <span className="track-emoji">{selectedTrack.emoji}</span>
                <div className="track-details">
                  <span className="track-name">{selectedTrack.name}</span>
                  <span className="track-category">{MUSIC_CATEGORY_LABELS[selectedTrack.category]}</span>
                </div>
              </div>
              {isMusicPlaying && currentTrack && (
                <div className="music-playing-badge">
                  <span className="music-bar"></span>
                  <span className="music-bar"></span>
                  <span className="music-bar"></span>
                  Đang phát
                </div>
              )}
            </div>
          )}

          {/* Music Track Selection Grid */}
          <div className="music-track-selector">
            <label>Chọn bản nhạc</label>
            <div className="music-categories">
              {tracksByCategory.map(group => (
                <div key={group.category} className="music-category-group">
                  <div className="category-header">{group.label}</div>
                  <div className="category-tracks">
                    {group.tracks.map(track => (
                      <button
                        key={track.id}
                        className={`track-btn ${soundSettings.musicTrack === track.id ? 'selected' : ''} ${track.url ? 'has-audio' : ''}`}
                        onClick={() => {
                          updateSettings({ musicTrack: track.id });
                          // Auto stop if playing different track
                          if (isMusicPlaying) {
                            stopMusic();
                          }
                        }}
                        title={track.url ? `${track.name} (Audio file)` : `${track.name} (Procedural)`}
                      >
                        <span className="track-emoji">{track.emoji}</span>
                        <span className="track-name">{track.name}</span>
                        {track.category === 'custom' && (
                          <button
                            className="track-remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCustomTrack(track.id);
                            }}
                            title="Xóa bản nhạc"
                          >
                            ×
                          </button>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Track */}
            <div className="add-custom-track-section">
              {!showAddCustom ? (
                <button className="add-custom-btn" onClick={() => setShowAddCustom(true)}>
                  ➕ Thêm nhạc tùy chỉnh
                </button>
              ) : (
                <div className="custom-track-form">
                  {/* Mode Toggle */}
                  <div className="upload-mode-toggle">
                    <button
                      className={`mode-btn ${uploadMode === 'url' ? 'active' : ''}`}
                      onClick={() => setUploadMode('url')}
                    >
                      🔗 Từ URL
                    </button>
                    <button
                      className={`mode-btn ${uploadMode === 'file' ? 'active' : ''}`}
                      onClick={() => setUploadMode('file')}
                    >
                      📁 Tải file lên
                    </button>
                  </div>

                  <div className="form-row">
                    <select
                      value={customTrackEmoji}
                      onChange={(e) => setCustomTrackEmoji(e.target.value)}
                      className="emoji-select"
                    >
                      {['🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎧', '📻', '💿', '🌟', '❤️', '🔥', '⚡', '🌈'].map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Tên bản nhạc"
                      value={customTrackName}
                      onChange={(e) => setCustomTrackName(e.target.value)}
                      className="custom-track-name-input"
                    />
                  </div>

                  {uploadMode === 'url' ? (
                    <input
                      type="url"
                      placeholder="URL nhạc (mp3, ogg, wav...)"
                      value={customTrackUrl}
                      onChange={(e) => setCustomTrackUrl(e.target.value)}
                      className="custom-track-url-input"
                    />
                  ) : (
                    <div className="file-upload-area">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.ogg,.wav,.webm,.aac,.m4a"
                        onChange={handleFileUpload}
                        className="file-input-hidden"
                        id="audio-file-input"
                      />
                      <label htmlFor="audio-file-input" className="file-upload-label">
                        {uploadedFileName ? (
                          <span className="file-selected">
                            <span className="file-icon">🎵</span>
                            <span className="file-name">{uploadedFileName}</span>
                            <span className="file-change">Đổi file</span>
                          </span>
                        ) : (
                          <span className="file-placeholder">
                            <span className="upload-icon">📤</span>
                            <span className="upload-text">Chọn file âm thanh</span>
                            <span className="upload-hint">MP3, OGG, WAV, WebM (tối đa 10MB)</span>
                          </span>
                        )}
                      </label>
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      className="btn-add"
                      onClick={handleAddCustomTrack}
                      disabled={!customTrackName.trim() || !customTrackUrl.trim()}
                    >
                      Thêm
                    </button>
                    <button className="btn-cancel" onClick={resetCustomForm}>
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Music Play/Stop Button */}
          <div className="music-control-section">
            <button
              className={`music-control-btn ${isMusicPlaying ? 'playing' : ''}`}
              onClick={isMusicPlaying ? stopMusic : startMusic}
            >
              {isMusicPlaying ? (
                <>⏹️ Dừng nhạc</>
              ) : (
                <>▶️ Nghe thử nhạc</>
              )}
            </button>
          </div>
        </>
      )}

      {/* Info note */}
      <div className="sound-info-note">
        <span className="info-icon">💡</span>
        <span>Nhạc nền sẽ tự động phát khi game bắt đầu. Bạn có thể thêm nhạc riêng từ URL hoặc tải file lên.</span>
      </div>
    </section>
  );
}
