// Branch Salaries Tab - Manage salary calculations, reports, and slips

import { useState } from 'react';
import { SalaryCalculator } from '../salary/salary-calculator';
import { SalaryReport } from '../salary/salary-report';
import { SalarySlipPreview } from '../salary/salary-slip';
import type { BranchSalariesTabProps, SalarySubTab } from './branch-management-types';

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
          onExport={(format) => console.log('Export as', format)}
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
            <div className="empty-state">
              <p>Chưa có phiếu lương cho tháng này</p>
              <p className="hint">Vào tab "Bảng lương" và bấm "Tạo lương cho tất cả" để bắt đầu</p>
            </div>
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
