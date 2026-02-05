// Empty state when no cards match filters
import { ArrowLeft, Settings } from 'lucide-react';
import type { MemorizationStatus, DifficultyLevel } from '../../../types/flashcard';
import { MEMORIZATION_OPTIONS, DIFFICULTY_OPTIONS } from './constants';

interface EmptyStateProps {
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  filterDifficulty: DifficultyLevel | 'all';
  onFilterDifficultyChange: (level: DifficultyLevel | 'all') => void;
  onBack?: () => void;
  onSettingsClick: () => void;
}

export function EmptyState({
  filterMemorization,
  onFilterMemorizationChange,
  filterDifficulty,
  onFilterDifficultyChange,
  onBack,
  onSettingsClick,
}: EmptyStateProps) {
  return (
    <div className="study-empty">
      <h2>🎉 Không có thẻ nào cần ôn!</h2>
      <p>Bạn đã hoàn thành tất cả các thẻ hoặc không có thẻ phù hợp với bộ lọc.</p>

      <div className="study-empty-filters">
        <div className="empty-filter-group">
          <label>Trạng thái:</label>
          <select
            value={filterMemorization}
            onChange={(e) => onFilterMemorizationChange(e.target.value as typeof filterMemorization)}
            className="empty-filter-select"
          >
            {MEMORIZATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="empty-filter-group">
          <label>Độ khó:</label>
          <select
            value={filterDifficulty}
            onChange={(e) => onFilterDifficultyChange(e.target.value as typeof filterDifficulty)}
            className="empty-filter-select"
          >
            {DIFFICULTY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="study-empty-actions">
        {onBack && (
          <button className="back-btn-study" onClick={onBack}>
            <ArrowLeft size={18} /> Chọn bài khác
          </button>
        )}
        <button className="settings-btn-study" onClick={onSettingsClick}>
          <Settings size={18} /> Cài đặt
        </button>
      </div>
    </div>
  );
}
