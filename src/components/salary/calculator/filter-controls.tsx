// Filter and sort controls for salary list

import type { FilterType, SortByType } from './types';
import { FilterBtn } from './filter-button';
import { SALARY_STATUS_COLORS } from '../../../types/teacher';

interface FilterControlsProps {
  filter: FilterType;
  sortBy: SortByType;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sort: SortByType) => void;
}

export function FilterControls({ filter, sortBy, onFilterChange, onSortChange }: FilterControlsProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <FilterBtn label="Tất cả" active={filter === 'all'} onClick={() => onFilterChange('all')} />
        <FilterBtn label="Nháp" active={filter === 'draft'} onClick={() => onFilterChange('draft')} color={SALARY_STATUS_COLORS.draft} />
        <FilterBtn label="Đã duyệt" active={filter === 'approved'} onClick={() => onFilterChange('approved')} color={SALARY_STATUS_COLORS.approved} />
        <FilterBtn label="Đã trả" active={filter === 'paid'} onClick={() => onFilterChange('paid')} color={SALARY_STATUS_COLORS.paid} />
      </div>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortByType)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '13px',
        }}
      >
        <option value="name">Sắp xếp: Tên</option>
        <option value="amount">Sắp xếp: Số tiền</option>
        <option value="status">Sắp xếp: Trạng thái</option>
      </select>
    </div>
  );
}
