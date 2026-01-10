// Study session component with spaced repetition

import type { Flashcard, JLPTLevel, MemorizationStatus, DifficultyLevel } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import { FlashcardItem } from '../flashcard/flashcard-item';

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
  if (!currentCard) {
    return (
      <div className="study-empty">
        <h2>🎉 Không có thẻ nào cần ôn!</h2>
        <p>Bạn đã hoàn thành tất cả các thẻ đến hạn hôm nay hoặc không có thẻ phù hợp với bộ lọc.</p>
        <div className="filter-bar-inline" style={{ justifyContent: 'center' }}>
          <span>JLPT:</span>
          {JLPT_LEVELS.map(level => (
            <button
              key={level}
              className={`filter-btn ${filterLevel === level ? 'active' : ''}`}
              onClick={() => onFilterChange(level)}
            >
              {level === 'all' ? 'Tất cả' : level}
            </button>
          ))}
          <span className="filter-separator">|</span>
          <span>Trạng thái:</span>
          {MEMORIZATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-btn ${filterMemorization === opt.value ? 'active' : ''}`}
              onClick={() => onFilterMemorizationChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          <span className="filter-separator">|</span>
          <span>Độ khó:</span>
          {DIFFICULTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-btn ${filterDifficulty === opt.value ? 'active' : ''}`}
              onClick={() => onFilterDifficultyChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="study-session">
      <div className="study-header">
        <div className="filter-bar-inline">
          <span>JLPT:</span>
          {JLPT_LEVELS.map(level => (
            <button
              key={level}
              className={`filter-btn ${filterLevel === level ? 'active' : ''}`}
              onClick={() => onFilterChange(level)}
            >
              {level === 'all' ? 'Tất cả' : level}
            </button>
          ))}
          <span className="filter-separator">|</span>
          <span>Trạng thái:</span>
          {MEMORIZATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-btn ${filterMemorization === opt.value ? 'active' : ''}`}
              onClick={() => onFilterMemorizationChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          <span className="filter-separator">|</span>
          <span>Độ khó:</span>
          {DIFFICULTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-btn ${filterDifficulty === opt.value ? 'active' : ''}`}
              onClick={() => onFilterDifficultyChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          <span className="filter-separator">|</span>
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

      <div className="study-card-area">
        <div className="card-navigation">
          <button
            className="card-nav-btn"
            onClick={onPrev}
            disabled={!canGoPrev}
            title="Từ trước"
          >
            &lt;
          </button>
          <FlashcardItem
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={onFlip}
            settings={settings}
          />
          <button
            className="card-nav-btn"
            onClick={onNext}
            disabled={!canGoNext}
            title="Từ tiếp"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Footer: Memorization, Difficulty buttons and card counter */}
      <div className="action-buttons-inline">
        <div className="action-group">
          <span>Trạng thái:</span>
          <button
            className={`memo-btn memorized ${currentCard.memorizationStatus === 'memorized' ? 'active' : ''}`}
            onClick={() => onSetMemorization('memorized')}
          >
            ✓ Đã thuộc
          </button>
          <button
            className={`memo-btn not-memorized ${currentCard.memorizationStatus === 'not_memorized' ? 'active' : ''}`}
            onClick={() => onSetMemorization('not_memorized')}
          >
            ✗ Chưa thuộc
          </button>
        </div>
        <span className="action-separator">|</span>
        <div className="action-group">
          <span>Độ khó:</span>
          <button
            className={`diff-btn hard ${currentCard.difficultyLevel === 'hard' ? 'active' : ''}`}
            onClick={() => onSetDifficulty('hard')}
          >
            Khó nhớ
          </button>
          <button
            className={`diff-btn medium ${currentCard.difficultyLevel === 'medium' ? 'active' : ''}`}
            onClick={() => onSetDifficulty('medium')}
          >
            Vừa
          </button>
          <button
            className={`diff-btn easy ${currentCard.difficultyLevel === 'easy' ? 'active' : ''}`}
            onClick={() => onSetDifficulty('easy')}
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
