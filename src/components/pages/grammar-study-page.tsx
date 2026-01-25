// Grammar study page - Practice grammar cards with flashcard-style review

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Volume2, Home, Filter } from 'lucide-react';
import type { GrammarCard, JLPTLevel, Lesson } from '../../types/flashcard';

interface GrammarStudyPageProps {
  grammarCards: GrammarCard[];
  lessons: Lesson[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onGoHome: () => void;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function GrammarStudyPage({
  grammarCards,
  lessons,
  getLessonsByLevel,
  getChildLessons,
  onGoHome,
}: GrammarStudyPageProps) {
  const [filterLevel, setFilterLevel] = useState<JLPTLevel | 'all'>('all');
  const [filterLessonId, setFilterLessonId] = useState<string | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  // Filter cards based on level and lesson
  const filteredCards = useMemo(() => {
    let result = [...grammarCards];

    if (filterLevel !== 'all') {
      result = result.filter(c => c.jlptLevel === filterLevel);
    }

    if (filterLessonId !== 'all') {
      // Include cards from selected lesson and its children
      const childLessons = getChildLessons(filterLessonId);
      const lessonIds = [filterLessonId, ...childLessons.map(l => l.id)];
      result = result.filter(c => lessonIds.includes(c.lessonId));
    }

    return result;
  }, [grammarCards, filterLevel, filterLessonId, getChildLessons]);

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

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedIds(new Set());
  }, [filterLevel, filterLessonId]);

  const handleShuffle = () => {
    if (isShuffled) {
      // Reset to original order
      setShuffledIndices(filteredCards.map((_, i) => i));
      setIsShuffled(false);
    } else {
      // Fisher-Yates shuffle
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

  // Get lessons for filter dropdown
  const lessonsForFilter = useMemo(() => {
    if (filterLevel === 'all') return lessons.filter(l => !l.parentId);
    return getLessonsByLevel(filterLevel).filter(l => !l.parentId);
  }, [filterLevel, lessons, getLessonsByLevel]);

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

  // Count by level
  const countByLevel = useMemo(() => {
    const counts: Record<string, number> = { all: grammarCards.length };
    JLPT_LEVELS.forEach(level => {
      counts[level] = grammarCards.filter(c => c.jlptLevel === level).length;
    });
    return counts;
  }, [grammarCards]);

  if (grammarCards.length === 0) {
    return (
      <div className="grammar-study-page">
        <div className="study-header">
          <button className="btn btn-back" onClick={onGoHome}>
            <Home size={18} /> Trang chủ
          </button>
          <h2>Luyện Ngữ Pháp</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>Chưa có ngữ pháp nào</h3>
          <p>Vui lòng thêm ngữ pháp ở tab Quản Lí trước</p>
        </div>
      </div>
    );
  }

  if (displayCards.length === 0) {
    return (
      <div className="grammar-study-page">
        <div className="study-header">
          <button className="btn btn-back" onClick={onGoHome}>
            <Home size={18} /> Trang chủ
          </button>
          <h2>Luyện Ngữ Pháp</h2>
        </div>
        <div className="filter-section">
          <div className="filter-row">
            <label>Level:</label>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as JLPTLevel | 'all')}>
              <option value="all">Tất cả ({countByLevel.all})</option>
              {JLPT_LEVELS.map(level => (
                <option key={level} value={level}>{level} ({countByLevel[level]})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Không có ngữ pháp nào phù hợp</h3>
          <p>Hãy thử chọn level hoặc bài học khác</p>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / displayCards.length) * 100;
  const completedCount = completedIds.size;

  return (
    <div className="grammar-study-page">
      <div className="study-header">
        <button className="btn btn-back" onClick={onGoHome}>
          <Home size={18} /> Trang chủ
        </button>
        <h2>Luyện Ngữ Pháp</h2>
        <button className="btn btn-icon" onClick={() => setShowSettings(!showSettings)} title="Bộ lọc">
          <Filter size={18} />
        </button>
      </div>

      {/* Filter section */}
      {showSettings && (
        <div className="filter-section">
          <div className="filter-row">
            <label>Level:</label>
            <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value as JLPTLevel | 'all'); setFilterLessonId('all'); }}>
              <option value="all">Tất cả ({countByLevel.all})</option>
              {JLPT_LEVELS.map(level => (
                <option key={level} value={level}>{level} ({countByLevel[level]})</option>
              ))}
            </select>
          </div>
          <div className="filter-row">
            <label>Bài học:</label>
            <select value={filterLessonId} onChange={e => setFilterLessonId(e.target.value)}>
              <option value="all">Tất cả</option>
              {lessonsForFilter.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

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
            {/* Front - Title and Formula */}
            <div className="grammar-card-front">
              <div className="grammar-level-badge">{currentCard.jlptLevel}</div>
              <div className="grammar-lesson-badge">{getLessonName(currentCard.lessonId)}</div>
              <h3 className="grammar-title">{currentCard.title}</h3>
              <div className="grammar-formula">{currentCard.formula}</div>
              <button
                className="btn btn-speak"
                onClick={(e) => { e.stopPropagation(); speakJapanese(currentCard.title); }}
                title="Phát âm"
              >
                <Volume2 size={20} />
              </button>
              <p className="flip-hint">Nhấn để xem nghĩa</p>
            </div>

            {/* Back - Meaning, Explanation, Examples */}
            <div className="grammar-card-back">
              <div className="grammar-meaning">
                <strong>Nghĩa:</strong> {currentCard.meaning}
              </div>
              {currentCard.explanation && (
                <div className="grammar-explanation">
                  <strong>Giải thích:</strong> {currentCard.explanation}
                </div>
              )}
              {currentCard.examples.length > 0 && (
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
              <p className="flip-hint">Nhấn để quay lại</p>
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
          padding: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .study-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .study-header h2 {
          flex: 1;
          margin: 0;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-section {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .filter-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .filter-row:last-child {
          margin-bottom: 0;
        }

        .filter-row label {
          min-width: 60px;
          font-weight: 500;
        }

        .filter-row select {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 6px;
        }

        .study-progress {
          margin-bottom: 1rem;
        }

        .progress-bar {
          height: 8px;
          background: var(--border-color, #e2e8f0);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--primary-color, #4a90d9);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
          margin-top: 0.5rem;
        }

        .completed-count {
          color: var(--success-color, #22c55e);
        }

        .grammar-card-container {
          perspective: 1000px;
          cursor: pointer;
          margin-bottom: 1rem;
        }

        .grammar-card {
          position: relative;
          min-height: 350px;
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
          min-height: 350px;
          backface-visibility: hidden;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .grammar-card-back {
          transform: rotateY(180deg);
          overflow-y: auto;
          max-height: 400px;
        }

        .grammar-level-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: var(--primary-color, #4a90d9);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .grammar-lesson-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--border-color, #e2e8f0);
          color: var(--text-secondary, #666);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
        }

        .grammar-title {
          text-align: center;
          font-size: 2rem;
          margin: 2rem 0 1rem;
          color: var(--text-primary, #1a1a1a);
        }

        .grammar-formula {
          text-align: center;
          font-size: 1.25rem;
          color: var(--primary-color, #4a90d9);
          font-family: monospace;
          background: var(--bg-secondary, #f5f5f5);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin: 1rem auto;
          max-width: fit-content;
        }

        .btn-speak {
          display: block;
          margin: 1rem auto;
          padding: 0.5rem 1rem;
          background: var(--primary-color, #4a90d9);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-speak:hover {
          opacity: 0.9;
        }

        .flip-hint {
          text-align: center;
          color: var(--text-secondary, #999);
          font-size: 0.875rem;
          margin-top: auto;
          position: absolute;
          bottom: 1rem;
          left: 0;
          right: 0;
        }

        .grammar-meaning {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .grammar-explanation {
          background: var(--bg-secondary, #f5f5f5);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .grammar-examples {
          margin-top: 1rem;
        }

        .grammar-example {
          background: var(--bg-secondary, #f8f9fa);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-top: 0.5rem;
          border-left: 3px solid var(--primary-color, #4a90d9);
        }

        .example-japanese {
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-speak-small {
          background: none;
          border: none;
          color: var(--primary-color, #4a90d9);
          cursor: pointer;
          padding: 0.25rem;
        }

        .example-vietnamese {
          color: var(--text-secondary, #666);
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }

        .study-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .btn-nav {
          width: 48px;
          height: 48px;
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
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-color, #ddd);
          background: var(--card-bg, #fff);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
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

        .btn-icon {
          padding: 0.5rem;
          background: none;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 8px;
          cursor: pointer;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        @media (max-width: 640px) {
          .grammar-card-front,
          .grammar-card-back {
            min-height: 300px;
          }

          .grammar-title {
            font-size: 1.5rem;
          }

          .study-actions {
            flex-direction: column;
            width: 100%;
          }

          .btn-action {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
