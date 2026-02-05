// Detail view showing salary breakdown table

import {
  SALARY_STATUS_COLORS,
  SALARY_STATUS_LABELS,
  formatCurrency,
} from '../../../types/teacher';
import { BRANCH_MEMBER_ROLE_LABELS } from '../../../types/branch';
import type { SalaryWithUser } from './types';

interface DetailViewProps {
  salaries: SalaryWithUser[];
}

export function DetailView({ salaries }: DetailViewProps) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Giáo viên</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600 }}>Vai trò</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600 }}>Số giờ</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600 }}>Số tiết</th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>Lương CB</th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>Thưởng</th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>Trừ</th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>Tổng</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>TT</th>
          </tr>
        </thead>
        <tbody>
          {salaries.map(salary => (
            <tr key={salary.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 500 }}>
                  {salary.teacher?.displayName || salary.teacher?.username || '-'}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>{salary.teacher?.email}</div>
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '11px' }}>
                {BRANCH_MEMBER_ROLE_LABELS[salary.teacher?.role as keyof typeof BRANCH_MEMBER_ROLE_LABELS] || '-'}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                {salary.totalHours.toFixed(1)}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                {salary.totalSessions}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                {formatCurrency(salary.baseSalary)}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', color: salary.bonus > 0 ? '#27ae60' : '#999' }}>
                {salary.bonus > 0 ? `+${formatCurrency(salary.bonus)}` : '-'}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', color: salary.deduction > 0 ? '#e74c3c' : '#999' }}>
                {salary.deduction > 0 ? `-${formatCurrency(salary.deduction)}` : '-'}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                {formatCurrency(salary.totalAmount)}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 500,
                  background: `${SALARY_STATUS_COLORS[salary.status]}20`,
                  color: SALARY_STATUS_COLORS[salary.status],
                }}>
                  {SALARY_STATUS_LABELS[salary.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f9f9f9', fontWeight: 600 }}>
            <td style={{ padding: '12px 16px' }} colSpan={2}>Tổng cộng</td>
            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
              {salaries.reduce((sum, s) => sum + s.totalHours, 0).toFixed(1)}
            </td>
            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
              {salaries.reduce((sum, s) => sum + s.totalSessions, 0)}
            </td>
            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
              {formatCurrency(salaries.reduce((sum, s) => sum + s.baseSalary, 0))}
            </td>
            <td style={{ padding: '12px 8px', textAlign: 'right', color: '#27ae60' }}>
              +{formatCurrency(salaries.reduce((sum, s) => sum + s.bonus, 0))}
            </td>
            <td style={{ padding: '12px 8px', textAlign: 'right', color: '#e74c3c' }}>
              -{formatCurrency(salaries.reduce((sum, s) => sum + s.deduction, 0))}
            </td>
            <td style={{ padding: '12px 8px', textAlign: 'right', color: '#667eea' }}>
              {formatCurrency(salaries.reduce((sum, s) => sum + s.totalAmount, 0))}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
