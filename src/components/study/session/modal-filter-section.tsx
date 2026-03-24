// Filter section for settings modal (mobile only)
import type { MemorizationStatus } from '../../../types/flashcard';
import { MEMORIZATION_OPTIONS } from './constants';

interface ModalFilterSectionProps {
  filterMemorization: MemorizationStatus | 'all';
  onFilterMemorizationChange: (status: MemorizationStatus | 'all') => void;
}

export function ModalFilterSection({
  filterMemorization,
  onFilterMemorizationChange,
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
    </div>
  );
}
