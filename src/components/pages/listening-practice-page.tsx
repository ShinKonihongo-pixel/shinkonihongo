// Listening Practice Page - Premium UI with glassmorphism design
// Flow: Level Selection → Lesson List → Vocabulary Practice

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, Volume2,
  Repeat, Shuffle, Upload, ChevronLeft,
  Eye, EyeOff, SkipBack, SkipForward, Check, X,
  ChevronRight, BookOpen, CheckCircle2, Circle, Filter
} from 'lucide-react';
import type { Flashcard, DifficultyLevel, JLPTLevel, Lesson } from '../../types/flashcard';
import type { ListeningPracticePageProps, ViewMode } from './listening-practice/listening-practice-types';
import { JLPT_LEVELS } from './listening-practice/listening-practice-constants';
import { useListeningSettings } from '../../contexts/listening-settings-context';
import { ListeningSettingsModal, ListeningSettingsButton } from '../ui/listening-settings-modal';

// Level theme configurations
const LEVEL_THEMES: Record<JLPTLevel, { gradient: string; glow: string; icon: string }> = {
  N5: { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16, 185, 129, 0.4)', icon: '🌱' },
  N4: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', glow: 'rgba(59, 130, 246, 0.4)', icon: '🎧' },
  N3: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.4)', icon: '🎵' },
  N2: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.4)', icon: '🎼' },
  N1: { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239, 68, 68, 0.4)', icon: '👑' },
};

// Extended view modes
type ExtendedViewMode = ViewMode | 'lesson-list';

// Memorization filter
type MemorizationFilter = 'all' | 'learned' | 'not-learned';

interface ListeningPracticePagePropsExtended extends ListeningPracticePageProps {
  onUpdateCard?: (id: string, data: Partial<Flashcard>) => void;
}

export function ListeningPracticePage({
  cards,
  lessons,
  getLessonsByLevel,
  getChildLessons,
  onUpdateCard,
}: ListeningPracticePagePropsExtended) {
  // Listening settings context
  const { settings: listeningSettings } = useListeningSettings();

  // View & Level state
  const [viewMode, setViewMode] = useState<ExtendedViewMode>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Memorization filter
  const [memorizationFilter, setMemorizationFilter] = useState<MemorizationFilter>('all');

  // Playback state - initialize from context settings
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(listeningSettings.defaultPlaybackSpeed);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(listeningSettings.showVocabulary);
  const [showMeaning, setShowMeaning] = useState(listeningSettings.showMeaning);
  const [autoPlayNext, setAutoPlayNext] = useState(listeningSettings.autoPlayNext);
  const [repeatCount, setRepeatCount] = useState(listeningSettings.defaultRepeatCount);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [delayBetweenWords, setDelayBetweenWords] = useState(listeningSettings.delayBetweenWords);

  // Custom audio state
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState('');
  const [abRepeatStart, setAbRepeatStart] = useState<number | null>(null);
  const [abRepeatEnd, setAbRepeatEnd] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showKanji, setShowKanji] = useState(listeningSettings.showKanji);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPlayingRef = useRef(false); // Track playing state for async callbacks

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Get lessons for selected level (parent lessons only)
  const levelParentLessons = useMemo(() => {
    if (!selectedLevel) return [];
    return getLessonsByLevel(selectedLevel);
  }, [selectedLevel, getLessonsByLevel]);

  // Get selected lesson with its children
  const selectedLessonWithChildren = useMemo(() => {
    if (!selectedLessonId) return [];
    const parent = lessons.find(l => l.id === selectedLessonId);
    if (!parent) return [];
    const children = getChildLessons(selectedLessonId);
    return [parent, ...children];
  }, [selectedLessonId, lessons, getChildLessons]);

  // Get all lesson IDs for the selected lesson (parent + children)
  const selectedLessonIds = useMemo(() => selectedLessonWithChildren.map(l => l.id), [selectedLessonWithChildren]);

  // Get filtered cards for the selected lesson
  const filteredCards = useMemo(() => {
    if (!selectedLevel || selectedLessonIds.length === 0) return [];

    return cards.filter(card => {
      if (card.jlptLevel !== selectedLevel) return false;
      if (!selectedLessonIds.includes(card.lessonId)) return false;

      // Apply memorization filter
      if (memorizationFilter === 'learned' && card.memorizationStatus !== 'memorized') return false;
      if (memorizationFilter === 'not-learned' && card.memorizationStatus === 'memorized') return false;

      return true;
    });
  }, [cards, selectedLevel, selectedLessonIds, memorizationFilter]);

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

  // Get card count for a lesson (including children)
  const getCardCountForLesson = (lessonId: string) => {
    const childIds = getChildLessons(lessonId).map(c => c.id);
    const allIds = [lessonId, ...childIds];
    return cards.filter(c => allIds.includes(c.lessonId)).length;
  };

  // Get learned count for a lesson
  const getLearnedCountForLesson = (lessonId: string) => {
    const childIds = getChildLessons(lessonId).map(c => c.id);
    const allIds = [lessonId, ...childIds];
    return cards.filter(c => allIds.includes(c.lessonId) && c.memorizationStatus === 'memorized').length;
  };

  // Text-to-Speech with proper repeat handling
  const speakWord = useCallback((text: string, repeatIndex: number = 0) => {
    if (!isPlayingRef.current) return; // Stop if not playing

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = playbackSpeed;

      utterance.onend = () => {
        if (!isPlayingRef.current) return; // Stop if paused during speech

        const nextRepeat = repeatIndex + 1;

        if (nextRepeat < repeatCount) {
          // More repeats needed for current word
          setCurrentRepeat(nextRepeat);
          setTimeout(() => {
            if (isPlayingRef.current) {
              speakWord(text, nextRepeat);
            }
          }, delayBetweenWords * 1000);
        } else {
          // Done with repeats, move to next word
          setCurrentRepeat(0);
          if (autoPlayNext) {
            setCurrentIndex(prevIndex => {
              const nextIndex = prevIndex + 1;
              if (nextIndex < shuffledIndices.length) {
                return nextIndex;
              } else if (isLooping) {
                return 0;
              } else {
                setIsPlaying(false);
                return prevIndex;
              }
            });
          } else {
            setIsPlaying(false);
          }
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [playbackSpeed, repeatCount, autoPlayNext, shuffledIndices.length, isLooping, delayBetweenWords]);

  // Play current word when index changes or play starts
  useEffect(() => {
    if (viewMode === 'vocabulary' && isPlaying && currentCard) {
      setCurrentRepeat(0);
      speakWord(currentCard.vocabulary, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, isPlaying, currentIndex]);

  // Cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Sync local state when settings modal is closed
  useEffect(() => {
    if (!showSettingsModal) {
      setPlaybackSpeed(listeningSettings.defaultPlaybackSpeed);
      setRepeatCount(listeningSettings.defaultRepeatCount);
      setDelayBetweenWords(listeningSettings.delayBetweenWords);
      setAutoPlayNext(listeningSettings.autoPlayNext);
      setShowVocabulary(listeningSettings.showVocabulary);
      setShowMeaning(listeningSettings.showMeaning);
      setShowKanji(listeningSettings.showKanji);
    }
  }, [showSettingsModal, listeningSettings]);

  // Select a level - go to lesson list
  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setViewMode('lesson-list');
  };

  // Select a lesson - go to vocabulary practice
  const selectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentIndex(0);
    setMemorizationFilter('all');
    setViewMode('vocabulary');
    setIsPlaying(false);
  };

  // Go back
  const goBack = () => {
    if (viewMode === 'vocabulary') {
      setViewMode('lesson-list');
      setSelectedLessonId(null);
      setIsPlaying(false);
      window.speechSynthesis?.cancel();
    } else if (viewMode === 'lesson-list') {
      setViewMode('level-select');
      setSelectedLevel(null);
    } else if (viewMode === 'custom-audio') {
      setViewMode('level-select');
    }
  };

  // Playback controls
  const togglePlay = () => {
    if (viewMode === 'vocabulary') {
      if (isPlaying) {
        window.speechSynthesis?.cancel();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
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
    window.speechSynthesis?.cancel();
    if (currentIndex < shuffledIndices.length - 1) {
      setCurrentIndex(i => i + 1);
      setCurrentRepeat(0);
    } else if (isLooping) {
      setCurrentIndex(0);
      setCurrentRepeat(0);
    }
  };

  const goToPrevious = () => {
    window.speechSynthesis?.cancel();
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

  // Mark word as learned/not learned
  const toggleMemorization = (card: Flashcard) => {
    if (!onUpdateCard) return;
    const newStatus = card.memorizationStatus === 'memorized' ? 'learning' : 'memorized';
    onUpdateCard(card.id, { memorizationStatus: newStatus });
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

  // Count learned/not-learned for current lesson
  const learnedCount = filteredCards.filter(c => c.memorizationStatus === 'memorized').length;
  const allCardsForLesson = cards.filter(c => selectedLessonIds.includes(c.lessonId));
  const totalLearnedForLesson = allCardsForLesson.filter(c => c.memorizationStatus === 'memorized').length;

  return (
    <div className="listening-practice-page">
      {/* Level Selection View */}
      {viewMode === 'level-select' && (
        <>
          {/* Premium Header */}
          <div className="premium-header">
            <div className="header-content">
              <div className="header-text">
                <h1>Luyện Nghe Hiểu</h1>
                <p>Chọn cấp độ JLPT để bắt đầu</p>
              </div>
            </div>
            <ListeningSettingsButton onClick={() => setShowSettingsModal(true)} />
          </div>

          {/* Settings Modal */}
          <ListeningSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
          />

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

      {/* Lesson List View */}
      {viewMode === 'lesson-list' && selectedLevel && (
        <div className="lesson-list-mode">
          {/* Header */}
          <div className="vocab-header">
            <button className="btn-back" onClick={goBack}>
              <ChevronLeft size={20} />
            </button>
            <span className="current-level" style={{ background: LEVEL_THEMES[selectedLevel].gradient }}>
              {selectedLevel}
            </span>
            <h2 className="page-title">Chọn bài học</h2>
            <ListeningSettingsButton onClick={() => setShowSettingsModal(true)} />
          </div>

          {/* Settings Modal */}
          <ListeningSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
          />

          {/* Lesson List */}
          <div className="lesson-grid">
            {levelParentLessons.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} />
                <p>Chưa có bài học nào cho cấp độ này</p>
              </div>
            ) : (
              levelParentLessons.map((lesson, idx) => {
                const totalCount = getCardCountForLesson(lesson.id);
                const learnedCount = getLearnedCountForLesson(lesson.id);
                const progress = totalCount > 0 ? (learnedCount / totalCount) * 100 : 0;

                return (
                  <button
                    key={lesson.id}
                    className="lesson-card"
                    onClick={() => selectLesson(lesson.id)}
                    style={{ '--card-delay': `${idx * 0.05}s` } as React.CSSProperties}
                  >
                    <div className="lesson-icon">
                      <BookOpen size={24} />
                    </div>
                    <div className="lesson-info">
                      <span className="lesson-name">{lesson.name}</span>
                      <span className="lesson-count">{totalCount} từ</span>
                    </div>
                    <div className="lesson-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="progress-text">{learnedCount}/{totalCount}</span>
                    </div>
                    <ChevronRight size={20} className="lesson-arrow" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Vocabulary Mode */}
      {viewMode === 'vocabulary' && selectedLevel && selectedLessonId && (
        <div className="vocabulary-mode">
          {/* Header */}
          <div className="vocab-header">
            <button className="btn-back" onClick={goBack}>
              <ChevronLeft size={20} />
            </button>
            <span className="current-level" style={{ background: LEVEL_THEMES[selectedLevel].gradient }}>
              {selectedLevel}
            </span>
            <h2 className="lesson-title">{getLessonName(selectedLessonId)}</h2>
            <ListeningSettingsButton onClick={() => setShowSettingsModal(true)} />
          </div>

          {/* Settings Modal */}
          <ListeningSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
          />

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-group">
              <Filter size={16} />
              <button
                className={`filter-btn ${memorizationFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMemorizationFilter('all')}
              >
                Tất cả ({allCardsForLesson.length})
              </button>
              <button
                className={`filter-btn ${memorizationFilter === 'learned' ? 'active' : ''}`}
                onClick={() => setMemorizationFilter('learned')}
              >
                <CheckCircle2 size={14} /> Đã thuộc ({totalLearnedForLesson})
              </button>
              <button
                className={`filter-btn ${memorizationFilter === 'not-learned' ? 'active' : ''}`}
                onClick={() => setMemorizationFilter('not-learned')}
              >
                <Circle size={14} /> Chưa thuộc ({allCardsForLesson.length - totalLearnedForLesson})
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="vocab-stats">{filteredCards.length} từ vựng</div>

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
                    {showKanji && currentCard.kanji && <div className="kanji-text">{currentCard.kanji}</div>}
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

              {/* Memorization Toggle */}
              {onUpdateCard && (
                <div className="memorization-toggle">
                  <button
                    className={`mem-btn ${currentCard.memorizationStatus === 'memorized' ? 'learned' : 'not-learned'}`}
                    onClick={() => toggleMemorization(currentCard)}
                  >
                    {currentCard.memorizationStatus === 'memorized' ? (
                      <>
                        <CheckCircle2 size={20} /> Đã thuộc
                      </>
                    ) : (
                      <>
                        <Circle size={20} /> Chưa thuộc
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="visibility-toggles">
                <button className={`toggle-btn ${showVocabulary ? 'active' : ''}`} onClick={() => setShowVocabulary(v => !v)}>
                  {showVocabulary ? <Eye size={18} /> : <EyeOff size={18} />} Từ
                </button>
                <button className={`toggle-btn ${showKanji ? 'active' : ''}`} onClick={() => setShowKanji(v => !v)}>
                  {showKanji ? <Eye size={18} /> : <EyeOff size={18} />} Kanji
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
              <p className="hint">Thử thay đổi bộ lọc để xem thêm từ.</p>
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
          </div>

          {/* Inline Settings */}
          <div className="inline-settings">
            <div className="setting-group">
              <label>Tốc độ</label>
              <div className="setting-control">
                <button onClick={() => setPlaybackSpeed(s => Math.max(0.5, s - 0.25))}>-</button>
                <span>{playbackSpeed}x</span>
                <button onClick={() => setPlaybackSpeed(s => Math.min(2, s + 0.25))}>+</button>
              </div>
            </div>
            <div className="setting-group">
              <label>Lặp lại</label>
              <div className="setting-control">
                <button onClick={() => setRepeatCount(r => Math.max(1, r - 1))}>-</button>
                <span>{repeatCount} lần</span>
                <button onClick={() => setRepeatCount(r => Math.min(10, r + 1))}>+</button>
              </div>
            </div>
            <div className="setting-group">
              <label>Khoảng cách</label>
              <div className="setting-control">
                <button onClick={() => setDelayBetweenWords(d => Math.max(0.5, d - 0.5))}>-</button>
                <span>{delayBetweenWords}s</span>
                <button onClick={() => setDelayBetweenWords(d => Math.min(10, d + 0.5))}>+</button>
              </div>
            </div>
            <div className="setting-group checkbox">
              <label>
                <input type="checkbox" checked={autoPlayNext} onChange={(e) => setAutoPlayNext(e.target.checked)} />
                Tự động chuyển
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Custom Audio Mode */}
      {viewMode === 'custom-audio' && (
        <div className="custom-audio-mode">
          <div className="vocab-header">
            <button className="btn-back" onClick={goBack}>
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

        .page-title, .lesson-title {
          flex: 1;
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
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
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .current-level {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-weight: 600;
          color: white;
          font-size: 1rem;
        }

        .current-level.audio-mode {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        }

        /* Lesson Grid */
        .lesson-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .lesson-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: cardAppear 0.3s ease backwards;
          animation-delay: var(--card-delay);
        }

        .lesson-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }

        .lesson-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .lesson-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .lesson-name {
          font-weight: 500;
          color: white;
        }

        .lesson-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .lesson-progress {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
          min-width: 80px;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #16a34a);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .lesson-arrow {
          color: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .lesson-card:hover .lesson-arrow {
          color: rgba(255, 255, 255, 0.7);
          transform: translateX(4px);
        }

        /* Filter Bar */
        .filter-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow-x: auto;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
          white-space: nowrap;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          border-color: transparent;
          color: white;
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

        /* Memorization Toggle */
        .memorization-toggle {
          margin-top: 1rem;
        }

        .mem-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mem-btn.learned {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border: none;
          color: white;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
        }

        .mem-btn.not-learned {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
        }

        .mem-btn:hover {
          transform: scale(1.02);
        }

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

        /* Inline Settings */
        .inline-settings {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
        }

        .setting-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        .setting-group.checkbox label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
        }

        .setting-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .setting-control button {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          color: white;
          font-size: 1rem;
        }

        .setting-control button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .setting-control span {
          min-width: 50px;
          text-align: center;
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
          .filter-bar { padding: 0.5rem; }
          .filter-btn { padding: 0.35rem 0.6rem; font-size: 0.75rem; }
          .inline-settings { flex-direction: column; align-items: stretch; }
          .setting-group { justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}
