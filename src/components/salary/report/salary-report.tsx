// Main salary report component - orchestrates all sub-components

import { useState } from 'react';
import type { SalaryReportProps, ViewMode } from './types';
import { useSalaryData } from './use-salary-data';
import { ReportHeader } from './report-header';
import { TabButton } from './tab-button';
import { SummaryView } from './summary-view';
import { DetailView } from './detail-view';
import { ComparisonView } from './comparison-view';
import { BranchFooter } from './branch-footer';

export function SalaryReport({
  salaries,
  summary,
  branch,
  month,
  onMonthChange,
  onExport,
  loading,
}: SalaryReportProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const { salaryByRole, statusDistribution, topEarners } = useSalaryData(salaries);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải báo cáo...
      </div>
    );
  }

  return (
    <div>
      <ReportHeader
        month={month}
        onMonthChange={onMonthChange}
        onExport={onExport}
      />

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

      {/* Views */}
      {viewMode === 'summary' && (
        <SummaryView
          salaries={salaries}
          summary={summary}
          statusDistribution={statusDistribution}
          salaryByRole={salaryByRole}
          topEarners={topEarners}
        />
      )}

      {viewMode === 'detail' && <DetailView salaries={salaries} />}

      {viewMode === 'comparison' && <ComparisonView />}

      <BranchFooter branch={branch} />
    </div>
  );
}
