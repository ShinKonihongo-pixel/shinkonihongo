// Summary section with multiple summary cards

import type { MonthlySalarySummary } from './types';
import { SummaryCard } from './summary-card';
import { formatCurrency } from '../../../types/teacher';

interface SummarySectionProps {
  summary?: MonthlySalarySummary;
}

export function SummarySection({ summary }: SummarySectionProps) {
  if (!summary) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '12px',
      marginBottom: '20px',
    }}>
      <SummaryCard
        label="Tổng giáo viên"
        value={summary.totalTeachers}
        icon="👥"
      />
      <SummaryCard
        label="Tổng giờ dạy"
        value={`${summary.totalHours.toFixed(1)}h`}
        icon="⏱"
      />
      <SummaryCard
        label="Tổng lương"
        value={formatCurrency(summary.totalAmount)}
        icon="💰"
        highlight
      />
      <SummaryCard
        label="Đã trả"
        value={`${summary.paidCount}/${summary.totalTeachers}`}
        icon="✓"
        color="#27ae60"
      />
    </div>
  );
}
