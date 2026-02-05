// Mini report card for dashboard

import { formatCurrency } from '../../../types/teacher';
import type { SalaryMiniReportProps } from './types';

export function SalaryMiniReport({ summary, month, onClick }: SalaryMiniReportProps) {
  const monthDisplay = month
    ? new Date(month + '-01').toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
    : '';

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '12px', color: '#999' }}>Lương {monthDisplay}</span>
        {onClick && <span style={{ color: '#667eea' }}>→</span>}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        {formatCurrency(summary?.totalAmount || 0)}
      </div>
      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#666' }}>
        <span>{summary?.totalTeachers || 0} giáo viên</span>
        <span>•</span>
        <span>{summary?.totalHours?.toFixed(1) || 0}h</span>
        <span>•</span>
        <span style={{ color: '#27ae60' }}>{summary?.paidCount || 0} đã trả</span>
      </div>
    </div>
  );
}
