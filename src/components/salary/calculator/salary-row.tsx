// Salary row component for displaying individual teacher salary data

import { useState } from 'react';
import type { SalaryWithUser } from './types';
import { ActionBtn } from './action-button';
import {
  SALARY_STATUS_LABELS,
  SALARY_STATUS_COLORS,
  formatCurrency,
} from '../../../types/teacher';

interface SalaryRowProps {
  salary: SalaryWithUser;
  onApprove?: (salary: SalaryWithUser) => void;
  onMarkPaid?: (salary: SalaryWithUser) => void;
  onEdit?: (salary: SalaryWithUser) => void;
  onRecalculate?: (salary: SalaryWithUser) => void;
}

export function SalaryRow({ salary, onApprove, onMarkPaid, onEdit, onRecalculate }: SalaryRowProps) {
  const [showActions, setShowActions] = useState(false);
  const statusColor = SALARY_STATUS_COLORS[salary.status];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
        padding: '14px 16px',
        borderBottom: '1px solid #eee',
        alignItems: 'center',
        fontSize: '14px',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Teacher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: '#667eea',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '14px',
        }}>
          {salary.teacher?.avatar || (salary.teacher?.displayName || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 500 }}>
            {salary.teacher?.displayName || salary.teacher?.username || 'Giáo viên'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {salary.totalSessions} tiết
          </div>
        </div>
      </div>

      {/* Hours */}
      <div style={{ textAlign: 'center' }}>
        {salary.totalHours.toFixed(1)}h
      </div>

      {/* Base salary */}
      <div style={{ textAlign: 'right' }}>
        {formatCurrency(salary.baseSalary)}
      </div>

      {/* Bonus/Deduction */}
      <div style={{ textAlign: 'right' }}>
        {salary.bonus > 0 && (
          <span style={{ color: '#27ae60', display: 'block', fontSize: '12px' }}>
            +{formatCurrency(salary.bonus)}
          </span>
        )}
        {salary.deduction > 0 && (
          <span style={{ color: '#e74c3c', display: 'block', fontSize: '12px' }}>
            -{formatCurrency(salary.deduction)}
          </span>
        )}
        {salary.bonus === 0 && salary.deduction === 0 && (
          <span style={{ color: '#999' }}>-</span>
        )}
      </div>

      {/* Total */}
      <div style={{ textAlign: 'right', fontWeight: 600 }}>
        {formatCurrency(salary.totalAmount)}
      </div>

      {/* Status */}
      <div style={{ textAlign: 'center' }}>
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          background: `${statusColor}20`,
          color: statusColor,
        }}>
          {SALARY_STATUS_LABELS[salary.status]}
        </span>
      </div>

      {/* Actions */}
      <div style={{ minWidth: '100px', textAlign: 'right' }}>
        {showActions && (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
            {salary.status === 'draft' && onApprove && (
              <ActionBtn icon="✓" title="Duyệt" onClick={() => onApprove(salary)} />
            )}
            {salary.status === 'approved' && onMarkPaid && (
              <ActionBtn icon="💰" title="Đánh dấu đã trả" onClick={() => onMarkPaid(salary)} />
            )}
            {onEdit && (
              <ActionBtn icon="✏️" title="Sửa" onClick={() => onEdit(salary)} />
            )}
            {onRecalculate && (
              <ActionBtn icon="🔄" title="Tính lại" onClick={() => onRecalculate(salary)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
