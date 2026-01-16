// Salary report component - Monthly/yearly salary summary and reports

import { useMemo, useState } from 'react';
import type { Salary, MonthlySalarySummary } from '../../types/teacher';
import type { User } from '../../types/user';
import type { Branch } from '../../types/branch';
import {
  SALARY_STATUS_LABELS,
  SALARY_STATUS_COLORS,
  formatCurrency,
} from '../../types/teacher';
import { BRANCH_MEMBER_ROLE_LABELS } from '../../types/branch';

interface SalaryWithUser extends Salary {
  teacher?: User;
}

interface SalaryReportProps {
  salaries: SalaryWithUser[];
  summary?: MonthlySalarySummary;
  branch?: Branch;
  month: string;
  onMonthChange: (month: string) => void;
  onExport?: (format: 'csv' | 'pdf') => void;
  loading?: boolean;
}

export function SalaryReport({
  salaries,
  summary,
  branch,
  month,
  onMonthChange,
  onExport,
  loading,
}: SalaryReportProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'detail' | 'comparison'>('summary');

  // Group salaries by role
  const salaryByRole = useMemo(() => {
    const grouped: Record<string, { count: number; totalAmount: number; totalHours: number }> = {};

    salaries.forEach(salary => {
      const role = salary.teacher?.role || 'unknown';
      if (!grouped[role]) {
        grouped[role] = { count: 0, totalAmount: 0, totalHours: 0 };
      }
      grouped[role].count++;
      grouped[role].totalAmount += salary.totalAmount;
      grouped[role].totalHours += salary.totalHours;
    });

    return grouped;
  }, [salaries]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    return {
      draft: salaries.filter(s => s.status === 'draft').length,
      approved: salaries.filter(s => s.status === 'approved').length,
      paid: salaries.filter(s => s.status === 'paid').length,
    };
  }, [salaries]);

  // Top earners
  const topEarners = useMemo(() => {
    return [...salaries]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  }, [salaries]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải báo cáo...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ margin: 0 }}>Báo cáo lương</h3>
          <input
            type="month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          />
        </div>
        {onExport && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onExport('csv')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📊</span> Xuất CSV
            </button>
            <button
              onClick={() => onExport('pdf')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📄</span> Xuất PDF
            </button>
          </div>
        )}
      </div>

      {/* View mode tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        padding: '4px',
        background: '#f5f5f5',
        borderRadius: '10px',
        width: 'fit-content',
      }}>
        <TabButton
          label="Tổng quan"
          active={viewMode === 'summary'}
          onClick={() => setViewMode('summary')}
        />
        <TabButton
          label="Chi tiết"
          active={viewMode === 'detail'}
          onClick={() => setViewMode('detail')}
        />
        <TabButton
          label="So sánh"
          active={viewMode === 'comparison'}
          onClick={() => setViewMode('comparison')}
        />
      </div>

      {/* Summary view */}
      {viewMode === 'summary' && (
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
      )}

      {/* Detail view */}
      {viewMode === 'detail' && (
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
      )}

      {/* Comparison view - placeholder for future charts */}
      {viewMode === 'comparison' && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <h4 style={{ margin: '0 0 8px 0' }}>So sánh theo tháng</h4>
          <p style={{ color: '#999', margin: 0 }}>
            Tính năng so sánh lương theo tháng sẽ được cập nhật trong phiên bản tiếp theo.
          </p>
        </div>
      )}

      {/* Branch info footer */}
      {branch && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f9f9f9',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666',
        }}>
          <div>
            <strong>{branch.name}</strong>
            {branch.address && ` • ${branch.address}`}
          </div>
          <div>
            Báo cáo tạo ngày: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      )}
    </div>
  );
}

// Mini report card for dashboard
interface SalaryMiniReportProps {
  summary?: MonthlySalarySummary;
  month: string;
  onClick?: () => void;
}

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

// Helper components
interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        background: active ? '#fff' : 'transparent',
        color: active ? '#333' : '#666',
        fontWeight: active ? 600 : 400,
        fontSize: '13px',
        cursor: 'pointer',
        boxShadow: active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: string;
  gradient?: boolean;
}

function StatCard({ label, value, sublabel, icon, gradient }: StatCardProps) {
  return (
    <div style={{
      padding: '20px',
      borderRadius: '12px',
      background: gradient
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : '#fff',
      color: gradient ? '#fff' : '#333',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>{label}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700 }}>
        {value}
        {sublabel && (
          <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px', opacity: 0.8 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

interface StatusBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function StatusBar({ label, count, total, color }: StatusBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
        fontSize: '12px',
      }}>
        <span>{label}</span>
        <span style={{ color }}>{count}/{total}</span>
      </div>
      <div style={{
        height: '8px',
        background: '#eee',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRadius: '4px',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
}
