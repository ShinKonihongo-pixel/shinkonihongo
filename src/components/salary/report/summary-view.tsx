// Summary view showing statistics and top earners

import type { MonthlySalarySummary } from '../../../types/teacher';
import {
  SALARY_STATUS_COLORS,
  formatCurrency,
} from '../../../types/teacher';
import { BRANCH_MEMBER_ROLE_LABELS } from '../../../types/branch';
import { StatCard } from './stat-card';
import { StatusBar } from './status-bar';
import type { SalaryWithUser, StatusDistribution, RoleData } from './types';

interface SummaryViewProps {
  salaries: SalaryWithUser[];
  summary?: MonthlySalarySummary;
  statusDistribution: StatusDistribution;
  salaryByRole: Record<string, RoleData>;
  topEarners: SalaryWithUser[];
}

export function SummaryView({
  salaries,
  summary,
  statusDistribution,
  salaryByRole,
  topEarners,
}: SummaryViewProps) {
  return (
    <div>
      {/* Main stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatCard
          label="Tổng chi lương"
          value={formatCurrency(summary?.totalAmount || 0)}
          icon="💰"
          gradient
        />
        <StatCard
          label="Số giáo viên"
          value={summary?.totalTeachers?.toString() || '0'}
          sublabel="người"
          icon="👥"
        />
        <StatCard
          label="Tổng giờ dạy"
          value={summary?.totalHours?.toFixed(1) || '0'}
          sublabel="giờ"
          icon="⏱"
        />
        <StatCard
          label="Lương TB/người"
          value={formatCurrency(summary?.totalTeachers ? (summary.totalAmount / summary.totalTeachers) : 0)}
          icon="📊"
        />
      </div>

      {/* Status distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {/* Payment status */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
            Trạng thái thanh toán
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <StatusBar
              label="Đã trả"
              count={statusDistribution.paid}
              total={salaries.length}
              color={SALARY_STATUS_COLORS.paid}
            />
            <StatusBar
              label="Đã duyệt"
              count={statusDistribution.approved}
              total={salaries.length}
              color={SALARY_STATUS_COLORS.approved}
            />
            <StatusBar
              label="Nháp"
              count={statusDistribution.draft}
              total={salaries.length}
              color={SALARY_STATUS_COLORS.draft}
            />
          </div>
        </div>

        {/* By role */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
            Theo vai trò
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(salaryByRole).map(([role, data]) => (
              <div
                key={role}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    {BRANCH_MEMBER_ROLE_LABELS[role as keyof typeof BRANCH_MEMBER_ROLE_LABELS] || role}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    {data.count} người • {data.totalHours.toFixed(1)}h
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: '#667eea' }}>
                  {formatCurrency(data.totalAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top earners */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
          Top 5 lương cao nhất
        </h4>
        {topEarners.map((salary, index) => (
          <div
            key={salary.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              borderBottom: index < topEarners.length - 1 ? '1px solid #eee' : 'none',
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : '#eee',
              color: index < 3 ? '#fff' : '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
            }}>
              {index + 1}
            </div>
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
              {(salary.teacher?.displayName || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>
                {salary.teacher?.displayName || salary.teacher?.username || '-'}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {salary.totalHours.toFixed(1)}h • {salary.totalSessions} tiết
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>
              {formatCurrency(salary.totalAmount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
