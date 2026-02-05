// Filter section for settings modal (mobile only)
import type { MemorizationStatus, DifficultyLevel } from '../../../types/flashcard';
import { MEMORIZATION_OPTIONS, DIFFICULTY_OPTIONS } from './constants';

interface ModalFilterSectionProps {
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
  filterDifficulty: DifficultyLevel | 'all';
  onFilterDifficultyChange: (level: DifficultyLevel | 'all') => void;
}

export function ModalFilterSection({
  filterMemorization,
  onFilterMemorizationChange,
  filterDifficulty,
  onFilterDifficultyChange,
}: ModalFilterSectionProps) {
  return (
    <div className="modal-section">
      <div className="modal-section-title">Bộ lọc thẻ</div>

      <div className="modal-setting-row">
        <span className="modal-setting-label">Trạng thái</span>
        <select
          value={filterMemorization}
          onChange={(e) => onFilterMemorizationChange(e.target.value as typeof filterMemorization)}
          className="modal-select"
        >
          {MEMORIZATION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="modal-setting-row">
        <span className="modal-setting-label">Độ khó</span>
        <select
          value={filterDifficulty}
          onChange={(e) => onFilterDifficultyChange(e.target.value as typeof filterDifficulty)}
          className="modal-select"
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
