// Main salary calculator component - orchestrates all sub-components

import { useState } from 'react';
import type { SalaryCalculatorProps } from './types';
import { CalcHeader } from './calculator-header';
import { SummarySection } from './summary-section';
import { FilterControls } from './filter-controls';
import { SalaryTable } from './salary-table';
import { useSalaryFilters } from './use-salary-filters';

export function SalaryCalculator({
  salaries,
  summary,
  month,
  onMonthChange,
  onApprove,
  onMarkPaid,
  onEdit,
  onRecalculate,
  onGenerateAll,
  loading,
}: SalaryCalculatorProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'approved' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'status'>('name');

  const filteredSalaries = useSalaryFilters(salaries, filter, sortBy);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải dữ liệu lương...
      </div>
    );
  }

  return (
    <div>
      <CalcHeader
        month={month}
        onMonthChange={onMonthChange}
        onGenerateAll={onGenerateAll}
      />

      <SummarySection summary={summary} />

      <FilterControls
        filter={filter}
        sortBy={sortBy}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
      />

      {filteredSalaries.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#f9f9f9',
          borderRadius: '12px',
          color: '#999',
        }}>
          {salaries.length === 0
            ? 'Chưa có dữ liệu lương. Bấm "Tạo lương cho tất cả" để bắt đầu.'
            : 'Không có kết quả phù hợp'}
        </div>
      ) : (
        <SalaryTable
          salaries={filteredSalaries}
          onApprove={onApprove}
          onMarkPaid={onMarkPaid}
          onEdit={onEdit}
          onRecalculate={onRecalculate}
        />
      )}
    </div>
  );
}

// Re-export types and modal for convenience
export type { SalaryWithUser, SalaryCalculatorProps } from './types';
export { SalaryEditModal } from './salary-edit-modal';
