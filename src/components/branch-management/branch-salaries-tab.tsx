// Branch Salaries Tab - Manage salary calculations, reports, and slips

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { SalaryCalculator } from '../salary/salary-calculator';
import { SalaryReport } from '../salary/salary-report';
import { SalarySlipPreview } from '../salary/salary-slip';
import type { BranchSalariesTabProps, SalarySubTab } from './branch-management-types';
import { EmptyState } from '../ui/empty-state';

export function BranchSalariesTab({
  salaries,
  summary,
  branch,
  selectedMonth,
  onMonthChange,
  isAdmin,
  loading,
  onApprove,
  onMarkPaid,
  onEdit,
  onRecalculate,
  onGenerateAll,
  onViewSlip,
}: BranchSalariesTabProps) {
  const [subTab, setSubTab] = useState<SalarySubTab>('calculator');

  return (
    <div className="tab-content-salaries">
      {/* Sub-tabs */}
      <div className="sub-tabs">
        <button className={`sub-tab ${subTab === 'calculator' ? 'active' : ''}`} onClick={() => setSubTab('calculator')}>
          Bảng lương
        </button>
        <button className={`sub-tab ${subTab === 'report' ? 'active' : ''}`} onClick={() => setSubTab('report')}>
          Báo cáo
        </button>
        <button className={`sub-tab ${subTab === 'slips' ? 'active' : ''}`} onClick={() => setSubTab('slips')}>
          Phiếu lương
        </button>
      </div>

      {/* Salary Calculator */}
      {subTab === 'calculator' && (
        <SalaryCalculator
          salaries={salaries}
          summary={summary ?? undefined}
          month={selectedMonth}
          onMonthChange={onMonthChange}
          onApprove={isAdmin ? onApprove : undefined}
          onMarkPaid={isAdmin ? onMarkPaid : undefined}
          onEdit={isAdmin ? onEdit : undefined}
          onRecalculate={isAdmin ? onRecalculate : undefined}
          onGenerateAll={isAdmin ? onGenerateAll : undefined}
          loading={loading}
        />
      )}

      {/* Salary Report */}
      {subTab === 'report' && (
        <SalaryReport
          salaries={salaries}
          summary={summary ?? undefined}
          branch={branch}
          month={selectedMonth}
          onMonthChange={onMonthChange}
          onExport={(format) => {
            if (format !== 'csv' || salaries.length === 0) return;
            const headers = ['Giáo viên', 'Tháng', 'Chi nhánh', 'Số giờ', 'Đơn giá (VND/h)', 'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Tổng lương', 'Trạng thái'];
            const rows = salaries.map(s => {
              const name = s.teacher?.displayName || s.teacher?.username || s.teacherId;
              const statusLabel = s.status === 'paid' ? 'Đã thanh toán' : s.status === 'approved' ? 'Đã duyệt' : 'Nháp';
              return [name, selectedMonth, branch.name, s.totalHours.toString(), s.hourlyRate.toString(), s.baseSalary.toString(), s.bonus.toString(), s.deduction.toString(), s.totalAmount.toString(), statusLabel];
            });
            const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `salary_${selectedMonth}_${branch.name}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          loading={loading}
        />
      )}

      {/* Salary Slips */}
      {subTab === 'slips' && (
        <div className="salary-slips-view">
          <div className="slips-header">
            <h3>Phiếu lương</h3>
            <input type="month" value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} />
          </div>
          {loading ? (
            <div className="loading-state">Đang tải...</div>
          ) : salaries.length === 0 ? (
            <EmptyState
              icon={<FileText size={48} strokeWidth={1.5} />}
              title="Chưa có phiếu lương cho tháng này"
              description='Vào tab "Bảng lương" và bấm "Tạo lương cho tất cả" để bắt đầu'
            />
          ) : (
            <div className="slips-grid">
              {salaries.map(salary => (
                <div key={salary.id} onClick={() => onViewSlip(salary)} className="slip-card">
                  <SalarySlipPreview salary={{ ...salary, branch }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
