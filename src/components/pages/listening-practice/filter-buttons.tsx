// Filter Buttons Component - Memorization status filter
import type { MemorizationFilter } from './listening-practice-types';

interface FilterButtonsProps {
  selected: MemorizationFilter;
  onChange: (filter: MemorizationFilter) => void;
}

export function FilterButtons({ selected, onChange }: FilterButtonsProps) {
  return (
    <div className="filter-buttons">
      <button
        className={`filter-btn ${selected === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        Tất cả
      </button>
      <button
        className={`filter-btn ${selected === 'learned' ? 'active' : ''}`}
        onClick={() => onChange('learned')}
      >
        Đã thuộc
      </button>
      <button
        className={`filter-btn ${selected === 'not-learned' ? 'active' : ''}`}
        onClick={() => onChange('not-learned')}
      >
        Chưa thuộc
      </button>
    </div>
  );
}
