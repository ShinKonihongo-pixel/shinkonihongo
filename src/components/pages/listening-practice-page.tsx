// Listening Practice Page - JLPT level-based with lesson selection

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, Volume2,
  Repeat, Shuffle, Upload, ChevronLeft,
  Eye, EyeOff, Settings, SkipBack, SkipForward, Check
} from 'lucide-react';
import type { Flashcard, DifficultyLevel, JLPTLevel, Lesson } from '../../types/flashcard';

interface ListeningPracticePageProps {
  cards: Flashcard[];
  lessons: Lesson[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onGoHome?: () => void;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'TB' },
  { value: 'hard', label: 'Khó' },
  { value: 'super_hard', label: 'Rất khó' },
];

type ViewMode = 'level-select' | 'vocabulary' | 'custom-audio';

export function ListeningPracticePage({
  cards,
  lessons,
  getLessonsByLevel,
  getChildLessons,
  onGoHome,
}: ListeningPracticePageProps) {
  // View & Level state
  const [viewMode, setViewMode] = useState<ViewMode>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);

  // Lesson selection state - empty means "all lessons"
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

  // Get all lesson IDs for the level (for "select all" functionality)
  const allLevelLessonIds = useMemo(() => levelLessons.map(l => l.id), [levelLessons]);

  // Get filtered cards
  const filteredCards = useMemo(() => {
    if (!selectedLevel) return [];

    return cards.filter(card => {
      // Level match
      if (card.jlptLevel !== selectedLevel) return false;

      // Lesson match - empty selectedLessonIds means "all"
      if (selectedLessonIds.length > 0 && !selectedLessonIds.includes(card.lessonId)) {
        return false;
      }

      // Difficulty match
      if (!selectedDifficulties.includes('all') &&
          !selectedDifficulties.includes(card.difficultyLevel)) {
        return false;
      }

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

  // Get card count by level for level selection
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

  // Play current word when playing and card changes
  useEffect(() => {
    if (viewMode === 'vocabulary' && isPlaying && currentCard) {
      speakWord(currentCard.vocabulary);
    }
  }, [viewMode, isPlaying, currentCard, currentIndex, speakWord]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Select a level and enter vocabulary mode
  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setSelectedLessonIds([]); // Default to all lessons
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
      if (prev.includes(lessonId)) {
        return prev.filter(id => id !== lessonId);
      } else {
        return [...prev, lessonId];
      }
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

  // Get lesson name for card
  const getLessonName = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson?.name || '';
  };

  return (
    <div className="listening-practice-page">
      {/* Header */}
      <div className="page-header">
        <h2>Luyện Nghe</h2>
        {onGoHome && viewMode === 'level-select' && (
          <button className="btn btn-back" onClick={onGoHome}>← Trang chủ</button>
        )}
      </div>

      {/* Level Selection View */}
      {viewMode === 'level-select' && (
        <div className="level-selection">
          <p className="selection-hint">Chọn cấp độ để bắt đầu luyện nghe</p>

          <div className="level-grid">
            {JLPT_LEVELS.map(level => (
              <button
                key={level}
                className="level-card"
                onClick={() => selectLevel(level)}
              >
                <span className="level-name">{level}</span>
                <span className="level-count">{getCardCountByLevel(level)} từ</span>
              </button>
            ))}
          </div>

          {/* Custom Audio Option */}
          <div className="custom-audio-option">
            <button
              className="btn btn-secondary"
              onClick={() => setViewMode('custom-audio')}
            >
              <Upload size={18} />
              Luyện nghe file audio
            </button>
          </div>
        </div>
      )}

      {/* Vocabulary Mode */}
      {viewMode === 'vocabulary' && selectedLevel && (
        <div className="vocabulary-mode">
          {/* Back & Level Info */}
          <div className="vocab-header">
            <button className="btn btn-back" onClick={goBackToLevelSelect}>
              <ChevronLeft size={20} /> Quay lại
            </button>
            <span className="current-level">{selectedLevel}</span>
            <button
              className={`btn btn-icon ${showLessonPicker ? 'active' : ''}`}
              onClick={() => setShowLessonPicker(s => !s)}
              title="Chọn nguồn"
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
          <div className="vocab-stats">
            {filteredCards.length} từ vựng
            {selectedLessonIds.length > 0 && ` (${selectedLessonIds.length} bài)`}
          </div>

          {/* Current Word Display */}
          {currentCard && (
            <div className="current-word-display">
              <div className="word-counter">
                {currentIndex + 1} / {filteredCards.length}
                {repeatCount > 1 && ` (lặp ${currentRepeat + 1}/${repeatCount})`}
              </div>

              <div className="word-card">
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
              <p>Không có từ vựng nào.</p>
              <p>Hãy chọn bài học trong cài đặt.</p>
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
              <div className="setting-item">
                <label><input type="checkbox" checked={autoPlayNext} onChange={(e) => setAutoPlayNext(e.target.checked)} /> Tự động chuyển</label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Audio Mode */}
      {viewMode === 'custom-audio' && (
        <div className="custom-audio-mode">
          <div className="vocab-header">
            <button className="btn btn-back" onClick={goBackToLevelSelect}>
              <ChevronLeft size={20} /> Quay lại
            </button>
            <span className="current-level">File Audio</span>
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
                <button className="btn btn-secondary" onClick={() => setAbRepeatStart(audioCurrentTime)}>Đặt A</button>
                <button className="btn btn-secondary" onClick={() => setAbRepeatEnd(audioCurrentTime)}>Đặt B</button>
                <button className="btn btn-secondary" onClick={() => { setAbRepeatStart(null); setAbRepeatEnd(null); }} disabled={abRepeatStart === null && abRepeatEnd === null}>Xoá A-B</button>
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
        .listening-practice-page { padding: 1rem; max-width: 800px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .page-header h2 { margin: 0; }

        .level-selection { text-align: center; }
        .selection-hint { color: var(--text-secondary, #666); margin-bottom: 1.5rem; }

        .level-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .level-card { padding: 1.5rem; border: 2px solid var(--border-color, #ddd); background: var(--bg-secondary, #f5f5f5); border-radius: 12px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 0.5rem; }
        .level-card:hover { border-color: var(--primary-color, #4a90d9); transform: translateY(-2px); }
        .level-name { font-size: 1.5rem; font-weight: bold; }
        .level-count { font-size: 0.875rem; color: var(--text-secondary, #666); }

        .custom-audio-option { margin-top: 1rem; }

        .vocab-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .current-level { font-size: 1.25rem; font-weight: bold; flex: 1; }
        .btn-icon { padding: 0.5rem; border-radius: 8px; }
        .btn-icon.active { background: var(--primary-color, #4a90d9); color: white; }

        .lesson-picker { background: var(--bg-secondary, #f5f5f5); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; max-height: 400px; overflow-y: auto; }
        .picker-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .picker-header h4 { margin: 0; }
        .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }

        .lesson-list { margin-bottom: 1rem; }
        .lesson-group { margin-bottom: 0.5rem; }
        .lesson-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; cursor: pointer; border-radius: 4px; }
        .lesson-item:hover { background: rgba(0,0,0,0.05); }
        .lesson-item.parent { font-weight: 500; }
        .lesson-item.child { padding-left: 1.5rem; font-size: 0.875rem; }
        .lesson-item .count { margin-left: auto; font-size: 0.75rem; color: var(--text-secondary, #666); }

        .difficulty-filter { margin-bottom: 1rem; }
        .difficulty-filter label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        .filter-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .filter-btn { padding: 0.25rem 0.75rem; border: 1px solid var(--border-color, #ddd); background: white; border-radius: 16px; cursor: pointer; font-size: 0.75rem; }
        .filter-btn.active { background: var(--primary-color, #4a90d9); border-color: var(--primary-color, #4a90d9); color: white; }

        .close-picker { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

        .vocab-stats { text-align: center; font-size: 0.875rem; color: var(--text-secondary, #666); margin-bottom: 1rem; }

        .current-word-display { text-align: center; margin-bottom: 2rem; }
        .word-counter { font-size: 0.875rem; color: var(--text-secondary, #666); margin-bottom: 1rem; }
        .word-card { background: var(--bg-secondary, #f5f5f5); padding: 2rem; border-radius: 12px; min-height: 150px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 0.5rem; }
        .vocabulary-text { font-size: 2.5rem; font-weight: bold; }
        .kanji-text { font-size: 1.5rem; color: var(--text-secondary, #666); }
        .meaning-text { font-size: 1.25rem; margin-top: 0.5rem; }
        .sino-text { font-size: 1rem; color: var(--text-secondary, #666); }
        .lesson-info { font-size: 0.75rem; color: var(--text-secondary, #888); margin-top: 0.5rem; }

        .visibility-toggles { display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; }
        .toggle-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid var(--border-color, #ddd); background: white; border-radius: 8px; cursor: pointer; font-size: 0.875rem; }
        .toggle-btn.active { background: var(--bg-secondary, #f5f5f5); border-color: var(--primary-color, #4a90d9); }

        .playback-controls { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .control-btn { width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--border-color, #ddd); background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .control-btn:hover { border-color: var(--primary-color, #4a90d9); }
        .control-btn.active { background: var(--primary-color, #4a90d9); border-color: var(--primary-color, #4a90d9); color: white; }
        .control-btn.play-btn { width: 64px; height: 64px; background: var(--primary-color, #4a90d9); border-color: var(--primary-color, #4a90d9); color: white; }
        .control-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .settings-panel { background: var(--bg-secondary, #f5f5f5); padding: 1rem; border-radius: 8px; }
        .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color, #ddd); }
        .setting-item:last-child { border-bottom: none; }
        .speed-control, .repeat-control, .delay-control { display: flex; align-items: center; gap: 0.75rem; }
        .speed-control button, .repeat-control button, .delay-control button { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-color, #ddd); background: white; cursor: pointer; }

        .upload-section { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .upload-btn { display: flex; align-items: center; gap: 0.5rem; }
        .file-name { color: var(--text-secondary, #666); font-size: 0.875rem; }

        .audio-progress { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .progress-slider { flex: 1; height: 8px; border-radius: 4px; cursor: pointer; }
        .time { font-size: 0.875rem; color: var(--text-secondary, #666); min-width: 45px; }

        .ab-markers { display: flex; justify-content: center; gap: 2rem; margin-bottom: 1rem; font-size: 0.875rem; color: var(--primary-color, #4a90d9); }
        .ab-controls { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; }

        .speed-section { display: flex; align-items: center; gap: 1rem; justify-content: center; }
        .speed-buttons { display: flex; gap: 0.5rem; }
        .speed-btn { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color, #ddd); background: white; border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
        .speed-btn.active { background: var(--primary-color, #4a90d9); border-color: var(--primary-color, #4a90d9); color: white; }

        .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary, #666); }
        .empty-state svg { margin-bottom: 1rem; opacity: 0.5; }
        .empty-state .hint { font-size: 0.875rem; margin-top: 0.5rem; }

        @media (max-width: 600px) {
          .playback-controls { flex-wrap: wrap; }
          .vocabulary-text { font-size: 2rem; }
          .level-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
