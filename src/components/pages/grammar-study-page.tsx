// Grammar study page - Practice grammar cards with flashcard-style review
// Level/lesson selection first, then study mode

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Volume2, ArrowLeft } from 'lucide-react';
import type { GrammarCard, JLPTLevel, Lesson } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import { LevelLessonSelector } from '../study/level-lesson-selector';

interface GrammarStudyPageProps {
  grammarCards: GrammarCard[];
  lessons: Lesson[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onGoHome: () => void;
  settings?: AppSettings;
}

type ViewMode = 'select' | 'study';

const LEVEL_COLORS: Record<JLPTLevel, { bg: string; text: string }> = {
  N5: { bg: '#ecfdf5', text: '#059669' },
  N4: { bg: '#eff6ff', text: '#2563eb' },
  N3: { bg: '#fef3c7', text: '#d97706' },
  N2: { bg: '#fce7f3', text: '#db2777' },
  N1: { bg: '#fef2f2', text: '#dc2626' },
};

export function GrammarStudyPage({
  grammarCards,
  lessons,
  getLessonsByLevel,
  getChildLessons,
  onGoHome,
  settings,
}: GrammarStudyPageProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>('N5');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);

  // Grammar display settings with defaults
  const frontShow = {
    title: settings?.grammarFrontShowTitle ?? true,
    formula: settings?.grammarFrontShowFormula ?? true,
    meaning: settings?.grammarFrontShowMeaning ?? false,
    explanation: settings?.grammarFrontShowExplanation ?? false,
    examples: settings?.grammarFrontShowExamples ?? false,
    level: settings?.grammarFrontShowLevel ?? true,
    lesson: settings?.grammarFrontShowLesson ?? true,
  };
  const backShow = {
    title: settings?.grammarBackShowTitle ?? false,
    formula: settings?.grammarBackShowFormula ?? false,
    meaning: settings?.grammarBackShowMeaning ?? true,
    explanation: settings?.grammarBackShowExplanation ?? true,
    examples: settings?.grammarBackShowExamples ?? true,
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  // Filter cards based on selected lessons
  const filteredCards = useMemo(() => {
    if (selectedLessonIds.length === 0) return [];

    // Get all child lesson IDs for each selected lesson
    const allLessonIds = new Set<string>();
    selectedLessonIds.forEach(lessonId => {
      allLessonIds.add(lessonId);
      const children = getChildLessons(lessonId);
      children.forEach(child => allLessonIds.add(child.id));
    });

    return grammarCards.filter(card => allLessonIds.has(card.lessonId));
  }, [grammarCards, selectedLessonIds, getChildLessons]);

  // Shuffled order
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  useEffect(() => {
    setShuffledIndices(filteredCards.map((_, i) => i));
  }, [filteredCards]);

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

  const handleNext = () => {
    if (currentIndex < displayCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkComplete = () => {
    if (currentCard) {
      setCompletedIds(prev => new Set(prev).add(currentCard.id));
      handleNext();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedIds(new Set());
  };

  const speakJapanese = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
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
    setCompletedIds(new Set());
    setViewMode('study');
  };

  // Handle back to selection
  const handleBackToSelect = () => {
    setViewMode('select');
    setSelectedLessonIds([]);
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
    return (
      <div className="grammar-study-page">
        <div className="study-header">
          <button className="btn btn-back" onClick={handleBackToSelect}>
            <ArrowLeft size={18} /> Chọn bài khác
          </button>
          <h2>Luyện Ngữ Pháp</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Không có ngữ pháp nào phù hợp</h3>
          <p>Hãy thử chọn bài học khác</p>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / displayCards.length) * 100;
  const completedCount = completedIds.size;
  const levelColors = LEVEL_COLORS[selectedLevel];

  return (
    <div className="grammar-study-page">
      <div className="study-header">
        <button className="btn btn-back" onClick={handleBackToSelect}>
          <ArrowLeft size={18} /> Chọn bài khác
        </button>
        <span
          className="level-badge-grammar"
          style={{ background: levelColors.bg, color: levelColors.text }}
        >
          {selectedLevel}
        </span>
        <h2>Luyện Ngữ Pháp</h2>
      </div>

      {/* Progress bar */}
      <div className="study-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          {currentIndex + 1} / {displayCards.length}
          {completedCount > 0 && <span className="completed-count"> ({completedCount} đã học)</span>}
        </div>
      </div>

      {/* Card display */}
      {currentCard && (
        <div className={`grammar-card-container ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
          <div className="grammar-card">
            {/* Front side */}
            <div className="grammar-card-front">
              {frontShow.level && <div className="grammar-level-badge">{currentCard.jlptLevel}</div>}
              {frontShow.lesson && <div className="grammar-lesson-badge">{getLessonName(currentCard.lessonId)}</div>}
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
                        {ex.japanese}
                        <button
                          className="btn btn-speak-small"
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
              <button
                className="btn btn-speak"
                onClick={(e) => { e.stopPropagation(); speakJapanese(currentCard.title); }}
                title="Phát âm"
              >
                <Volume2 size={20} />
              </button>
              <p className="flip-hint">Nhấn để lật thẻ</p>
            </div>

            {/* Back side */}
            <div className="grammar-card-back">
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
              {backShow.examples && currentCard.examples.length > 0 && (
                <div className="grammar-examples">
                  <strong>Ví dụ:</strong>
                  {currentCard.examples.map((ex, idx) => (
                    <div key={idx} className="grammar-example">
                      <div className="example-japanese">
                        {ex.japanese}
                        <button
                          className="btn btn-speak-small"
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
              <p className="flip-hint">Nhấn để lật thẻ</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="study-controls">
        <button className="btn btn-nav" onClick={handlePrev} disabled={currentIndex === 0}>
          <ChevronLeft size={24} />
        </button>

        <div className="study-actions">
          <button className="btn btn-action" onClick={handleShuffle} title={isShuffled ? 'Bỏ trộn' : 'Trộn thẻ'}>
            <Shuffle size={18} />
            {isShuffled ? 'Bỏ trộn' : 'Trộn'}
          </button>
          <button className="btn btn-action btn-complete" onClick={handleMarkComplete} disabled={!currentCard}>
            Đã học ✓
          </button>
          <button className="btn btn-action" onClick={handleRestart} title="Học lại từ đầu">
            <RotateCcw size={18} />
            Học lại
          </button>
        </div>

        <button className="btn btn-nav" onClick={handleNext} disabled={currentIndex >= displayCards.length - 1}>
          <ChevronRight size={24} />
        </button>
      </div>

      <style>{`
        .grammar-study-page {
          padding: 0.5rem;
          max-width: 100%;
          margin: 0 auto;
        }

        .study-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          padding: 0 0.25rem;
        }

        .study-header h2 {
          flex: 1;
          margin: 0;
          font-size: 1.1rem;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.35rem 0.5rem;
          font-size: 0.85rem;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #ddd);
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-back:hover {
          background: var(--bg-secondary, #f5f5f5);
        }

        .level-badge-grammar {
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .study-progress {
          margin-bottom: 0.5rem;
          padding: 0 0.25rem;
        }

        .progress-bar {
          height: 6px;
          background: var(--border-color, #e2e8f0);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--primary-color, #4a90d9);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-secondary, #666);
          margin-top: 0.25rem;
        }

        .completed-count {
          color: var(--success-color, #22c55e);
        }

        .grammar-card-container {
          perspective: 1000px;
          cursor: pointer;
          margin-bottom: 0.5rem;
        }

        .grammar-card {
          position: relative;
          min-height: 280px;
          transform-style: preserve-3d;
          transition: transform 0.5s ease;
        }

        .grammar-card-container.flipped .grammar-card {
          transform: rotateY(180deg);
        }

        .grammar-card-front,
        .grammar-card-back {
          position: absolute;
          width: 100%;
          min-height: 280px;
          backface-visibility: hidden;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          padding: 0.75rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
        }

        .grammar-card-back {
          transform: rotateY(180deg);
          overflow-y: auto;
          max-height: 350px;
        }

        .grammar-level-badge {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          background: var(--primary-color, #4a90d9);
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .grammar-lesson-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: var(--border-color, #e2e8f0);
          color: var(--text-secondary, #666);
          padding: 0.15rem 0.5rem;
          border-radius: 8px;
          font-size: 0.7rem;
          max-width: 45%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .grammar-title {
          text-align: center;
          font-size: 1.6rem;
          margin: 1.5rem 0 0.5rem;
          color: var(--text-primary, #1a1a1a);
        }

        .grammar-formula {
          text-align: center;
          font-size: 1rem;
          color: var(--primary-color, #4a90d9);
          font-family: monospace;
          background: var(--bg-secondary, #f5f5f5);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          margin: 0.5rem auto;
          max-width: fit-content;
        }

        .btn-speak {
          display: block;
          margin: 0.5rem auto;
          padding: 0.35rem 0.75rem;
          background: var(--primary-color, #4a90d9);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .btn-speak:hover {
          opacity: 0.9;
        }

        .flip-hint {
          text-align: center;
          color: var(--text-secondary, #999);
          font-size: 0.75rem;
          margin-top: auto;
          padding-top: 0.5rem;
        }

        .grammar-meaning {
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .grammar-explanation {
          background: var(--bg-secondary, #f5f5f5);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          line-height: 1.5;
          font-size: 0.9rem;
        }

        .grammar-examples {
          margin-top: 0.5rem;
        }

        .grammar-examples > strong {
          font-size: 0.9rem;
        }

        .grammar-example {
          background: var(--bg-secondary, #f8f9fa);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          margin-top: 0.35rem;
          border-left: 2px solid var(--primary-color, #4a90d9);
        }

        .example-japanese {
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .btn-speak-small {
          background: none;
          border: none;
          color: var(--primary-color, #4a90d9);
          cursor: pointer;
          padding: 0.15rem;
        }

        .example-vietnamese {
          color: var(--text-secondary, #666);
          font-size: 0.85rem;
          margin-top: 0.15rem;
        }

        .study-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0 0.25rem;
        }

        .btn-nav {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #ddd);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-nav:hover:not(:disabled) {
          background: var(--primary-color, #4a90d9);
          color: white;
          border-color: var(--primary-color, #4a90d9);
        }

        .btn-nav:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .study-actions {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.35rem 0.6rem;
          border: 1px solid var(--border-color, #ddd);
          background: var(--card-bg, #fff);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }

        .btn-action:hover:not(:disabled) {
          border-color: var(--primary-color, #4a90d9);
          color: var(--primary-color, #4a90d9);
        }

        .btn-complete {
          background: var(--success-color, #22c55e);
          color: white;
          border-color: var(--success-color, #22c55e);
        }

        .btn-complete:hover:not(:disabled) {
          background: #16a34a;
          border-color: #16a34a;
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 2rem 1rem;
        }

        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }

        @media (max-width: 640px) {
          .grammar-study-page {
            padding: 0.35rem;
          }

          .grammar-card {
            min-height: 250px;
          }

          .grammar-card-front,
          .grammar-card-back {
            min-height: 250px;
            padding: 0.5rem;
          }

          .grammar-title {
            font-size: 1.4rem;
            margin: 1.25rem 0 0.35rem;
          }

          .grammar-formula {
            font-size: 0.9rem;
          }

          .study-actions {
            gap: 0.25rem;
          }

          .btn-action {
            padding: 0.3rem 0.5rem;
            font-size: 0.75rem;
          }

          .btn-nav {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </div>
  );
}
