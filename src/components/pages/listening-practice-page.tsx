// Listening Practice Page - Premium UI with glassmorphism design

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, Volume2, Headphones,
  Repeat, Shuffle, Upload, ChevronLeft, Sparkles,
  Eye, EyeOff, Settings, SkipBack, SkipForward, Check
} from 'lucide-react';
import type { DifficultyLevel, JLPTLevel, Lesson } from '../../types/flashcard';
import type { ListeningPracticePageProps, ViewMode } from './listening-practice/listening-practice-types';
import { JLPT_LEVELS, DIFFICULTY_OPTIONS } from './listening-practice/listening-practice-constants';

// Level theme configurations
const LEVEL_THEMES: Record<JLPTLevel, { gradient: string; glow: string; icon: string }> = {
  N5: { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16, 185, 129, 0.4)', icon: '🌱' },
  N4: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', glow: 'rgba(59, 130, 246, 0.4)', icon: '🎧' },
  N3: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.4)', icon: '🎵' },
  N2: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.4)', icon: '🎼' },
  N1: { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239, 68, 68, 0.4)', icon: '👑' },
};

export function ListeningPracticePage({
  cards,
  lessons,
  getLessonsByLevel,
  getChildLessons,
}: ListeningPracticePageProps) {
  // View & Level state
  const [viewMode, setViewMode] = useState<ViewMode>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);

  // Lesson selection state
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [showLessonPicker, setShowLessonPicker] = useState(false);

  // Difficulty filter
  const [selectedDifficulties, setSelectedDifficulties] = useState<(DifficultyLevel | 'all')[]>(['all']);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(true);
  const [showMeaning, setShowMeaning] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [repeatCount, setRepeatCount] = useState(1);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [delayBetweenWords, setDelayBetweenWords] = useState(2);

  // Custom audio state
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState('');
  const [abRepeatStart, setAbRepeatStart] = useState<number | null>(null);
  const [abRepeatEnd, setAbRepeatEnd] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get lessons for selected level with their children
  const levelLessons = useMemo(() => {
    if (!selectedLevel) return [];
    const parentLessons = getLessonsByLevel(selectedLevel);
    const allLessons: Lesson[] = [];

    parentLessons.forEach(parent => {
      allLessons.push(parent);
      const children = getChildLessons(parent.id);
      allLessons.push(...children);
    });

    return allLessons;
  }, [selectedLevel, getLessonsByLevel, getChildLessons]);

  // Get all lesson IDs for the level
  const allLevelLessonIds = useMemo(() => levelLessons.map(l => l.id), [levelLessons]);

  // Get filtered cards
  const filteredCards = useMemo(() => {
    if (!selectedLevel) return [];

    return cards.filter(card => {
      if (card.jlptLevel !== selectedLevel) return false;
      if (selectedLessonIds.length > 0 && !selectedLessonIds.includes(card.lessonId)) return false;
      if (!selectedDifficulties.includes('all') && !selectedDifficulties.includes(card.difficultyLevel)) return false;
      return true;
    });
  }, [cards, selectedLevel, selectedLessonIds, selectedDifficulties]);

  // Shuffled indices
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  useEffect(() => {
    if (isShuffled && filteredCards.length > 0) {
      const indices = Array.from({ length: filteredCards.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    } else {
      setShuffledIndices(Array.from({ length: filteredCards.length }, (_, i) => i));
    }
  }, [isShuffled, filteredCards.length]);

  const currentCard = filteredCards[shuffledIndices[currentIndex]] || null;

  // Get card count by level
  const getCardCountByLevel = (level: JLPTLevel) => cards.filter(c => c.jlptLevel === level).length;

  // Text-to-Speech
  const speakWord = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = playbackSpeed;

      utterance.onend = () => {
        setCurrentRepeat(prev => {
          const next = prev + 1;
          if (next < repeatCount) {
            setTimeout(() => speakWord(text), delayBetweenWords * 1000);
            return next;
          } else if (autoPlayNext && currentIndex < shuffledIndices.length - 1) {
            timeoutRef.current = setTimeout(() => {
              setCurrentRepeat(0);
              setCurrentIndex(i => i + 1);
            }, delayBetweenWords * 1000);
            return 0;
          } else if (autoPlayNext && isLooping && currentIndex === shuffledIndices.length - 1) {
            timeoutRef.current = setTimeout(() => {
              setCurrentRepeat(0);
              setCurrentIndex(0);
            }, delayBetweenWords * 1000);
            return 0;
          } else {
            setIsPlaying(false);
            return 0;
          }
        });
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [playbackSpeed, repeatCount, autoPlayNext, currentIndex, shuffledIndices.length, isLooping, delayBetweenWords]);

  // Play current word
  useEffect(() => {
    if (viewMode === 'vocabulary' && isPlaying && currentCard) {
      speakWord(currentCard.vocabulary);
    }
  }, [viewMode, isPlaying, currentCard, currentIndex, speakWord]);

  // Cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Select a level
  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setSelectedLessonIds([]);
    setCurrentIndex(0);
    setViewMode('vocabulary');
    setIsPlaying(false);
  };

  // Go back to level selection
  const goBackToLevelSelect = () => {
    setViewMode('level-select');
    setSelectedLevel(null);
    setIsPlaying(false);
    window.speechSynthesis?.cancel();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Toggle lesson selection
  const toggleLessonSelection = (lessonId: string) => {
    setSelectedLessonIds(prev => {
      if (prev.includes(lessonId)) return prev.filter(id => id !== lessonId);
      return [...prev, lessonId];
    });
    setCurrentIndex(0);
  };

  // Select/deselect all lessons
  const toggleSelectAllLessons = () => {
    if (selectedLessonIds.length === allLevelLessonIds.length) {
      setSelectedLessonIds([]);
    } else {
      setSelectedLessonIds([...allLevelLessonIds]);
    }
    setCurrentIndex(0);
  };

  // Difficulty toggle
  const toggleDifficulty = (diff: DifficultyLevel | 'all') => {
    if (diff === 'all') {
      setSelectedDifficulties(['all']);
    } else {
      setSelectedDifficulties(prev => {
        const filtered = prev.filter(d => d !== 'all');
        if (filtered.includes(diff)) {
          const next = filtered.filter(d => d !== diff);
          return next.length === 0 ? ['all'] : next;
        }
        return [...filtered, diff];
      });
    }
    setCurrentIndex(0);
  };

  // Playback controls
  const togglePlay = () => {
    if (viewMode === 'vocabulary') {
      if (isPlaying) {
        window.speechSynthesis?.cancel();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
      setIsPlaying(!isPlaying);
    } else if (viewMode === 'custom-audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const goToNext = () => {
    if (currentIndex < shuffledIndices.length - 1) {
      setCurrentIndex(i => i + 1);
      setCurrentRepeat(0);
    } else if (isLooping) {
      setCurrentIndex(0);
      setCurrentRepeat(0);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setCurrentRepeat(0);
    } else if (isLooping) {
      setCurrentIndex(shuffledIndices.length - 1);
      setCurrentRepeat(0);
    }
  };

  const shuffleCards = () => {
    setIsShuffled(s => !s);
    setCurrentIndex(0);
  };

  // Custom audio handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('audio/')) {
      alert('Vui lòng chọn file âm thanh');
      return;
    }
    setCustomAudioUrl(URL.createObjectURL(file));
    setCustomAudioName(file.name);
    setAbRepeatStart(null);
    setAbRepeatEnd(null);
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
      if (abRepeatEnd !== null && audioRef.current.currentTime >= abRepeatEnd) {
        audioRef.current.currentTime = abRepeatStart || 0;
      }
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) setAudioDuration(audioRef.current.duration);
  };

  const handleAudioEnded = () => {
    if (isLooping && audioRef.current) {
      audioRef.current.currentTime = abRepeatStart || 0;
      audioRef.current.play();
    } else {
      setIsPlaying(false);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get lesson name
  const getLessonName = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson?.name || '';
  };

  return (
    <div className="listening-practice-page">
      {/* Level Selection View */}
      {viewMode === 'level-select' && (
        <>
          {/* Premium Header */}
          <div className="premium-header">
            <div className="header-content">
              <div className="header-icon">
                <Headphones size={28} />
                <Sparkles className="sparkle sparkle-1" size={12} />
                <Sparkles className="sparkle sparkle-2" size={10} />
              </div>
              <div className="header-text">
                <h1>Luyện Nghe</h1>
                <p>Rèn luyện kỹ năng nghe tiếng Nhật</p>
              </div>
            </div>
          </div>

          <p className="selection-hint">Chọn cấp độ để bắt đầu luyện nghe</p>

          <div className="level-grid">
            {JLPT_LEVELS.map((level, idx) => {
              const theme = LEVEL_THEMES[level];
              const count = getCardCountByLevel(level);
              return (
                <button
                  key={level}
                  className="level-card"
                  onClick={() => selectLevel(level)}
                  style={{ '--card-delay': `${idx * 0.1}s`, '--level-gradient': theme.gradient, '--level-glow': theme.glow } as React.CSSProperties}
                >
                                    <span className="level-name">{level}</span>
                  <span className="level-count">{count} từ</span>
                  <div className="card-shine" />
                </button>
              );
            })}
          </div>

          {/* Custom Audio Option */}
          <div className="custom-audio-section">
            <button className="btn btn-glass" onClick={() => setViewMode('custom-audio')}>
              <Upload size={18} />
              Luyện nghe file audio
            </button>
          </div>
        </>
      )}

      {/* Vocabulary Mode */}
      {viewMode === 'vocabulary' && selectedLevel && (
        <div className="vocabulary-mode">
          {/* Header */}
          <div className="vocab-header">
            <button className="btn-back" onClick={goBackToLevelSelect}>
              <ChevronLeft size={20} />
            </button>
            <span className="current-level" style={{ background: LEVEL_THEMES[selectedLevel].gradient }}>
              {selectedLevel}
            </span>
            <button
              className={`btn-settings ${showLessonPicker ? 'active' : ''}`}
              onClick={() => setShowLessonPicker(s => !s)}
            >
              <Settings size={20} />
            </button>
          </div>

          {/* Lesson Picker */}
          {showLessonPicker && (
            <div className="lesson-picker">
              <div className="picker-header">
                <h4>Chọn bài học</h4>
                <button className="btn btn-sm" onClick={toggleSelectAllLessons}>
                  {selectedLessonIds.length === allLevelLessonIds.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              <div className="lesson-list">
                {getLessonsByLevel(selectedLevel).map(parentLesson => (
                  <div key={parentLesson.id} className="lesson-group">
                    <label className="lesson-item parent">
                      <input
                        type="checkbox"
                        checked={selectedLessonIds.length === 0 || selectedLessonIds.includes(parentLesson.id)}
                        onChange={() => toggleLessonSelection(parentLesson.id)}
                      />
                      <span>{parentLesson.name}</span>
                      <span className="count">({cards.filter(c => c.lessonId === parentLesson.id).length})</span>
                    </label>

                    {getChildLessons(parentLesson.id).map(child => (
                      <label key={child.id} className="lesson-item child">
                        <input
                          type="checkbox"
                          checked={selectedLessonIds.length === 0 || selectedLessonIds.includes(child.id)}
                          onChange={() => toggleLessonSelection(child.id)}
                        />
                        <span>{child.name}</span>
                        <span className="count">({cards.filter(c => c.lessonId === child.id).length})</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>

              {/* Difficulty Filter */}
              <div className="difficulty-filter">
                <label>Độ khó:</label>
                <div className="filter-buttons">
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`filter-btn ${selectedDifficulties.includes(opt.value) ? 'active' : ''}`}
                      onClick={() => toggleDifficulty(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary close-picker" onClick={() => setShowLessonPicker(false)}>
                <Check size={16} /> Xong ({filteredCards.length} từ)
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="vocab-stats">{filteredCards.length} từ vựng {selectedLessonIds.length > 0 && `(${selectedLessonIds.length} bài)`}</div>

          {/* Current Word Display */}
          {currentCard && (
            <div className="current-word-display">
              <div className="word-counter">
                {currentIndex + 1} / {filteredCards.length}
                {repeatCount > 1 && ` (lặp ${currentRepeat + 1}/${repeatCount})`}
              </div>

              <div className="word-card" style={{ '--level-glow': LEVEL_THEMES[selectedLevel].glow } as React.CSSProperties}>
                {showVocabulary && (
                  <>
                    <div className="vocabulary-text">{currentCard.vocabulary}</div>
                    {currentCard.kanji && <div className="kanji-text">{currentCard.kanji}</div>}
                  </>
                )}
                {showMeaning && (
                  <>
                    <div className="meaning-text">{currentCard.meaning}</div>
                    {currentCard.sinoVietnamese && <div className="sino-text">{currentCard.sinoVietnamese}</div>}
                  </>
                )}
                <div className="lesson-info">{getLessonName(currentCard.lessonId)}</div>
              </div>

              <div className="visibility-toggles">
                <button className={`toggle-btn ${showVocabulary ? 'active' : ''}`} onClick={() => setShowVocabulary(v => !v)}>
                  {showVocabulary ? <Eye size={18} /> : <EyeOff size={18} />} Từ
                </button>
                <button className={`toggle-btn ${showMeaning ? 'active' : ''}`} onClick={() => setShowMeaning(v => !v)}>
                  {showMeaning ? <Eye size={18} /> : <EyeOff size={18} />} Nghĩa
                </button>
              </div>
            </div>
          )}

          {filteredCards.length === 0 && (
            <div className="empty-state">
              <Volume2 size={48} />
              <p>Không có từ vựng nào.</p>
              <p className="hint">Hãy chọn bài học trong cài đặt.</p>
            </div>
          )}

          {/* Playback Controls */}
          <div className="playback-controls">
            <button className="control-btn" onClick={goToPrevious}><SkipBack size={24} /></button>
            <button className="control-btn play-btn" onClick={togglePlay} disabled={!currentCard}>
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button className="control-btn" onClick={goToNext}><SkipForward size={24} /></button>
            <button className={`control-btn ${isLooping ? 'active' : ''}`} onClick={() => setIsLooping(l => !l)}><Repeat size={20} /></button>
            <button className={`control-btn ${isShuffled ? 'active' : ''}`} onClick={shuffleCards}><Shuffle size={20} /></button>
            <button className={`control-btn ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(s => !s)}><Settings size={20} /></button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="settings-panel">
              <div className="setting-item">
                <label>Tốc độ:</label>
                <div className="speed-control">
                  <button onClick={() => setPlaybackSpeed(s => Math.max(0.5, s - 0.25))}>-</button>
                  <span>{playbackSpeed}x</span>
                  <button onClick={() => setPlaybackSpeed(s => Math.min(2, s + 0.25))}>+</button>
                </div>
              </div>
              <div className="setting-item">
                <label>Lặp mỗi từ:</label>
                <div className="repeat-control">
                  <button onClick={() => setRepeatCount(r => Math.max(1, r - 1))}>-</button>
                  <span>{repeatCount} lần</span>
                  <button onClick={() => setRepeatCount(r => Math.min(10, r + 1))}>+</button>
                </div>
              </div>
              <div className="setting-item">
                <label>Khoảng cách:</label>
                <div className="delay-control">
                  <button onClick={() => setDelayBetweenWords(d => Math.max(0.5, d - 0.5))}>-</button>
                  <span>{delayBetweenWords}s</span>
                  <button onClick={() => setDelayBetweenWords(d => Math.min(10, d + 0.5))}>+</button>
                </div>
              </div>
              <div className="setting-item checkbox">
                <label>
                  <input type="checkbox" checked={autoPlayNext} onChange={(e) => setAutoPlayNext(e.target.checked)} />
                  Tự động chuyển
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Audio Mode */}
      {viewMode === 'custom-audio' && (
        <div className="custom-audio-mode">
          <div className="vocab-header">
            <button className="btn-back" onClick={goBackToLevelSelect}>
              <ChevronLeft size={20} />
            </button>
            <span className="current-level audio-mode">
              <Upload size={18} /> File Audio
            </span>
          </div>

          <div className="upload-section">
            <input type="file" ref={fileInputRef} accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <button className="btn btn-primary upload-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} /> Chọn file
            </button>
            {customAudioName && <span className="file-name">{customAudioName}</span>}
          </div>

          {customAudioUrl && (
            <>
              <audio ref={audioRef} src={customAudioUrl} onTimeUpdate={handleAudioTimeUpdate} onLoadedMetadata={handleAudioLoadedMetadata} onEnded={handleAudioEnded} />

              <div className="audio-progress">
                <span className="time">{formatTime(audioCurrentTime)}</span>
                <input type="range" min={0} max={audioDuration || 100} value={audioCurrentTime} onChange={(e) => seekTo(parseFloat(e.target.value))} className="progress-slider" />
                <span className="time">{formatTime(audioDuration)}</span>
              </div>

              {(abRepeatStart !== null || abRepeatEnd !== null) && (
                <div className="ab-markers">
                  <span>A: {abRepeatStart !== null ? formatTime(abRepeatStart) : '--:--'}</span>
                  <span>B: {abRepeatEnd !== null ? formatTime(abRepeatEnd) : '--:--'}</span>
                </div>
              )}

              <div className="playback-controls">
                <button className="control-btn" onClick={() => seekTo(audioCurrentTime - 5)}><RotateCcw size={20} /></button>
                <button className="control-btn play-btn" onClick={togglePlay}>{isPlaying ? <Pause size={32} /> : <Play size={32} />}</button>
                <button className="control-btn" onClick={() => seekTo(audioCurrentTime + 5)}><RotateCcw size={20} style={{ transform: 'scaleX(-1)' }} /></button>
                <button className={`control-btn ${isLooping ? 'active' : ''}`} onClick={() => setIsLooping(l => !l)}><Repeat size={20} /></button>
              </div>

              <div className="ab-controls">
                <button className="btn btn-glass" onClick={() => setAbRepeatStart(audioCurrentTime)}>Đặt A</button>
                <button className="btn btn-glass" onClick={() => setAbRepeatEnd(audioCurrentTime)}>Đặt B</button>
                <button className="btn btn-glass" onClick={() => { setAbRepeatStart(null); setAbRepeatEnd(null); }} disabled={abRepeatStart === null && abRepeatEnd === null}>Xoá A-B</button>
              </div>

              <div className="speed-section">
                <label>Tốc độ:</label>
                <div className="speed-buttons">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button key={speed} className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`} onClick={() => { setPlaybackSpeed(speed); if (audioRef.current) audioRef.current.playbackRate = speed; }}>
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!customAudioUrl && (
            <div className="empty-state">
              <Volume2 size={48} />
              <p>Chọn file âm thanh để luyện nghe</p>
              <p className="hint">Hỗ trợ: MP3, WAV, OGG, M4A</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .listening-practice-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
          padding: 1.5rem;
          overflow-x: hidden;
        }

        /* Premium Header */
        .premium-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          position: relative;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
        }

        .sparkle {
          position: absolute;
          color: #fbbf24;
          animation: sparkle 2s ease-in-out infinite;
        }

        .sparkle-1 { top: -4px; right: -4px; animation-delay: 0s; }
        .sparkle-2 { bottom: -2px; left: -2px; animation-delay: 0.5s; }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }

        .header-text h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #c4b5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-text p {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .selection-hint {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1.5rem;
        }

        /* Level Grid */
        .level-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .level-card {
          position: relative;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: cardAppear 0.5s ease backwards;
          animation-delay: var(--card-delay);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .level-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px var(--level-glow);
        }

        .level-card:hover .card-shine {
          transform: translateX(100%);
        }

        .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: transform 0.6s ease;
          pointer-events: none;
        }

        .level-icon { font-size: 2rem; }
        .level-name { font-size: 1.5rem; font-weight: bold; color: white; }
        .level-count { font-size: 0.875rem; color: rgba(255, 255, 255, 0.5); }

        /* Custom Audio Section */
        .custom-audio-section {
          display: flex;
          justify-content: center;
          margin-top: 1rem;
        }

        /* Vocab Header */
        .vocab-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .btn-back, .btn-settings {
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
        }

        .btn-back:hover, .btn-settings:hover, .btn-settings.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .current-level {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-weight: 600;
          color: white;
          font-size: 1.1rem;
        }

        .current-level.audio-mode {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        }

        /* Lesson Picker */
        .lesson-picker {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          max-height: 400px;
          overflow-y: auto;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .picker-header h4 { margin: 0; color: white; }

        .btn-sm {
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }

        .lesson-list { margin-bottom: 1rem; }
        .lesson-group { margin-bottom: 0.5rem; }

        .lesson-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
        }

        .lesson-item:hover { background: rgba(255, 255, 255, 0.05); }
        .lesson-item.parent { font-weight: 500; }
        .lesson-item.child { padding-left: 1.5rem; font-size: 0.875rem; }
        .lesson-item .count { margin-left: auto; font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }

        .lesson-item input[type="checkbox"] {
          accent-color: #8b5cf6;
        }

        .difficulty-filter { margin-bottom: 1rem; }
        .difficulty-filter > label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: rgba(255, 255, 255, 0.7); }
        .filter-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }

        .filter-btn {
          padding: 0.35rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          cursor: pointer;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          border-color: transparent;
          color: white;
        }

        .close-picker {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .vocab-stats {
          text-align: center;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1.5rem;
        }

        /* Current Word Display */
        .current-word-display { text-align: center; margin-bottom: 2rem; }

        .word-counter {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1rem;
        }

        .word-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.4s ease;
        }

        .word-card:hover {
          box-shadow: 0 0 40px var(--level-glow);
        }

        .vocabulary-text {
          font-size: 2.5rem;
          font-weight: bold;
          color: white;
        }

        .kanji-text { font-size: 1.5rem; color: rgba(255, 255, 255, 0.6); }
        .meaning-text { font-size: 1.25rem; color: rgba(255, 255, 255, 0.9); margin-top: 0.5rem; }
        .sino-text { font-size: 1rem; color: rgba(255, 255, 255, 0.5); }
        .lesson-info { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.5rem; }

        .visibility-toggles {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.25rem;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.5);
          color: #c4b5fd;
        }

        /* Playback Controls */
        .playback-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .control-btn {
          width: 52px;
          height: 52px;
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

        .control-btn:hover:not(:disabled) {
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
          width: 68px;
          height: 68px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          border-color: transparent;
          color: white;
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
        }

        .control-btn.play-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .control-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Settings Panel */
        .settings-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.25rem;
          animation: slideDown 0.3s ease;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.8);
        }

        .setting-item:last-child { border-bottom: none; }
        .setting-item.checkbox { justify-content: flex-start; }
        .setting-item.checkbox label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }

        .speed-control, .repeat-control, .delay-control {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .speed-control button, .repeat-control button, .delay-control button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          color: white;
          font-size: 1.1rem;
        }

        /* Upload Section */
        .upload-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .upload-btn { display: flex; align-items: center; gap: 0.5rem; }
        .file-name { color: rgba(255, 255, 255, 0.6); font-size: 0.875rem; }

        /* Audio Progress */
        .audio-progress {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .progress-slider {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          cursor: pointer;
          accent-color: #8b5cf6;
        }

        .time {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          min-width: 45px;
        }

        .ab-markers {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: #c4b5fd;
        }

        .ab-controls {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .speed-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          justify-content: center;
        }

        .speed-section label { color: rgba(255, 255, 255, 0.7); }

        .speed-buttons { display: flex; gap: 0.5rem; }

        .speed-btn {
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
        }

        .speed-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          border-color: transparent;
          color: white;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state .hint {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        /* Buttons */
        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .btn-glass {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }

        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .btn-glass:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: white;
        }

        .btn-primary:hover {
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
          transform: translateY(-2px);
        }

        @media (max-width: 640px) {
          .listening-practice-page { padding: 1rem; }
          .premium-header { padding: 1rem; flex-wrap: wrap; gap: 1rem; }
          .header-text h1 { font-size: 1.25rem; }
          .level-grid { grid-template-columns: repeat(2, 1fr); }
          .playback-controls { flex-wrap: wrap; }
          .vocabulary-text { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
}
