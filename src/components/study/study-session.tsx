// Study session component with spaced repetition

import { useState, useEffect } from 'react';
import type { Flashcard, JLPTLevel, MemorizationStatus, DifficultyLevel } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import { FlashcardItem } from '../flashcard/flashcard-item';

// Check if current screen is mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

interface StudySessionProps {
  currentCard: Flashcard | undefined;
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onSetMemorization: (status: MemorizationStatus) => void;
  onSetDifficulty: (level: DifficultyLevel) => void;
  filterLevel: JLPTLevel | 'all';
  onFilterChange: (level: JLPTLevel | 'all') => void;
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  filterDifficulty: DifficultyLevel | 'all';
  onFilterDifficultyChange: (level: DifficultyLevel | 'all') => void;
  onShuffle: () => void;
  onResetOrder: () => void;
  isShuffled: boolean;
  clickCount: number;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  settings: AppSettings;
}

const JLPT_LEVELS: (JLPTLevel | 'all')[] = ['all', 'N5', 'N4', 'N3', 'N2', 'N1'];

const MEMORIZATION_OPTIONS: { value: MemorizationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unset', label: 'Chưa đánh giá' },
  { value: 'memorized', label: 'Đã thuộc' },
  { value: 'not_memorized', label: 'Chưa thuộc' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unset', label: 'Chưa đánh giá' },
  { value: 'super_hard', label: 'Siêu khó' },
  { value: 'hard', label: 'Khó nhớ' },
  { value: 'medium', label: 'Vừa' },
  { value: 'easy', label: 'Dễ nhớ' },
];

export function StudySession({
  currentCard,
  currentIndex,
  totalCards,
  isFlipped,
  onFlip,
  onSetMemorization,
  onSetDifficulty,
  filterLevel,
  onFilterChange,
  filterMemorization,
  onFilterMemorizationChange,
  filterDifficulty,
  onFilterDifficultyChange,
  onShuffle,
  onResetOrder,
  isShuffled,
  clickCount,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  settings,
}: StudySessionProps) {
  const isMobile = useIsMobile();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Handle memorization button click - toggle on/off
  const handleMemorizationClick = (status: MemorizationStatus) => {
    if (currentCard?.memorizationStatus === status) {
      onSetMemorization('unset');
    } else {
      onSetMemorization(status);
    }
  };

  // Handle difficulty button click - toggle on/off
  const handleDifficultyClick = (level: DifficultyLevel) => {
    if (currentCard?.difficultyLevel === level) {
      onSetDifficulty('unset');
    } else {
      onSetDifficulty(level);
    }
  };

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && canGoNext) {
      onNext();
    } else if (isRightSwipe && canGoPrev) {
      onPrev();
    }
  };

  if (!currentCard) {
    return (
      <div className="study-empty">
        <h2>🎉 Không có thẻ nào cần ôn!</h2>
        <p>Bạn đã hoàn thành tất cả các thẻ đến hạn hôm nay hoặc không có thẻ phù hợp với bộ lọc.</p>
        <div className="filter-bar-inline">
          <span className="filter-label">JLPT:</span>
          <select
            value={filterLevel}
            onChange={(e) => onFilterChange(e.target.value as typeof filterLevel)}
            className="filter-select"
          >
            {JLPT_LEVELS.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? 'Tất cả' : level}
              </option>
            ))}
          </select>
          <span className="filter-label">Trạng thái:</span>
          <select
            value={filterMemorization}
            onChange={(e) => onFilterMemorizationChange(e.target.value as typeof filterMemorization)}
            className="filter-select"
          >
            {MEMORIZATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="filter-label">Độ khó:</span>
          <select
            value={filterDifficulty}
            onChange={(e) => onFilterDifficultyChange(e.target.value as typeof filterDifficulty)}
            className="filter-select"
          >
            {DIFFICULTY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="study-session">
      <div className="study-header">
        {/* Desktop: select dropdowns */}
        <div className="filter-bar-inline filter-desktop">
          <span className="filter-label">JLPT:</span>
          <select
            value={filterLevel}
            onChange={(e) => onFilterChange(e.target.value as typeof filterLevel)}
            className="filter-select"
          >
            {JLPT_LEVELS.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? 'Tất cả' : level}
              </option>
            ))}
          </select>
          <span className="filter-label">Trạng thái:</span>
          <select
            value={filterMemorization}
            onChange={(e) => onFilterMemorizationChange(e.target.value as typeof filterMemorization)}
            className="filter-select"
          >
            {MEMORIZATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="filter-label">Độ khó:</span>
          <select
            value={filterDifficulty}
            onChange={(e) => onFilterDifficultyChange(e.target.value as typeof filterDifficulty)}
            className="filter-select"
          >
            {DIFFICULTY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            className="filter-btn shuffle-btn"
            onClick={onShuffle}
            title="Xáo trộn thẻ"
          >
            🔀 Xáo trộn
          </button>
          <button
            className="filter-btn reset-btn"
            onClick={onResetOrder}
            title="Về thứ tự gốc"
            disabled={!isShuffled}
          >
            ↺ Reset
          </button>
        </div>

        {/* Mobile/Tablet: select dropdowns */}
        <div className="filter-bar-mobile">
          <div className="filter-group">
            <span className="filter-label">JLPT:</span>
            <select
              value={filterLevel}
              onChange={(e) => onFilterChange(e.target.value as typeof filterLevel)}
              className="filter-select"
            >
              {JLPT_LEVELS.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'Tất cả' : level}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Trạng thái:</span>
            <select
              value={filterMemorization}
              onChange={(e) => onFilterMemorizationChange(e.target.value as typeof filterMemorization)}
              className="filter-select"
            >
              {MEMORIZATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Độ khó:</span>
            <select
              value={filterDifficulty}
              onChange={(e) => onFilterDifficultyChange(e.target.value as typeof filterDifficulty)}
              className="filter-select"
            >
              {DIFFICULTY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions-mobile">
            <button
              className="filter-btn shuffle-btn"
              onClick={onShuffle}
              title="Xáo trộn thẻ"
            >
              🔀 Xáo trộn
            </button>
            <button
              className="filter-btn reset-btn"
              onClick={onResetOrder}
              title="Về thứ tự gốc"
              disabled={!isShuffled}
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      <div
        className="study-card-area"
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
      >
        <div className="card-navigation">
          {!isMobile && (
            <button
              className="card-nav-btn"
              onClick={onPrev}
              disabled={!canGoPrev}
              title="Từ trước"
            >
              &lt;
            </button>
          )}
          <FlashcardItem
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={onFlip}
            settings={settings}
          />
          {!isMobile && (
            <button
              className="card-nav-btn"
              onClick={onNext}
              disabled={!canGoNext}
              title="Từ tiếp"
            >
              &gt;
            </button>
          )}
        </div>
        {isMobile && (
          <p className="swipe-hint">← Vuốt để chuyển thẻ →</p>
        )}
      </div>

      {/* Footer: Memorization, Difficulty buttons and card counter */}
      <div className="action-buttons-inline">
        <div className="action-group">
          <span>Trạng thái:</span>
          <button
            className={`memo-btn memorized ${currentCard.memorizationStatus === 'memorized' ? 'active' : ''}`}
            onClick={() => handleMemorizationClick('memorized')}
          >
            ✓ Đã thuộc
          </button>
          <button
            className={`memo-btn not-memorized ${currentCard.memorizationStatus === 'not_memorized' ? 'active' : ''}`}
            onClick={() => handleMemorizationClick('not_memorized')}
          >
            ✗ Chưa thuộc
          </button>
        </div>
        <span className="action-separator">|</span>
        <div className="action-group">
          <span>Độ khó:</span>
          <button
            className={`diff-btn super-hard ${currentCard.difficultyLevel === 'super_hard' ? 'active' : ''}`}
            onClick={() => handleDifficultyClick('super_hard')}
          >
            💀 Siêu khó
          </button>
          <button
            className={`diff-btn hard ${currentCard.difficultyLevel === 'hard' ? 'active' : ''}`}
            onClick={() => handleDifficultyClick('hard')}
          >
            Khó nhớ
          </button>
          <button
            className={`diff-btn medium ${currentCard.difficultyLevel === 'medium' ? 'active' : ''}`}
            onClick={() => handleDifficultyClick('medium')}
          >
            Vừa
          </button>
          <button
            className={`diff-btn easy ${currentCard.difficultyLevel === 'easy' ? 'active' : ''}`}
            onClick={() => handleDifficultyClick('easy')}
          >
            Dễ nhớ
          </button>
        </div>
        <div className="progress-info-right">
          <span>Thẻ {currentIndex + 1} / {totalCards}</span>
          {settings.autoAdvanceOnThirdClick && (
            <span className="click-count">Nhấp: {clickCount}/{settings.clicksToAdvance}</span>
          )}
        </div>
      </div>
    </div>
  );
}
