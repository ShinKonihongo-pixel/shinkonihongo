// Study session header with filters and controls
import { ArrowLeft, Settings } from 'lucide-react';
import type { MemorizationStatus, DifficultyLevel, JLPTLevel } from '../../../types/flashcard';
import { MEMORIZATION_OPTIONS, DIFFICULTY_OPTIONS, LEVEL_COLORS } from './constants';

interface StudyHeaderProps {
  selectedLevel?: JLPTLevel;
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  filterDifficulty: DifficultyLevel | 'all';
  onFilterDifficultyChange: (level: DifficultyLevel | 'all') => void;
  currentIndex: number;
  totalCards: number;
  isShuffled: boolean;
  onShuffle: () => void;
  onResetOrder: () => void;
  onSettingsClick: () => void;
  onBack?: () => void;
  isMobile: boolean;
}

export function StudyHeader({
  selectedLevel,
  filterMemorization,
  onFilterMemorizationChange,
  filterDifficulty,
  onFilterDifficultyChange,
  currentIndex,
  totalCards,
  isShuffled,
  onShuffle,
  onResetOrder,
  onSettingsClick,
  onBack,
  isMobile,
}: StudyHeaderProps) {
  const levelColors = selectedLevel ? LEVEL_COLORS[selectedLevel] : null;

  return (
    <div className="study-header">
      <div className="filter-bar-inline">
        {onBack && (
          <button className="back-btn-study" onClick={onBack}>
            <ArrowLeft size={isMobile ? 16 : 18} />
            {!isMobile && <span>Chọn bài khác</span>}
          </button>
        )}
        {selectedLevel && levelColors && (
          <span
            className="level-badge-study"
            style={{ background: levelColors.bg, color: levelColors.text }}
          >
            {selectedLevel}
          </span>
        )}

        {!isMobile && (
          <>
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
          </>
        )}

        <div className="header-spacer" />
        {!isMobile && (
          <div className="progress-info-header">
            <span>Thẻ {currentIndex + 1} / {totalCards}</span>
          </div>
        )}
        <div className="header-actions">
          <button className="header-action-btn" onClick={onShuffle} title="Xáo trộn thẻ">
            🔀
          </button>
          <button
            className="header-action-btn"
            onClick={onResetOrder}
            title="Về thứ tự gốc"
            disabled={!isShuffled}
          >
            ↺
          </button>
          <button className="header-action-btn" onClick={onSettingsClick} title="Cài đặt">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
