// Listening Practice Page - Premium UI with glassmorphism design
// Flow: Level Selection → Lesson List → Vocabulary Practice

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, Volume2,
  Repeat, Shuffle, Upload, ChevronLeft,
  Eye, EyeOff, SkipBack, SkipForward,
  ChevronRight, BookOpen, CheckCircle2, Circle, Headphones,
  ChevronDown, ChevronUp, Settings
} from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import type { ListeningPracticePagePropsExtended, ExtendedViewMode, MemorizationFilter } from './listening-practice/listening-practice-types';
import { useListeningSettings } from '../../contexts/listening-settings-context';
import { ListeningSettingsModal, ListeningSettingsButton } from '../ui/listening-settings-modal';
import { JLPTLevelSelector, LEVEL_THEMES } from '../ui/jlpt-level-selector';

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showKanji, setShowKanji] = useState(listeningSettings.showKanji);
  const [readMeaning, setReadMeaning] = useState(false);
  const [showInlineSettings, setShowInlineSettings] = useState(false);

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

  // Reset currentIndex when filter changes to avoid out of bounds
  useEffect(() => {
    setCurrentIndex(0);
  }, [memorizationFilter]);

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

  // Count by level for JLPTLevelSelector
  const countByLevel = useMemo(() => {
    const counts: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    cards.forEach(c => { counts[c.jlptLevel]++; });
    return counts;
  }, [cards]);

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

  // Store settings in refs to avoid circular dependencies
  const repeatCountRef = useRef(repeatCount);
  const delayBetweenWordsRef = useRef(delayBetweenWords);
  const autoPlayNextRef = useRef(autoPlayNext);
  const isLoopingRef = useRef(isLooping);
  const readMeaningRef = useRef(readMeaning);
  const shuffledIndicesRef = useRef(shuffledIndices);

  // Keep refs in sync
  useEffect(() => { repeatCountRef.current = repeatCount; }, [repeatCount]);
  useEffect(() => { delayBetweenWordsRef.current = delayBetweenWords; }, [delayBetweenWords]);
  useEffect(() => { autoPlayNextRef.current = autoPlayNext; }, [autoPlayNext]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
  useEffect(() => { readMeaningRef.current = readMeaning; }, [readMeaning]);
  useEffect(() => { shuffledIndicesRef.current = shuffledIndices; }, [shuffledIndices]);

  // Text-to-Speech helper
  const speakText = useCallback((text: string, lang: 'ja-JP' | 'vi-VN'): Promise<void> => {
    return new Promise((resolve) => {
      if (!isPlayingRef.current) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = playbackSpeed;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }, [playbackSpeed]);

  // Main speak function - handles vocabulary + optional meaning + repeats + next word
  const speakCurrentWord = useCallback(async (card: Flashcard, repeatIndex: number = 0) => {
    if (!isPlayingRef.current || !card) return;

    // Speak vocabulary
    await speakText(card.vocabulary, 'ja-JP');
    if (!isPlayingRef.current) return;

    // Optionally read meaning
    if (readMeaningRef.current && card.meaning) {
      await new Promise(r => setTimeout(r, 500)); // Small delay before meaning
      if (!isPlayingRef.current) return;
      await speakText(card.meaning, 'vi-VN');
      if (!isPlayingRef.current) return;
    }

    // Check for more repeats
    const nextRepeat = repeatIndex + 1;
    if (nextRepeat < repeatCountRef.current) {
      setCurrentRepeat(nextRepeat);
      await new Promise(r => setTimeout(r, delayBetweenWordsRef.current * 1000));
      if (isPlayingRef.current) {
        speakCurrentWord(card, nextRepeat);
      }
    } else {
      // Done with repeats, handle next word
      setCurrentRepeat(0);
      if (autoPlayNextRef.current) {
        // Delay before next word
        await new Promise(r => setTimeout(r, delayBetweenWordsRef.current * 1000));
        if (!isPlayingRef.current) return;

        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < shuffledIndicesRef.current.length) {
            return nextIndex;
          } else if (isLoopingRef.current) {
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
  }, [speakText]);

  // Play current word when index changes or play starts
  useEffect(() => {
    if (viewMode === 'vocabulary' && isPlaying && currentCard) {
      setCurrentRepeat(0);
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        if (isPlayingRef.current && currentCard) {
          speakCurrentWord(currentCard, 0);
        }
      }, 100);
      return () => clearTimeout(timer);
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
    const newStatus = card.memorizationStatus === 'memorized' ? 'not_memorized' : 'memorized';
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
  const allCardsForLesson = cards.filter(c => selectedLessonIds.includes(c.lessonId));
  const totalLearnedForLesson = allCardsForLesson.filter(c => c.memorizationStatus === 'memorized').length;

  return (
    <div className="listening-practice-page">
      {/* Level Selection View - Premium UI matching Grammar/Vocabulary design */}
      {viewMode === 'level-select' && (
        <div className="listening-level-select-wrapper">
          <JLPTLevelSelector
            title="Nghe Hiểu"
            subtitle="Chọn cấp độ JLPT để bắt đầu"
            icon={<Headphones size={32} />}
            countByLevel={countByLevel}
            countLabel="từ"
            onSelectLevel={selectLevel}
          />
          {/* Custom Audio Option */}
          <div className="level-select-custom-audio">
            <button className="btn btn-glass" onClick={() => setViewMode('custom-audio')}>
              <Upload size={18} />
              Luyện nghe file audio
            </button>
          </div>
        </div>
      )}

      {/* Lesson List View - Premium Grid Layout */}
      {viewMode === 'lesson-list' && selectedLevel && (
        <div className="lesson-list-mode">
          {/* Premium Header */}
          <header className="lesson-list-header" style={{
            '--header-gradient': LEVEL_THEMES[selectedLevel].gradient,
            '--header-glow': LEVEL_THEMES[selectedLevel].glow,
          } as React.CSSProperties}>
            <div className="header-left">
              <button className="btn-back" onClick={goBack}>
                <ChevronLeft size={20} />
              </button>
              <div className="level-badge desktop-level">
                <span>{selectedLevel}</span>
              </div>
              <span className="mobile-lesson-info">
                <Headphones size={18} />
                <span className="mobile-lesson-name">Luyện nghe {selectedLevel}</span>
              </span>
              <div className="header-info">
                <h2>Chọn bài học</h2>
                <p>{levelParentLessons.length} bài học • {getCardCountByLevel(selectedLevel)} từ vựng</p>
              </div>
            </div>
          </header>

          {/* Lessons Grid - Premium 5 Column */}
          <div className="lessons-premium-grid">
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
                const isComplete = learnedCount === totalCount && totalCount > 0;

                return (
                  <button
                    key={lesson.id}
                    className={`lesson-premium-card ${isComplete ? 'complete' : ''}`}
                    onClick={() => selectLesson(lesson.id)}
                    style={{
                      '--card-delay': `${idx * 0.05}s`,
                      '--accent': LEVEL_THEMES[selectedLevel].accent,
                      '--glow': LEVEL_THEMES[selectedLevel].glow,
                    } as React.CSSProperties}
                    disabled={totalCount === 0}
                  >
                    <div className="card-header">
                      <div className="lesson-icon-wrapper">
                        <Headphones size={20} />
                      </div>
                      {isComplete && (
                        <div className="complete-badge">
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      <span className="lesson-name">{lesson.name}</span>
                      <span className="lesson-count">{totalCount} từ vựng</span>
                    </div>
                    <div className="card-footer">
                      <div className="progress-bar-mini">
                        <div className="progress-fill-mini" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="progress-label">{learnedCount}/{totalCount}</span>
                    </div>
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
            <span className="current-level desktop-level" style={{ background: LEVEL_THEMES[selectedLevel].gradient }}>
              {selectedLevel}
            </span>
            <span className="mobile-lesson-info">
              <Headphones size={18} />
              <span className="mobile-lesson-name">{getLessonName(selectedLessonId)}</span>
            </span>
            <h2 className="lesson-title">{getLessonName(selectedLessonId)}</h2>
            <ListeningSettingsButton onClick={() => setShowSettingsModal(true)} />
          </div>

          {/* Filter Buttons */}
          <div className="filter-buttons">
            <button
              className={`filter-btn ${memorizationFilter === 'all' ? 'active' : ''}`}
              onClick={() => setMemorizationFilter('all')}
            >
              Tất cả
            </button>
            <button
              className={`filter-btn ${memorizationFilter === 'learned' ? 'active' : ''}`}
              onClick={() => setMemorizationFilter('learned')}
            >
              Đã thuộc
            </button>
            <button
              className={`filter-btn ${memorizationFilter === 'not-learned' ? 'active' : ''}`}
              onClick={() => setMemorizationFilter('not-learned')}
            >
              Chưa thuộc
            </button>
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

              {/* Memorization Toggle - 2 buttons side by side */}
              {onUpdateCard && (
                <div className="memorization-toggle">
                  <button
                    className={`mem-btn learned ${currentCard.memorizationStatus === 'memorized' ? 'active' : ''}`}
                    onClick={() => onUpdateCard(currentCard.id, { memorizationStatus: 'memorized' })}
                  >
                    <CheckCircle2 size={18} /> Đã thuộc
                  </button>
                  <button
                    className={`mem-btn not-learned ${currentCard.memorizationStatus !== 'memorized' ? 'active' : ''}`}
                    onClick={() => onUpdateCard(currentCard.id, { memorizationStatus: 'not_memorized' })}
                  >
                    <Circle size={18} /> Chưa thuộc
                  </button>
                </div>
              )}

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

          {/* Inline Settings - Collapsible */}
          <div className="inline-settings-wrapper">
            <button
              className="settings-toggle-btn"
              onClick={() => setShowInlineSettings(s => !s)}
            >
              <Settings size={16} />
              <span>Thiết lập</span>
              {showInlineSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showInlineSettings && (
              <div className="inline-settings">
                <div className="settings-row numeric-settings">
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
                </div>
                <div className="settings-row checkbox-settings">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={autoPlayNext} onChange={(e) => setAutoPlayNext(e.target.checked)} />
                    <span>Tự động chuyển</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={readMeaning} onChange={(e) => setReadMeaning(e.target.checked)} />
                    <span>Đọc nghĩa</span>
                  </label>
                </div>
              </div>
            )}
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

      {/* Settings Modal - Rendered at root level to avoid layout issues */}
      <ListeningSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <style>{`
        .listening-practice-page {
          min-height: calc(100vh - 60px);
          max-height: calc(100vh - 60px);
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Level Select Wrapper */
        .listening-level-select-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .listening-level-select-wrapper .jlpt-level-selector {
          min-height: calc(100vh - 60px);
          max-height: calc(100vh - 60px);
        }

        .level-select-custom-audio {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
        }

        .level-select-custom-audio .btn-glass {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .level-select-custom-audio .btn-glass:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          color: white;
          transform: translateY(-2px);
        }

        /* ========== Lesson List Mode - Premium ========== */
        .lesson-list-mode {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .lesson-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          flex-shrink: 0;
        }

        .lesson-list-header::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--header-gradient);
          box-shadow: 0 0 20px var(--header-glow);
        }

        .lesson-list-header .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .lesson-list-header .level-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 44px;
          padding: 0 0.75rem;
          background: var(--header-gradient);
          border-radius: 12px;
          font-weight: 900;
          font-size: 1rem;
          color: white;
          box-shadow: 0 4px 15px -3px var(--header-glow);
        }

        .lesson-list-header .header-info h2 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }

        .lesson-list-header .header-info p {
          margin: 0.15rem 0 0;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Premium Lessons Grid */
        .lessons-premium-grid {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 1.25rem;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.75rem;
          align-content: start;
        }

        .lessons-premium-grid::-webkit-scrollbar {
          width: 6px;
        }

        .lessons-premium-grid::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }

        .lessons-premium-grid::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .lesson-premium-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          animation: lessonAppear 0.3s ease-out var(--card-delay) both;
          overflow: hidden;
        }

        .lesson-premium-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        @keyframes lessonAppear {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .lesson-premium-card:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--accent);
          transform: translateY(-4px);
          box-shadow: 0 8px 25px -10px var(--glow);
        }

        .lesson-premium-card:hover:not(:disabled)::before {
          opacity: 1;
        }

        .lesson-premium-card:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .lesson-premium-card.complete {
          border-color: rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.05);
        }

        .lesson-premium-card .card-header {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 0.75rem;
          position: relative;
        }

        .lesson-premium-card .lesson-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .lesson-premium-card .complete-badge {
          position: absolute;
          top: -4px;
          right: calc(50% - 32px);
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
        }

        .lesson-premium-card .card-body {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }

        .lesson-premium-card .lesson-name {
          font-weight: 700;
          color: white;
          font-size: 0.9rem;
        }

        .lesson-premium-card .lesson-count {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .lesson-premium-card .card-footer {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .lesson-premium-card .progress-bar-mini {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .lesson-premium-card .progress-fill-mini {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), #22c55e);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .lesson-premium-card .progress-label {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
        }

        /* ========== Vocabulary Mode ========== */
        .vocabulary-mode {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          padding: 0.75rem;
        }

        .vocabulary-mode .vocab-header {
          flex-shrink: 0;
        }

        .vocabulary-mode .filter-buttons {
          flex-shrink: 0;
        }

        .vocabulary-mode .vocab-stats {
          flex-shrink: 0;
        }

        .vocabulary-mode .current-word-display {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        .vocabulary-mode .word-card {
          max-height: 100%;
          overflow-y: auto;
        }

        .vocabulary-mode .playback-controls {
          flex-shrink: 0;
        }

        .vocabulary-mode .inline-settings {
          flex-shrink: 0;
        }

        /* ========== Custom Audio Mode ========== */
        .custom-audio-mode {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow-y: auto;
          padding: 0.75rem;
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

        /* Desktop: show level badge and lesson-title, hide mobile-lesson-info */
        .desktop-level { display: flex; }
        .mobile-lesson-info { display: none; }

        .mobile-lesson-info {
          align-items: center;
          gap: 0.5rem;
          color: white;
          font-size: 0.95rem;
          font-weight: 500;
          flex: 1;
          min-width: 0;
        }

        .mobile-lesson-info svg {
          flex-shrink: 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .mobile-lesson-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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

        /* Filter Buttons - No frame, transparent background */
        .vocabulary-mode .filter-buttons {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .vocabulary-mode .filter-btn {
          flex: 1;
          padding: 0.6rem 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          background: transparent !important;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s;
          text-align: center;
          white-space: nowrap;
        }

        .vocabulary-mode .filter-btn:hover {
          border-color: rgba(255, 255, 255, 0.35) !important;
          color: rgba(255, 255, 255, 0.8);
        }

        .vocabulary-mode .filter-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%) !important;
          border-color: transparent !important;
          color: white;
          font-weight: 500;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
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

        /* Memorization Toggle - 2 buttons */
        .memorization-toggle {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .mem-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .mem-btn.learned {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: rgba(34, 197, 94, 0.7);
        }

        .mem-btn.learned.active {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
        }

        .mem-btn.not-learned {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.6);
        }

        .mem-btn.not-learned.active {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #f87171;
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

        /* Inline Settings Wrapper */
        .inline-settings-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .settings-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          align-self: center;
        }

        .settings-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        /* Inline Settings */
        .inline-settings {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 0.875rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .settings-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
        }

        .settings-row.numeric-settings {
          gap: 1rem;
        }

        .settings-row.checkbox-settings {
          gap: 1.5rem;
          padding-top: 0.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .setting-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }

        .setting-group label {
          min-width: 55px;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #8b5cf6;
          cursor: pointer;
        }

        .setting-control {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
        }

        .setting-control button {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.08);
          cursor: pointer;
          color: white;
          font-size: 1rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .setting-control button:hover {
          background: rgba(139, 92, 246, 0.3);
          border-color: rgba(139, 92, 246, 0.5);
        }

        .setting-control button:active {
          transform: scale(0.95);
        }

        .setting-control span {
          min-width: 50px;
          text-align: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: #c4b5fd;
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

        /* Responsive - Tablet */
        @media (max-width: 768px) {
          .lessons-premium-grid {
            grid-template-columns: repeat(3, 1fr);
            padding: 0.75rem;
            gap: 0.5rem;
          }

          .lesson-premium-card {
            padding: 0.75rem;
          }

          .lesson-premium-card .lesson-icon-wrapper {
            width: 32px;
            height: 32px;
          }

          .lesson-premium-card .lesson-name {
            font-size: 0.8rem;
          }

          .lesson-list-header .header-info {
            display: none;
          }
        }

        /* Responsive - Mobile */
        @media (max-width: 640px) {
          .vocabulary-mode,
          .custom-audio-mode {
            padding: 0.5rem;
          }

          .premium-header { padding: 1rem; flex-wrap: wrap; gap: 1rem; }
          .header-text h1 { font-size: 1.25rem; }
          .level-grid { grid-template-columns: repeat(2, 1fr); }
          .playback-controls { flex-wrap: wrap; gap: 0.5rem; }
          .vocabulary-text { font-size: 2rem; }

          /* Mobile header: show headphones + lesson name, hide level badge and full title */
          .desktop-level { display: none; }
          .lesson-title { display: none; }
          .mobile-lesson-info { display: flex; }
          .vocab-header { gap: 0.5rem; margin-bottom: 1rem; }

          /* Filter buttons on mobile */
          .vocabulary-mode .filter-buttons {
            max-width: 100%;
          }

          .vocabulary-mode .filter-btn {
            padding: 0.45rem 0.4rem;
            font-size: 0.7rem;
          }

          /* Memorization buttons on mobile */
          .memorization-toggle {
            gap: 0.5rem;
          }

          .mem-btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.8rem;
            flex: 1;
            justify-content: center;
          }

          .mem-btn svg {
            width: 16px;
            height: 16px;
          }

          /* Inline settings - stacked on mobile */
          .inline-settings {
            padding: 0.75rem;
            gap: 0.5rem;
          }

          .settings-row.numeric-settings {
            flex-direction: column;
            gap: 0.5rem;
          }

          .setting-group {
            width: 100%;
            justify-content: space-between;
          }

          .settings-row.checkbox-settings {
            justify-content: space-around;
            gap: 1rem;
          }

          .settings-toggle-btn {
            padding: 0.4rem 0.75rem;
            font-size: 0.75rem;
          }

          .lessons-premium-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.35rem;
          }

          .lesson-premium-card .lesson-name {
            font-size: 0.7rem;
          }

          .lesson-premium-card .lesson-count {
            font-size: 0.6rem;
          }

          .lesson-list-header {
            padding: 0.5rem 0.75rem;
          }

          .lesson-list-header .level-badge {
            min-width: 36px;
            height: 36px;
            font-size: 0.85rem;
          }

          /* Show headphones + lesson name on mobile for lesson list */
          .lesson-list-header .level-badge.desktop-level { display: none; }
          .lesson-list-header .mobile-lesson-info { display: flex; }
          .lesson-list-header .header-info { display: none; }
        }

        @media (max-width: 480px) {
          .lessons-premium-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
