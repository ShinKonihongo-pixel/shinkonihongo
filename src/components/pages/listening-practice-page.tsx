// Listening Practice Page - Firebase audio-based player
// Nav: level-select → lesson-select → type-select → audio-player

import { useState, useRef } from 'react';
import {
  ChevronLeft, Headphones, Play, Pause, SkipBack, SkipForward,
  Repeat, BookOpen, MessageCircle, FileText, Layers, ChevronRight, Music
} from 'lucide-react';
import { useListening, LISTENING_LESSONS, LISTENING_LESSON_TYPES } from '../../hooks/use-listening';
import { JLPTLevelSelector, LEVEL_THEMES } from '../ui/jlpt-level-selector';
import type { JLPTLevel } from '../../types/flashcard';
import type { ListeningAudio, ListeningLessonType } from '../../types/listening';

type ViewMode = 'level-select' | 'lesson-select' | 'type-select' | 'audio-player';

const TYPE_ICONS: Record<ListeningLessonType, typeof BookOpen> = {
  practice: BookOpen,
  conversation: MessageCircle,
  reading: FileText,
  other: Layers,
};

const TYPE_THEMES: Record<ListeningLessonType, { gradient: string; glow: string }> = {
  practice: { gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', glow: 'rgba(34, 197, 94, 0.4)' },
  conversation: { gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', glow: 'rgba(236, 72, 153, 0.4)' },
  reading: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.4)' },
  other: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.4)' },
};

export function ListeningPracticePage() {
  const {
    audios, folders, loading,
    getFoldersByLevelLessonAndType, getAudiosByFolder, getAudioUrl, getCountByLevel,
  } = useListening();

  const [viewMode, setViewMode] = useState<ViewMode>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<ListeningLessonType | null>(null);

  // Audio player state
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get audios for current selection
  const getCurrentAudios = (): ListeningAudio[] => {
    if (!selectedLevel || selectedLesson === null || !selectedType) return [];
    const typeFolders = getFoldersByLevelLessonAndType(selectedLevel, selectedLesson, selectedType);
    return typeFolders.flatMap(f => getAudiosByFolder(f.id));
  };

  const currentAudios = getCurrentAudios();
  const currentAudio = currentAudios[currentAudioIndex] || null;

  // Get audio count for a lesson type
  const getCountByLessonType = (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => {
    const typeFolders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
    return typeFolders.reduce((sum, f) => sum + getAudiosByFolder(f.id).length, 0);
  };

  // Get total audio count for a lesson
  const getCountByLesson = (level: JLPTLevel, lessonNumber: number) => {
    return LISTENING_LESSON_TYPES.reduce((sum, lt) => {
      return sum + getCountByLessonType(level, lessonNumber, lt.value);
    }, 0);
  };

  // Get lesson numbers for level
  const getLessonNumbers = (level: JLPTLevel): number[] => {
    const config = LISTENING_LESSONS[level];
    if (!config) return [];
    const numbers: number[] = [];
    for (let i = config.start; i <= config.end; i++) numbers.push(i);
    return numbers;
  };

  // Count by level for level selector
  const countByLevel: Record<JLPTLevel, number> = {
    BT: 0,
    N5: getCountByLevel('N5'),
    N4: getCountByLevel('N4'),
    N3: getCountByLevel('N3'),
    N2: getCountByLevel('N2'),
    N1: getCountByLevel('N1'),
  };

  // Navigation
  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setViewMode('lesson-select');
  };

  const selectLesson = (lessonNumber: number) => {
    setSelectedLesson(lessonNumber);
    setViewMode('type-select');
  };

  const selectType = (lessonType: ListeningLessonType) => {
    setSelectedType(lessonType);
    setCurrentAudioIndex(0);
    setIsPlaying(false);
    setViewMode('audio-player');
  };

  const goBack = () => {
    if (viewMode === 'audio-player') {
      setViewMode('type-select');
      stopAudio();
    } else if (viewMode === 'type-select') {
      setViewMode('lesson-select');
    } else if (viewMode === 'lesson-select') {
      setViewMode('level-select');
      setSelectedLevel(null);
    }
  };

  // Audio controls
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const playAudio = async (audio: ListeningAudio) => {
    const url = await getAudioUrl(audio);
    if (url && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = async () => {
    if (!currentAudio) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current?.src) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        await playAudio(currentAudio);
      }
    }
  };

  const goToNext = () => {
    if (currentAudioIndex < currentAudios.length - 1) {
      const nextIdx = currentAudioIndex + 1;
      setCurrentAudioIndex(nextIdx);
      setCurrentTime(0);
      playAudio(currentAudios[nextIdx]);
    } else if (isLooping && currentAudios.length > 0) {
      setCurrentAudioIndex(0);
      setCurrentTime(0);
      playAudio(currentAudios[0]);
    }
  };

  const goToPrevious = () => {
    if (currentAudioIndex > 0) {
      const prevIdx = currentAudioIndex - 1;
      setCurrentAudioIndex(prevIdx);
      setCurrentTime(0);
      playAudio(currentAudios[prevIdx]);
    } else if (isLooping && currentAudios.length > 0) {
      const lastIdx = currentAudios.length - 1;
      setCurrentAudioIndex(lastIdx);
      setCurrentTime(0);
      playAudio(currentAudios[lastIdx]);
    }
  };

  const selectAudioByIndex = (idx: number) => {
    setCurrentAudioIndex(idx);
    setCurrentTime(0);
    playAudio(currentAudios[idx]);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    // Auto-advance
    if (currentAudioIndex < currentAudios.length - 1) {
      goToNext();
    } else if (isLooping) {
      setCurrentAudioIndex(0);
      setCurrentTime(0);
      playAudio(currentAudios[0]);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Suppress unused vars from hook
  void audios; void folders; void loading;

  // ===== LEVEL SELECT =====
  if (viewMode === 'level-select') {
    return (
      <div className="listening-practice-page">
        <JLPTLevelSelector
          title="Nghe Hiểu"
          subtitle="Chọn cấp độ JLPT để luyện nghe"
          icon={<Headphones size={32} />}
          countByLevel={countByLevel}
          countLabel="file"
          onSelectLevel={selectLevel}
        />
        <style>{practiceStyles}</style>
      </div>
    );
  }

  // ===== LESSON SELECT =====
  if (viewMode === 'lesson-select' && selectedLevel) {
    const theme = LEVEL_THEMES[selectedLevel];
    const lessonNumbers = getLessonNumbers(selectedLevel);

    return (
      <div className="listening-practice-page">
        <div className="practice-content">
          <div className="practice-header">
            <button className="btn-back" onClick={goBack}>
              <ChevronLeft size={20} />
            </button>
            <span className="current-level" style={{ background: theme.gradient }}>
              {selectedLevel}
            </span>
            <h2 className="page-title">Chọn bài học</h2>
          </div>

          {lessonNumbers.length === 0 ? (
            <div className="empty-state">
              <Music size={48} />
              <p>Chưa có bài học cho cấp độ này</p>
              <p className="hint">N3, N2, N1 sẽ được thêm sau</p>
            </div>
          ) : (
            <div className="lesson-grid">
              {lessonNumbers.map((num, idx) => {
                const count = getCountByLesson(selectedLevel, num);
                return (
                  <button
                    key={num}
                    className="lesson-card"
                    onClick={() => selectLesson(num)}
                    style={{
                      '--card-delay': `${Math.min(idx * 0.03, 0.5)}s`,
                      '--level-gradient': theme.gradient,
                      '--level-glow': theme.glow,
                    } as React.CSSProperties}
                  >
                    <span className="lesson-number">{num}</span>
                    <span className="lesson-label">Bài</span>
                    {count > 0 && <span className="lesson-count">{count} file</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <style>{practiceStyles}</style>
      </div>
    );
  }

  // ===== TYPE SELECT =====
  if (viewMode === 'type-select' && selectedLevel && selectedLesson !== null) {
    const theme = LEVEL_THEMES[selectedLevel];

    return (
      <div className="listening-practice-page">
        <div className="practice-content">
          <div className="practice-header">
            <button className="btn-back" onClick={goBack}>
              <ChevronLeft size={20} />
            </button>
            <span className="current-level" style={{ background: theme.gradient }}>
              {selectedLevel} - Bài {selectedLesson}
            </span>
            <h2 className="page-title">Chọn loại</h2>
          </div>

          <div className="type-grid">
            {LISTENING_LESSON_TYPES.map((type, idx) => {
              const typeTheme = TYPE_THEMES[type.value];
              const Icon = TYPE_ICONS[type.value];
              const count = getCountByLessonType(selectedLevel, selectedLesson, type.value);
              return (
                <button
                  key={type.value}
                  className="type-card"
                  onClick={() => selectType(type.value)}
                  style={{
                    '--card-delay': `${idx * 0.1}s`,
                    '--type-gradient': typeTheme.gradient,
                    '--type-glow': typeTheme.glow,
                  } as React.CSSProperties}
                >
                  <div className="type-icon-box">
                    <Icon size={24} />
                  </div>
                  <span className="type-name">{type.label}</span>
                  <span className="type-count">{count} file</span>
                  <ChevronRight size={18} className="type-arrow" />
                </button>
              );
            })}
          </div>
        </div>
        <style>{practiceStyles}</style>
      </div>
    );
  }

  // ===== AUDIO PLAYER =====
  const theme = selectedLevel ? LEVEL_THEMES[selectedLevel] : LEVEL_THEMES.N5;
  const typeLabel = LISTENING_LESSON_TYPES.find(t => t.value === selectedType)?.label || '';

  return (
    <div className="listening-practice-page">
      <div className="practice-content audio-player-mode">
        <div className="practice-header">
          <button className="btn-back" onClick={goBack}>
            <ChevronLeft size={20} />
          </button>
          <span className="current-level" style={{ background: theme.gradient }}>
            {selectedLevel} - Bài {selectedLesson}
          </span>
          <span className="current-type" style={{ background: TYPE_THEMES[selectedType || 'other'].gradient }}>
            {typeLabel}
          </span>
        </div>

        {/* Now playing */}
        {currentAudio ? (
          <div className="now-playing">
            <div className="now-playing-info">
              <h3>{currentAudio.title}</h3>
              {currentAudio.description && <p>{currentAudio.description}</p>}
              <span className="track-counter">{currentAudioIndex + 1} / {currentAudios.length}</span>
            </div>

            {/* Progress */}
            <div className="audio-progress">
              <span className="time">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="progress-slider"
              />
              <span className="time">{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="playback-controls">
              <button
                className={`control-btn ${isLooping ? 'active' : ''}`}
                onClick={() => setIsLooping(l => !l)}
              >
                <Repeat size={20} />
              </button>
              <button className="control-btn" onClick={goToPrevious}>
                <SkipBack size={20} />
              </button>
              <button className="control-btn play-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>
              <button className="control-btn" onClick={goToNext}>
                <SkipForward size={20} />
              </button>
              <div className="speed-indicator" onClick={() => handleSpeedChange(playbackSpeed >= 2 ? 0.5 : playbackSpeed + 0.25)}>
                {playbackSpeed}x
              </div>
            </div>

            {/* Speed buttons */}
            <div className="speed-buttons">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                  onClick={() => handleSpeedChange(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <Music size={48} />
            <p>Chưa có file nghe nào</p>
            <p className="hint">Thêm file nghe ở mục Quản lí</p>
          </div>
        )}

        {/* Audio list */}
        {currentAudios.length > 0 && (
          <div className="audio-track-list">
            <h4>Danh sách ({currentAudios.length})</h4>
            {currentAudios.map((audio, idx) => (
              <button
                key={audio.id}
                className={`track-item ${idx === currentAudioIndex ? 'active' : ''}`}
                onClick={() => selectAudioByIndex(idx)}
              >
                <span className="track-number">{idx + 1}</span>
                {idx === currentAudioIndex && isPlaying ? (
                  <Pause size={16} className="track-play-icon" />
                ) : (
                  <Play size={16} className="track-play-icon" />
                )}
                <div className="track-info">
                  <span className="track-title">{audio.title}</span>
                  {audio.description && <span className="track-desc">{audio.description}</span>}
                </div>
                {audio.duration > 0 && (
                  <span className="track-duration">{formatTime(audio.duration)}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <style>{practiceStyles}</style>
    </div>
  );
}

const practiceStyles = `
  .listening-practice-page {
    min-height: calc(100vh - 60px);
    max-height: calc(100vh - 60px);
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .listening-practice-page .jlpt-level-selector {
    min-height: calc(100vh - 60px);
    max-height: calc(100vh - 60px);
  }

  .practice-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 1rem;
  }

  .practice-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-shrink: 0;
  }

  .btn-back {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .page-title {
    flex: 1;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
  }

  .current-level, .current-type {
    display: flex;
    align-items: center;
    padding: 0.4rem 0.85rem;
    border-radius: 10px;
    font-weight: 600;
    color: white;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  /* Lesson grid */
  .lesson-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 0.65rem;
  }

  @keyframes cardAppear {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .lesson-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.85rem 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: cardAppear 0.4s ease backwards;
    animation-delay: var(--card-delay);
  }

  .lesson-card:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px var(--level-glow, rgba(139, 92, 246, 0.2));
  }

  .lesson-number {
    font-size: 1.15rem;
    font-weight: 700;
    background: var(--level-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .lesson-label {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
  }

  .lesson-count {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Type grid */
  .type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }

  .type-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: cardAppear 0.4s ease backwards;
    animation-delay: var(--card-delay);
    overflow: hidden;
  }

  .type-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3), 0 0 30px var(--type-glow);
  }

  .type-card:hover .type-arrow {
    color: white;
    transform: translateY(-50%) translateX(3px);
  }

  .type-icon-box {
    width: 52px;
    height: 52px;
    background: var(--type-gradient);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 6px 20px var(--type-glow);
  }

  .type-name {
    font-size: 1.05rem;
    font-weight: 600;
    color: white;
  }

  .type-count {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .type-arrow {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }

  /* Audio player */
  .audio-player-mode {
    gap: 0;
  }

  .now-playing {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    margin-bottom: 1rem;
  }

  .now-playing-info {
    text-align: center;
  }

  .now-playing-info h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  .now-playing-info p {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .track-counter {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 0.25rem;
    display: inline-block;
  }

  .audio-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .progress-slider {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    cursor: pointer;
    accent-color: #8b5cf6;
  }

  .time {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    min-width: 40px;
    text-align: center;
  }

  .playback-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
  }

  .control-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.8);
  }

  .control-btn:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .control-btn.active {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-color: transparent;
    color: white;
  }

  .control-btn.play-btn {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 8px 28px rgba(139, 92, 246, 0.4);
  }

  .control-btn.play-btn:hover { transform: scale(1.05); }

  .speed-indicator {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: #c4b5fd;
    cursor: pointer;
    transition: all 0.2s;
  }

  .speed-indicator:hover {
    border-color: rgba(139, 92, 246, 0.5);
    background: rgba(139, 92, 246, 0.15);
  }

  .speed-buttons {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
  }

  .speed-btn {
    padding: 0.4rem 0.65rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s;
  }

  .speed-btn.active {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-color: transparent;
    color: white;
  }

  .speed-btn:hover:not(.active) {
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }

  /* Audio track list */
  .audio-track-list {
    flex: 1;
    min-height: 0;
  }

  .audio-track-list h4 {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
  }

  .track-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0.35rem;
    text-align: left;
    color: rgba(255, 255, 255, 0.7);
  }

  .track-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
    color: white;
  }

  .track-item.active {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.3);
    color: white;
  }

  .track-number {
    width: 24px;
    text-align: center;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
  }

  .track-item.active .track-number {
    color: #c4b5fd;
  }

  .track-play-icon {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.4);
  }

  .track-item.active .track-play-icon {
    color: #c4b5fd;
  }

  .track-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .track-title {
    font-size: 0.85rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .track-desc {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .track-duration {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-state svg { margin-bottom: 1rem; opacity: 0.5; }
  .empty-state .hint { font-size: 0.875rem; margin-top: 0.5rem; }

  @media (max-width: 640px) {
    .practice-content { padding: 0.65rem; }
    .practice-header { gap: 0.5rem; margin-bottom: 1rem; }
    .lesson-grid { grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 0.5rem; }
    .lesson-card { padding: 0.65rem 0.35rem; }
    .type-grid { grid-template-columns: repeat(2, 1fr); gap: 0.65rem; }
    .type-card { padding: 1rem; }
    .now-playing { padding: 1rem; }
    .now-playing-info h3 { font-size: 1.05rem; }
    .playback-controls { gap: 0.5rem; }
    .control-btn { width: 42px; height: 42px; }
    .control-btn.play-btn { width: 56px; height: 56px; }
    .speed-indicator { width: 42px; height: 42px; font-size: 0.7rem; }
  }
`;
