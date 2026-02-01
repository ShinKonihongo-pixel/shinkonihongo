// Grammar study page - Premium UI with glassmorphism design
// Level/lesson selection first, then study mode with flashcards

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Volume2, ArrowLeft, BookOpen, CheckCircle2, Circle, Settings, X, Eye, EyeOff, Type } from 'lucide-react';
import type { GrammarCard, JLPTLevel, GrammarLesson } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import { LevelLessonSelector } from '../study/level-lesson-selector';

// Parse furigana from 漢字(ふりがな) format to ruby elements
function parseFurigana(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match kanji followed by hiragana/katakana in parentheses
  const regex = /([一-龯々]+)\(([ぁ-んァ-ヴー]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add ruby element
    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rt>{match[2]}</rt>
      </ruby>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

interface GrammarStudyPageProps {
  grammarCards: GrammarCard[];
  lessons: GrammarLesson[];
  getLessonsByLevel: (level: JLPTLevel) => GrammarLesson[];
  getChildLessons: (parentId: string) => GrammarLesson[];
  onGoHome: () => void;
  settings?: AppSettings;
  onUpdateGrammarCard?: (id: string, data: Partial<GrammarCard>) => void;
}

type ViewMode = 'select' | 'study';
type MemorizationFilter = 'all' | 'memorized' | 'learning';

// Local settings for grammar study
interface GrammarStudySettings {
  frontShow: {
    title: boolean;
    formula: boolean;
    meaning: boolean;
    explanation: boolean;
    examples: boolean;
    level: boolean;
    lesson: boolean;
  };
  backShow: {
    title: boolean;
    formula: boolean;
    meaning: boolean;
    explanation: boolean;
    examples: boolean;
  };
  frontFontSize: number;
  backFontSize: number;
  cardScale: number; // Card size scale (60-150%, default 100)
}

const DEFAULT_SETTINGS: GrammarStudySettings = {
  frontShow: {
    title: true,
    formula: true,
    meaning: false,
    explanation: false,
    examples: false,
    level: true,
    lesson: true,
  },
  backShow: {
    title: false,
    formula: false,
    meaning: true,
    explanation: true,
    examples: true,
  },
  frontFontSize: 16, // Base font size in px
  backFontSize: 22,  // Base font size in px
  cardScale: 100,
};

// Level theme configurations
const LEVEL_THEMES: Record<JLPTLevel, { gradient: string; glow: string }> = {
  N5: { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16, 185, 129, 0.4)' },
  N4: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', glow: 'rgba(59, 130, 246, 0.4)' },
  N3: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.4)' },
  N2: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.4)' },
  N1: { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239, 68, 68, 0.4)' },
};

export function GrammarStudyPage({
  grammarCards,
  lessons,
  getLessonsByLevel,
  getChildLessons,
  onGoHome,
  onUpdateGrammarCard,
}: GrammarStudyPageProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>('N5');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);

  // Filter state
  const [memorizationFilter, setMemorizationFilter] = useState<MemorizationFilter>('all');

  // Local study settings
  const [studySettings, setStudySettings] = useState<GrammarStudySettings>(() => {
    const saved = localStorage.getItem('grammarStudySettings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('grammarStudySettings', JSON.stringify(studySettings));
  }, [studySettings]);

  const { frontShow, backShow, frontFontSize, backFontSize, cardScale } = studySettings;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // Swipe handling for mobile
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Filter cards based on selected lessons
  const lessonFilteredCards = useMemo(() => {
    if (selectedLessonIds.length === 0) return [];

    const allLessonIds = new Set<string>();
    selectedLessonIds.forEach(lessonId => {
      allLessonIds.add(lessonId);
      const children = getChildLessons(lessonId);
      children.forEach(child => allLessonIds.add(child.id));
    });

    return grammarCards.filter(card => allLessonIds.has(card.lessonId));
  }, [grammarCards, selectedLessonIds, getChildLessons]);

  // Apply memorization filter
  const filteredCards = useMemo(() => {
    if (memorizationFilter === 'all') return lessonFilteredCards;
    if (memorizationFilter === 'memorized') {
      return lessonFilteredCards.filter(card => card.memorizationStatus === 'memorized');
    }
    return lessonFilteredCards.filter(card => card.memorizationStatus !== 'memorized');
  }, [lessonFilteredCards, memorizationFilter]);

  // Shuffled order
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const filteredCardsLengthRef = useRef(filteredCards.length);

  // Reset indices when filtered cards change - intentional state sync pattern
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (filteredCardsLengthRef.current !== filteredCards.length) {
      filteredCardsLengthRef.current = filteredCards.length;
      setShuffledIndices(filteredCards.map((_, i) => i));
      setCurrentIndex(0);
    }
  }, [filteredCards]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const displayCards = useMemo(() => {
    if (isShuffled && shuffledIndices.length === filteredCards.length) {
      return shuffledIndices.map(i => filteredCards[i]);
    }
    return filteredCards;
  }, [filteredCards, isShuffled, shuffledIndices]);

  const currentCard = displayCards[currentIndex];

  const handleShuffle = () => {
    if (isShuffled) {
      setShuffledIndices(filteredCards.map((_, i) => i));
      setIsShuffled(false);
    } else {
      const indices = filteredCards.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      setIsShuffled(true);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleNext = useCallback(() => {
    if (currentIndex < displayCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, displayCards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Toggle memorization status
  const handleToggleMemorization = (status: 'memorized' | 'not_memorized') => {
    if (currentCard && onUpdateGrammarCard) {
      onUpdateGrammarCard(currentCard.id, { memorizationStatus: status });
    }
  };

  const speakJapanese = (text: string) => {
    // Remove furigana in parentheses before speaking
    const cleanText = text.replace(/\([ぁ-んァ-ヴー]+\)/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  // Get lesson name for display
  const getLessonName = (lessonId: string): string => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return '';
    if (lesson.parentId) {
      const parent = lessons.find(l => l.id === lesson.parentId);
      return parent ? `${parent.name} > ${lesson.name}` : lesson.name;
    }
    return lesson.name;
  };

  // Handle start from level selector
  const handleStart = (lessonIds: string[], level: JLPTLevel) => {
    setSelectedLessonIds(lessonIds);
    setSelectedLevel(level);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setMemorizationFilter('all');
    setViewMode('study');
  };

  // Handle back to selection
  const handleBackToSelect = () => {
    setViewMode('select');
    setSelectedLessonIds([]);
  };

  // Update settings handlers
  const toggleFrontShow = (key: keyof typeof frontShow) => {
    setStudySettings(prev => ({
      ...prev,
      frontShow: { ...prev.frontShow, [key]: !prev.frontShow[key] }
    }));
  };

  const toggleBackShow = (key: keyof typeof backShow) => {
    setStudySettings(prev => ({
      ...prev,
      backShow: { ...prev.backShow, [key]: !prev.backShow[key] }
    }));
  };

  // Level selection screen
  if (viewMode === 'select') {
    return (
      <LevelLessonSelector
        type="grammar"
        cards={grammarCards}
        getLessonsByLevel={getLessonsByLevel}
        getChildLessons={getChildLessons}
        onStart={handleStart}
        onGoHome={onGoHome}
      />
    );
  }

  // No cards available
  if (displayCards.length === 0) {
    const emptyLevelTheme = LEVEL_THEMES[selectedLevel];
    return (
      <div className="grammar-study-page">
        <div className="study-header-compact">
          <div className="header-left-group">
            <button className="btn-back" onClick={handleBackToSelect}>
              <ArrowLeft size={18} />
            </button>
            <span className="level-badge" style={{ background: emptyLevelTheme.gradient }}>
              {selectedLevel}
            </span>
            <div className="filter-chips">
              <button
                className={`filter-chip ${memorizationFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMemorizationFilter('all')}
              >
                Tất cả
              </button>
              <button
                className={`filter-chip learned ${memorizationFilter === 'memorized' ? 'active' : ''}`}
                onClick={() => setMemorizationFilter('memorized')}
              >
                ✓ Thuộc
              </button>
              <button
                className={`filter-chip learning ${memorizationFilter === 'learning' ? 'active' : ''}`}
                onClick={() => setMemorizationFilter('learning')}
              >
                ○ Chưa
              </button>
            </div>
          </div>
        </div>
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>Không có ngữ pháp nào phù hợp</h3>
          <p>Hãy thử chọn bộ lọc khác</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const levelTheme = LEVEL_THEMES[selectedLevel];

  return (
    <div className="grammar-study-page">
      {/* Header - Compact single row */}
      <div className="study-header-compact">
        {/* Left group: Back + Level + Filters */}
        <div className="header-left-group">
          <button className="btn-back" onClick={handleBackToSelect}>
            <ArrowLeft size={18} />
          </button>
          <span className="level-badge" style={{ background: levelTheme.gradient }}>
            {selectedLevel}
          </span>
          <div className="filter-chips">
            <button
              className={`filter-chip ${memorizationFilter === 'all' ? 'active' : ''}`}
              onClick={() => setMemorizationFilter('all')}
            >
              Tất cả
            </button>
            <button
              className={`filter-chip learned ${memorizationFilter === 'memorized' ? 'active' : ''}`}
              onClick={() => setMemorizationFilter('memorized')}
            >
              ✓ Thuộc
            </button>
            <button
              className={`filter-chip learning ${memorizationFilter === 'learning' ? 'active' : ''}`}
              onClick={() => setMemorizationFilter('learning')}
            >
              ○ Chưa
            </button>
          </div>
        </div>

        {/* Right group: Actions */}
        <div className="header-actions">
          <button
            className={`action-btn shuffle-btn ${isShuffled ? 'active' : ''}`}
            onClick={handleShuffle}
            title={isShuffled ? 'Bỏ trộn' : 'Trộn thẻ'}
          >
            <Shuffle size={14} />
            <span className="btn-text">Trộn</span>
          </button>
          <button
            className="action-btn restart-btn"
            onClick={handleRestart}
            title="Học lại từ đầu"
          >
            <RotateCcw size={14} />
            <span className="btn-text">Reset</span>
          </button>
          <button
            className="header-btn settings-btn"
            onClick={() => setShowSettingsModal(true)}
            title="Cài đặt"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Card display area with side navigation */}
      <div className="study-content">
        {/* Left nav button - desktop only */}
        <button
          className="side-nav-btn side-nav-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={28} />
        </button>

        {/* Card container with swipe support */}
        {currentCard && (
          <div
            ref={cardRef}
            className={`grammar-card-container ${isFlipped ? 'flipped' : ''}`}
            onClick={handleFlip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `scale(${cardScale / 100})`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className="grammar-card"
              style={{
                '--level-glow': levelTheme.glow,
                '--front-font-size': `${frontFontSize}px`,
                '--back-font-size': `${backFontSize}px`,
              } as React.CSSProperties}
            >
              {/* Front side */}
              <div className="grammar-card-front">
                {frontShow.level && (
                  <div className="card-level-badge" style={{ background: levelTheme.gradient }}>
                    {currentCard.jlptLevel}
                  </div>
                )}
                {frontShow.lesson && (
                  <div className="card-lesson-badge">{getLessonName(currentCard.lessonId)}</div>
                )}
                <div className="card-main-content">
                  {frontShow.title && <h3 className="grammar-title">{currentCard.title}</h3>}
                  {frontShow.formula && <div className="grammar-formula">{currentCard.formula}</div>}
                  {frontShow.meaning && (
                    <div className="grammar-meaning">
                      <strong>Nghĩa:</strong> {currentCard.meaning}
                    </div>
                  )}
                  {frontShow.explanation && currentCard.explanation && (
                    <div className="grammar-explanation">
                      <strong>Giải thích:</strong> {currentCard.explanation}
                    </div>
                  )}
                  {frontShow.examples && currentCard.examples.length > 0 && (
                    <div className="grammar-examples">
                      <strong>Ví dụ:</strong>
                      {currentCard.examples.map((ex, idx) => (
                        <div key={idx} className="grammar-example">
                          <div className="example-japanese">
                            <span className="example-text">{parseFurigana(ex.japanese)}</span>
                            <button
                              className="btn-speak-small"
                              onClick={(e) => { e.stopPropagation(); speakJapanese(ex.japanese); }}
                            >
                              <Volume2 size={14} />
                            </button>
                          </div>
                          <div className="example-vietnamese">{ex.vietnamese}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="flip-hint">Nhấn để lật thẻ</p>
              </div>

              {/* Back side - split layout on desktop */}
              <div className="grammar-card-back">
                <div className="back-content-wrapper">
                  {/* Left section - meaning & explanation */}
                  <div className="back-section back-section-left">
                    {backShow.title && <h3 className="grammar-title">{currentCard.title}</h3>}
                    {backShow.formula && <div className="grammar-formula">{currentCard.formula}</div>}
                    {backShow.meaning && (
                      <div className="grammar-meaning">
                        <strong>Nghĩa:</strong> {currentCard.meaning}
                      </div>
                    )}
                    {backShow.explanation && currentCard.explanation && (
                      <div className="grammar-explanation">
                        <strong>Giải thích:</strong> {currentCard.explanation}
                      </div>
                    )}
                  </div>

                  {/* Right section - examples (desktop only) */}
                  {backShow.examples && currentCard.examples.length > 0 && (
                    <div className="back-section back-section-right">
                      <div className="grammar-examples">
                        <strong>Ví dụ:</strong>
                        {currentCard.examples.map((ex, idx) => (
                          <div key={idx} className="grammar-example">
                            <div className="example-japanese">
                              <span className="example-text">{parseFurigana(ex.japanese)}</span>
                              <button
                                className="btn-speak-small"
                                onClick={(e) => { e.stopPropagation(); speakJapanese(ex.japanese); }}
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>
                            <div className="example-vietnamese">{ex.vietnamese}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="flip-hint">Nhấn để lật thẻ</p>
              </div>
            </div>
          </div>
        )}

        {/* Right nav button - desktop only */}
        <button
          className="side-nav-btn side-nav-next"
          onClick={handleNext}
          disabled={currentIndex >= displayCards.length - 1}
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Bottom controls */}
      <div className="study-controls">
        <div className="memorization-buttons">
          <button
            className={`mem-btn not-learned ${currentCard?.memorizationStatus !== 'memorized' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleToggleMemorization('not_memorized'); }}
          >
            <Circle size={18} />
            Chưa thuộc
          </button>
          <button
            className={`mem-btn learned ${currentCard?.memorizationStatus === 'memorized' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleToggleMemorization('memorized'); }}
          >
            <CheckCircle2 size={18} />
            Đã thuộc
          </button>
        </div>

        {/* Card counter - bottom right */}
        <div className="card-counter-fixed">
          {currentIndex + 1} / {displayCards.length}
        </div>

        {/* Mobile swipe hint */}
        <p className="swipe-hint">Vuốt trái/phải để chuyển thẻ</p>
      </div>

      {/* Settings Modal - Premium Design */}
      {showSettingsModal && (
        <div className="settings-modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-modal-header">
              <div className="modal-header-icon">
                <Settings size={20} />
              </div>
              <h3>Cài đặt hiển thị</h3>
              <button className="btn-close" onClick={() => setShowSettingsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="settings-modal-content">
              {/* Front card settings */}
              <div className="settings-section">
                <div className="section-header">
                  <Eye size={18} />
                  <h4>Mặt trước thẻ</h4>
                </div>
                <div className="settings-grid">
                  {[
                    { key: 'title', label: 'Tiêu đề' },
                    { key: 'formula', label: 'Công thức' },
                    { key: 'meaning', label: 'Nghĩa' },
                  ].map(item => (
                    <label key={item.key} className={`setting-toggle ${frontShow[item.key as keyof typeof frontShow] ? 'active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={frontShow[item.key as keyof typeof frontShow]}
                        onChange={() => toggleFrontShow(item.key as keyof typeof frontShow)}
                      />
                      <span className="toggle-switch" />
                      <span className="toggle-label">{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="font-size-control">
                  <div className="font-size-label">
                    <Type size={16} />
                    <span>Cỡ chữ</span>
                  </div>
                  <div className="font-size-slider">
                    <button
                      className="font-btn"
                      onClick={() => setStudySettings(prev => ({ ...prev, frontFontSize: Math.max(12, prev.frontFontSize - 4) }))}
                    >−</button>
                    <div className="font-value">{frontFontSize}px</div>
                    <button
                      className="font-btn"
                      onClick={() => setStudySettings(prev => ({ ...prev, frontFontSize: Math.min(84, prev.frontFontSize + 4) }))}
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Back card settings */}
              <div className="settings-section">
                <div className="section-header">
                  <EyeOff size={18} />
                  <h4>Mặt sau thẻ</h4>
                </div>
                <div className="settings-grid">
                  {[
                    { key: 'title', label: 'Tiêu đề' },
                    { key: 'formula', label: 'Công thức' },
                    { key: 'meaning', label: 'Nghĩa' },
                  ].map(item => (
                    <label key={item.key} className={`setting-toggle ${backShow[item.key as keyof typeof backShow] ? 'active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={backShow[item.key as keyof typeof backShow]}
                        onChange={() => toggleBackShow(item.key as keyof typeof backShow)}
                      />
                      <span className="toggle-switch" />
                      <span className="toggle-label">{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="font-size-control">
                  <div className="font-size-label">
                    <Type size={16} />
                    <span>Cỡ chữ</span>
                  </div>
                  <div className="font-size-slider">
                    <button
                      className="font-btn"
                      onClick={() => setStudySettings(prev => ({ ...prev, backFontSize: Math.max(12, prev.backFontSize - 2) }))}
                    >−</button>
                    <div className="font-value">{backFontSize}px</div>
                    <button
                      className="font-btn"
                      onClick={() => setStudySettings(prev => ({ ...prev, backFontSize: Math.min(28, prev.backFontSize + 2) }))}
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Card size settings */}
              <div className="settings-section">
                <div className="section-header">
                  <Settings size={18} />
                  <h4>Kích thước thẻ</h4>
                </div>
                <div className="font-size-control">
                  <div className="font-size-label">
                    <span>Tỉ lệ</span>
                  </div>
                  <div className="font-size-slider">
                    <button
                      className="font-btn"
                      onClick={() => setStudySettings(prev => ({ ...prev, cardScale: Math.max(60, prev.cardScale - 5) }))}
                    >−</button>
                    <div className="font-value">{cardScale}%</div>
                    <button
                      className="font-btn"
                      onClick={() => setStudySettings(prev => ({ ...prev, cardScale: Math.min(150, prev.cardScale + 5) }))}
                    >+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .grammar-study-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    padding: 0.35rem;
    overflow: hidden;
  }

  /* Header - Compact single row */
  .study-header-compact {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 0.4rem 0.5rem;
    margin-bottom: 0.25rem;
    flex-shrink: 0;
  }

  .btn-back {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .level-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.75rem;
    color: white;
    flex-shrink: 0;
  }

  /* Header left group - back + level + filters */
  .header-left-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex: 1;
    min-width: 0;
  }

  /* Filter chips - compact inline buttons */
  .filter-chips {
    display: flex;
    gap: 0.2rem;
  }

  .filter-chip {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.65rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .filter-chip:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
  }

  .filter-chip.active {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.4);
    color: #c4b5fd;
    font-weight: 600;
  }

  .filter-chip.learned.active {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.4);
    color: #86efac;
  }

  .filter-chip.learning.active {
    background: rgba(251, 191, 36, 0.2);
    border-color: rgba(251, 191, 36, 0.4);
    color: #fde047;
  }

  /* Old header - keep for empty state */
  .study-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .header-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  /* Filter group */
  .filter-group {
    display: flex;
    gap: 0.25rem;
    margin-left: auto;
    flex-shrink: 0;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  .filter-btn.active {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.4);
    color: #c4b5fd;
  }

  .filter-btn.filter-learned.active {
    background: rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.4);
    color: #86efac;
  }

  .filter-btn.filter-learning.active {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
    color: #fca5a5;
  }

  .header-actions {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  /* Action buttons with text */
  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .action-btn.shuffle-btn.active {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3));
    border-color: rgba(139, 92, 246, 0.5);
    color: #e9d5ff;
  }

  .action-btn .btn-text {
    display: none;
  }

  @media (min-width: 500px) {
    .action-btn .btn-text {
      display: inline;
    }
  }

  .header-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .header-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .header-btn.active {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-color: transparent;
    color: white;
  }

  /* Study content */
  .study-content {
    flex: 1;
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    min-height: 0;
    overflow: hidden;
    padding: 0.25rem 0;
  }

  /* Side navigation buttons */
  .side-nav-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.8);
    flex-shrink: 0;
    align-self: center;
  }

  .side-nav-btn:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: scale(1.05);
  }

  .side-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* Card container */
  .grammar-card-container {
    flex: 1;
    perspective: 1000px;
    cursor: pointer;
    touch-action: pan-y;
    min-height: 0;
  }

  .grammar-card {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;
    transform-style: preserve-3d;
    transition: transform 0.5s ease;
  }

  .grammar-card-container.flipped .grammar-card {
    transform: rotateY(180deg);
  }

  .grammar-card-front,
  .grammar-card-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    overflow: auto;
    transition: box-shadow 0.4s ease;
  }

  .grammar-card:hover .grammar-card-front,
  .grammar-card:hover .grammar-card-back {
    box-shadow: 0 0 40px var(--level-glow);
  }

  .grammar-card-back {
    transform: rotateY(180deg);
  }

  .card-level-badge {
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    color: white;
  }

  .card-lesson-badge {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    font-size: 0.65rem;
    max-width: 50%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 1rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.2) transparent;
  }

  .card-main-content::-webkit-scrollbar {
    width: 4px;
  }

  .card-main-content::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
  }

  /* Front card font scaling - using px values */
  .grammar-card-front .grammar-title {
    font-size: var(--front-font-size, 16px);
  }

  .grammar-card-front .grammar-formula,
  .grammar-card-front .grammar-meaning,
  .grammar-card-front .grammar-explanation,
  .grammar-card-front .example-japanese {
    font-size: var(--front-font-size, 16px);
  }

  /* Back card font scaling - using px values */
  .grammar-card-back .grammar-title {
    font-size: var(--back-font-size, 22px);
  }

  .grammar-card-back .grammar-formula,
  .grammar-card-back .grammar-meaning,
  .grammar-card-back .grammar-explanation,
  .grammar-card-back .example-japanese,
  .grammar-card-back .example-vietnamese {
    font-size: var(--back-font-size, 22px);
  }

  /* Furigana (ruby) styling - positioned above kanji */
  ruby {
    ruby-position: over;
    ruby-align: center;
  }

  ruby rt {
    font-size: 0.55em;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 400;
  }

  .example-text {
    flex: 1;
    line-height: 2;
  }

  .grammar-title {
    text-align: center;
    margin: 0 0 0.5rem;
    color: white;
    font-weight: 700;
  }

  .grammar-formula {
    text-align: center;
    color: #c4b5fd;
    font-family: 'SF Mono', 'Consolas', monospace;
    background: rgba(139, 92, 246, 0.15);
    padding: 0.5rem 1rem;
    border-radius: 10px;
    margin: 0.5rem 0;
    border: 1px solid rgba(139, 92, 246, 0.3);
  }

  .grammar-meaning {
    color: rgba(255, 255, 255, 0.9);
    margin: 0.75rem 0;
    text-align: center;
    line-height: 1.5;
  }

  .grammar-meaning strong {
    color: #c4b5fd;
  }

  .grammar-explanation {
    background: rgba(255, 255, 255, 0.05);
    padding: 0.75rem 1rem;
    border-radius: 10px;
    margin: 0.5rem 0;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
    width: 100%;
    text-align: left;
  }

  .grammar-explanation strong {
    color: #c4b5fd;
  }

  .grammar-examples {
    width: 100%;
    margin-top: 0.75rem;
  }

  .grammar-examples > strong {
    font-size: 0.9rem;
    color: #c4b5fd;
  }

  .grammar-example {
    background: rgba(255, 255, 255, 0.05);
    padding: 0.6rem 0.85rem;
    border-radius: 10px;
    margin-top: 0.5rem;
    border-left: 3px solid #8b5cf6;
  }

  .example-japanese {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
  }

  .btn-speak-small {
    background: rgba(139, 92, 246, 0.2);
    border: none;
    color: #c4b5fd;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-speak-small:hover {
    background: rgba(139, 92, 246, 0.4);
  }

  .example-vietnamese {
    color: rgba(255, 255, 255, 0.6);
    margin-top: 0.25rem;
  }

  .flip-hint {
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    margin: 0;
    padding-top: 0.5rem;
    flex-shrink: 0;
  }

  /* Back content wrapper */
  .back-content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.2) transparent;
  }

  .back-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Bottom controls */
  .study-controls {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-top: 0.5rem;
    position: relative;
  }

  .memorization-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .mem-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.25rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
    max-width: 160px;
    justify-content: center;
  }

  .mem-btn.not-learned {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
  }

  .mem-btn.not-learned:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.25);
    color: white;
  }

  .mem-btn.not-learned.active {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
    color: #fca5a5;
  }

  .mem-btn.learned {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
  }

  .mem-btn.learned:hover {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: #86efac;
  }

  .mem-btn.learned.active {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
  }

  /* Card counter - fixed bottom right */
  .card-counter-fixed {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    padding: 0.35rem 0.75rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }

  .swipe-hint {
    display: none;
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    margin: 0;
  }

  /* Settings Modal - Premium Design */
  .settings-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .settings-modal {
    background: linear-gradient(145deg, #1e1e2f 0%, #151521 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    animation: slideUp 0.3s ease;
    margin-top: 0;
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .settings-modal-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
    flex-shrink: 0;
  }

  .modal-header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .settings-modal-header h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    flex: 1;
  }

  .btn-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: rotate(90deg);
  }

  .settings-modal-content {
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .settings-section {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 0.75rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .section-header svg {
    color: #8b5cf6;
  }

  .section-header h4 {
    margin: 0;
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  /* Premium Toggle Switch */
  .setting-toggle {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .setting-toggle:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .setting-toggle.active {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.3);
  }

  .setting-toggle input {
    display: none;
  }

  .toggle-switch {
    width: 36px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    position: relative;
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .setting-toggle.active .toggle-switch {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  }

  .setting-toggle.active .toggle-switch::after {
    transform: translateX(16px);
  }

  .toggle-label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    font-weight: 500;
  }

  .setting-toggle.active .toggle-label {
    color: #c4b5fd;
  }

  /* Font size control */
  .font-size-control {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
  }

  .font-size-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
  }

  .font-size-label svg {
    color: #8b5cf6;
  }

  .font-size-slider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .font-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .font-btn:hover {
    background: rgba(139, 92, 246, 0.3);
    border-color: rgba(139, 92, 246, 0.5);
    transform: scale(1.05);
  }

  .font-value {
    min-width: 50px;
    text-align: center;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    background: rgba(139, 92, 246, 0.15);
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
  }

  /* Empty State */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    gap: 1rem;
  }

  .empty-state svg {
    opacity: 0.5;
  }

  .empty-state h3 {
    margin: 0;
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .empty-state p {
    margin: 0;
    font-size: 0.9rem;
  }

  /* Desktop - split back card layout */
  @media (min-width: 900px) {
    .back-content-wrapper {
      flex-direction: row;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .back-section-left {
      flex: 1;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      padding-right: 1.5rem;
    }

    .back-section-right {
      flex: 1;
      padding-left: 0.5rem;
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .study-header-compact {
      padding: 0.35rem;
      gap: 0.35rem;
    }

    .header-left-group {
      gap: 0.3rem;
    }

    .filter-chips {
      gap: 0.15rem;
    }

    .filter-chip {
      font-size: 0.6rem;
      padding: 0.2rem 0.35rem;
      border-radius: 10px;
    }
  }

  @media (max-width: 640px) {
    .grammar-study-page {
      padding: 0.25rem;
    }

    .btn-back {
      width: 28px;
      height: 28px;
    }

    .header-btn {
      width: 28px;
      height: 28px;
    }

    .header-actions {
      gap: 0.2rem;
    }

    .level-badge {
      padding: 0.2rem 0.4rem;
      font-size: 0.65rem;
    }

    .filter-chip {
      font-size: 0.55rem;
      padding: 0.15rem 0.3rem;
    }

    /* Hide side navigation on mobile */
    .side-nav-btn {
      display: none;
    }

    /* Show swipe hint on mobile */
    .swipe-hint {
      display: block;
    }

    .grammar-card-front,
    .grammar-card-back {
      padding: 0.75rem;
      border-radius: 12px;
    }

    .memorization-buttons {
      gap: 0.35rem;
    }

    .mem-btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      max-width: 140px;
    }

    .settings-grid {
      grid-template-columns: 1fr;
    }

    .settings-modal {
      max-height: 90vh;
      border-radius: 20px;
    }
  }

  @media (max-height: 700px) {
    .card-main-content,
    .back-content-wrapper {
      padding-top: 0.75rem;
    }

    .mem-btn {
      padding: 0.4rem 0.75rem;
    }

    .study-controls {
      gap: 0.25rem;
      padding-top: 0.35rem;
    }
  }
`;
