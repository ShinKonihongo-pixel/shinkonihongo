// Salary table component with header, rows, and footer

import type { SalaryWithUser } from './types';
import { SalaryRow } from './salary-row';
import { formatCurrency } from '../../../types/teacher';

interface SalaryTableProps {
  salaries: SalaryWithUser[];
  onApprove?: (salary: SalaryWithUser) => void;
  onMarkPaid?: (salary: SalaryWithUser) => void;
  onEdit?: (salary: SalaryWithUser) => void;
  onRecalculate?: (salary: SalaryWithUser) => void;
}

export function SalaryTable({ salaries, onApprove, onMarkPaid, onEdit, onRecalculate }: SalaryTableProps) {
  if (salaries.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: '#f9f9f9',
        borderRadius: '12px',
        color: '#999',
      }}>
        Không có kết quả phù hợp
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
        padding: '12px 16px',
        background: '#f5f5f5',
        fontWeight: 600,
        fontSize: '13px',
        color: '#666',
      }}>
        <div>Giáo viên</div>
        <div style={{ textAlign: 'center' }}>Số giờ</div>
        <div style={{ textAlign: 'right' }}>Lương cơ bản</div>
        <div style={{ textAlign: 'right' }}>Thưởng/Trừ</div>
        <div style={{ textAlign: 'right' }}>Tổng</div>
        <div style={{ textAlign: 'center' }}>Trạng thái</div>
        <div></div>
      </div>

      {/* Table rows */}
      {salaries.map(salary => (
        <SalaryRow
          key={salary.id}
          salary={salary}
          onApprove={onApprove}
          onMarkPaid={onMarkPaid}
          onEdit={onEdit}
          onRecalculate={onRecalculate}
        />
      ))}

      {/* Table footer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
        padding: '12px 16px',
        background: '#f9f9f9',
        fontWeight: 600,
        fontSize: '14px',
        borderTop: '2px solid #eee',
      }}>
        <div>Tổng cộng</div>
        <div style={{ textAlign: 'center' }}>
          {salaries.reduce((sum, s) => sum + s.totalHours, 0).toFixed(1)}h
        </div>
        <div style={{ textAlign: 'right' }}>
          {formatCurrency(salaries.reduce((sum, s) => sum + s.baseSalary, 0))}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: '#27ae60' }}>
            +{formatCurrency(salaries.reduce((sum, s) => sum + s.bonus, 0))}
          </span>
          {' / '}
          <span style={{ color: '#e74c3c' }}>
            -{formatCurrency(salaries.reduce((sum, s) => sum + s.deduction, 0))}
          </span>
        </div>
        <div style={{ textAlign: 'right', color: '#667eea' }}>
          {formatCurrency(salaries.reduce((sum, s) => sum + s.totalAmount, 0))}
        </div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
