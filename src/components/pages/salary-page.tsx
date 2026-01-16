// Salary management page - For branch admins to manage teacher salaries

import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useBranches, useCurrentBranch, useBranchMembers } from '../../hooks/use-branches';
import { useSalaries, useTeachingSessions } from '../../hooks/use-teachers';
import { SalaryCalculator, SalaryEditModal } from '../salary/salary-calculator';
import { SalarySlip, SalarySlipPreview } from '../salary/salary-slip';
import { SalaryReport } from '../salary/salary-report';
import { BranchSelector } from '../branch/branch-selector';
import type { Salary } from '../../types/teacher';
import type { User } from '../../types/user';

type ViewMode = 'calculator' | 'report' | 'slips';

interface SalaryPageProps {
  users: User[];
}

export function SalaryPage({ users }: SalaryPageProps) {
  const { currentUser } = useAuth();
  const isBranchAdmin = currentUser?.role === 'branch_admin' || currentUser?.role === 'director' || currentUser?.role === 'super_admin';

  // Branch selection
  const { branches } = useBranches(currentUser?.id || null, true);
  const { currentBranch, setCurrentBranch } = useCurrentBranch();

  // Branch members - hook call needed for side effects
  useBranchMembers(currentBranch?.id || null, users);

  // Current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Teaching sessions for the month
  useTeachingSessions(
    currentBranch?.id || null,
    undefined,
    selectedMonth
  );

  // Salaries
  const {
    salariesWithUsers,
    summary,
    loading,
    updateSalary,
    approveSalary,
    markAsPaid,
    recalculateSalary,
    generateAllSalaries,
  } = useSalaries(currentBranch?.id || null, selectedMonth, users);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('calculator');
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [viewingSalary, setViewingSalary] = useState<Salary | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // Handle approve salary
  const handleApprove = useCallback(async (salary: Salary) => {
    if (!currentUser) return;
    await approveSalary(salary.id, currentUser.id);
  }, [approveSalary, currentUser]);

  // Handle mark as paid
  const handleMarkPaid = useCallback(async (salary: Salary) => {
    if (!currentUser) return;
    await markAsPaid(salary.id, currentUser.id);
  }, [markAsPaid, currentUser]);

  // Handle edit salary
  const handleEdit = useCallback((salary: Salary) => {
    setEditingSalary(salary);
    setEditModalOpen(true);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(async (data: {
    bonus: number;
    bonusNote?: string;
    deduction: number;
    deductionNote?: string;
    note?: string;
  }) => {
    if (!editingSalary) return;
    await updateSalary(editingSalary.id, data);
    setEditModalOpen(false);
    setEditingSalary(null);
  }, [editingSalary, updateSalary]);

  // Handle recalculate
  const handleRecalculate = useCallback(async (salary: Salary) => {
    await recalculateSalary(salary.id);
  }, [recalculateSalary]);

  // Handle generate all
  const handleGenerateAll = useCallback(async () => {
    if (!currentUser) return;
    await generateAllSalaries(currentUser.id);
  }, [generateAllSalaries, currentUser]);

  // Handle view slip
  const handleViewSlip = useCallback((salary: Salary) => {
    setViewingSalary(salary);
    setSlipModalOpen(true);
  }, []);

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'pdf') => {
    // TODO: Implement export
    console.log('Export as', format);
  }, []);

  // Get salary with full details
  const getSalaryWithDetails = (salary: Salary) => {
    const teacher = users.find(u => u.id === salary.teacherId);
    return {
      ...salary,
      teacher,
      branch: currentBranch || undefined,
    };
  };

  if (!currentBranch && branches.length > 0) {
    setCurrentBranch(branches[0]);
  }

  return (
    <div className="salary-page">
      {/* Header */}
      <div className="page-header">
        <h1>Quản lý Lương</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {branches.length > 1 && (
            <BranchSelector
              branches={branches}
              currentBranch={currentBranch}
              onSelect={(branch) => setCurrentBranch(branch)}
            />
          )}
        </div>
      </div>

      {/* No branch selected */}
      {!currentBranch ? (
        <div className="empty-state">
          <p>Vui lòng chọn chi nhánh để quản lý lương</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="page-tabs">
            <button
              className={`tab-btn ${viewMode === 'calculator' ? 'active' : ''}`}
              onClick={() => setViewMode('calculator')}
            >
              Bảng lương
            </button>
            <button
              className={`tab-btn ${viewMode === 'report' ? 'active' : ''}`}
              onClick={() => setViewMode('report')}
            >
              Báo cáo
            </button>
            <button
              className={`tab-btn ${viewMode === 'slips' ? 'active' : ''}`}
              onClick={() => setViewMode('slips')}
            >
              Phiếu lương
            </button>
          </div>

          {/* Tab content */}
          <div className="page-content">
            {/* Calculator View */}
            {viewMode === 'calculator' && (
              <SalaryCalculator
                salaries={salariesWithUsers}
                summary={summary ?? undefined}
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                onApprove={isBranchAdmin ? handleApprove : undefined}
                onMarkPaid={isBranchAdmin ? handleMarkPaid : undefined}
                onEdit={isBranchAdmin ? handleEdit : undefined}
                onRecalculate={isBranchAdmin ? handleRecalculate : undefined}
                onGenerateAll={isBranchAdmin ? handleGenerateAll : undefined}
                loading={loading}
              />
            )}

            {/* Report View */}
            {viewMode === 'report' && (
              <SalaryReport
                salaries={salariesWithUsers}
                summary={summary ?? undefined}
                branch={currentBranch}
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                onExport={handleExport}
                loading={loading}
              />
            )}

            {/* Slips View */}
            {viewMode === 'slips' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ margin: 0 }}>Phiếu lương</h3>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    Đang tải...
                  </div>
                ) : salariesWithUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>Chưa có phiếu lương cho tháng này</p>
                    <p className="hint">Vào tab "Bảng lương" và bấm "Tạo lương cho tất cả" để bắt đầu</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '20px',
                  }}>
                    {salariesWithUsers.map(salary => (
                      <div
                        key={salary.id}
                        onClick={() => handleViewSlip(salary)}
                        style={{ cursor: 'pointer' }}
                      >
                        <SalarySlipPreview salary={getSalaryWithDetails(salary)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Salary Modal */}
          <SalaryEditModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setEditingSalary(null);
            }}
            onSubmit={handleSaveEdit}
            salary={editingSalary ? {
              ...editingSalary,
              teacher: users.find(u => u.id === editingSalary.teacherId),
            } : undefined}
          />

          {/* View Salary Slip Modal */}
          {slipModalOpen && viewingSalary && (
            <SalarySlip
              salary={getSalaryWithDetails(viewingSalary)}
              onClose={() => {
                setSlipModalOpen(false);
                setViewingSalary(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
