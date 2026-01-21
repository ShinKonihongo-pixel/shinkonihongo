// Unified Branch Management Page - Comprehensive branch, teacher, and salary management
// Modular architecture with separate tab components

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useBranches, useBranchMembers, useBranchStats, useCurrentBranch } from '../../hooks/use-branches';
import { useTeacherSchedules, useTeachingSessions, useSalaries } from '../../hooks/use-teachers';
import { useClassrooms } from '../../hooks/use-classrooms';
import { BranchCreateModal } from '../branch/branch-create-modal';
import { ConfirmModal } from '../ui/confirm-modal';
import { TeacherAddModal } from '../teacher/teacher-add-modal';
import { ScheduleModal } from '../teacher/teacher-schedule';
import { TeachingSessionModal } from '../teacher/teaching-log';
import { SalaryEditModal } from '../salary/salary-calculator';
import { SalarySlip } from '../salary/salary-slip';
import {
  BranchListView, BranchOverviewTab, BranchTeachersTab,
  BranchSalariesTab, BranchStaffTab, BranchSettingsTab,
  type DetailTab, type TeacherMember,
} from '../branch-management';
import type { Branch, BranchFormData, BranchMemberRole } from '../../types/branch';
import { BRANCH_STATUS_LABELS } from '../../types/branch';
import type { TeacherSchedule, TeacherScheduleFormData, Salary } from '../../types/teacher';
import type { User } from '../../types/user';

interface BranchManagementPageProps {
  users: User[];
}

export function BranchManagementPage({ users }: BranchManagementPageProps) {
  const { currentUser } = useAuth();
  const isDirector = currentUser?.role === 'director' || currentUser?.role === 'super_admin';
  const isBranchAdmin = currentUser?.role === 'branch_admin' || isDirector;
  const { setCurrentBranch } = useCurrentBranch();

  // Branch data
  const { branches, loading, createBranch, updateBranch, deleteBranch } = useBranches(currentUser?.id || null, isDirector);

  // View state
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Branch | null>(null);

  // Teacher modal states
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherMember | null>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TeacherSchedule | undefined>();

  // Salary modal states
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [viewingSalary, setViewingSalary] = useState<Salary | null>(null);

  // Branch-specific data hooks
  const { membersWithUsers, loading: membersLoading, addMember, updateMember, removeMember } = useBranchMembers(selectedBranch?.id || null, users);
  const { stats } = useBranchStats(selectedBranch?.id || null);
  const { schedulesWithDetails, loading: schedulesLoading, createSchedule, updateSchedule, deleteSchedule } = useTeacherSchedules(selectedBranch?.id || null);
  const { sessionsWithDetails, loading: sessionsLoading, createSession, approveSession } = useTeachingSessions(selectedBranch?.id || null, undefined, selectedMonth);
  const { salariesWithUsers, summary, loading: salariesLoading, updateSalary, approveSalary, markAsPaid, recalculateSalary, generateAllSalaries } = useSalaries(selectedBranch?.id || null, selectedMonth, users);
  const { classrooms } = useClassrooms(currentUser?.id || null, true);

  // Derived data
  const teachers = useMemo(() => membersWithUsers.filter(m => ['main_teacher', 'part_time_teacher', 'assistant'].includes(m.role)), [membersWithUsers]);
  const branchClassrooms = useMemo(() => classrooms.filter(c => c.branchId === selectedBranch?.id), [classrooms, selectedBranch?.id]);
  const availableAdmins = useMemo(() => users.filter(u => !membersWithUsers.some(m => m.userId === u.id) && u.id !== currentUser?.id), [users, membersWithUsers, currentUser?.id]);
  // Convert MonthlySalarySummary to simple SalarySummary for overview
  const overviewSalarySummary = useMemo(() => {
    if (!summary) return null;
    return {
      total: summary.totalAmount,
      approved: summary.totalTeachers - summary.pendingCount,
      paid: summary.paidCount,
      count: summary.totalTeachers,
    };
  }, [summary]);

  // Branch handlers
  const handleSelectBranch = (branch: Branch) => { setSelectedBranch(branch); setCurrentBranch(branch); setActiveTab('overview'); };
  const handleBack = () => setSelectedBranch(null);
  const handleCreateBranch = useCallback(async (data: BranchFormData) => { await createBranch(data); setShowCreateModal(false); }, [createBranch]);
  const handleUpdateBranch = useCallback(async (data: BranchFormData) => { if (editingBranch) await updateBranch(editingBranch.id, data); setShowCreateModal(false); }, [editingBranch, updateBranch]);
  const handleDeleteBranch = useCallback(async () => { if (deleteConfirm) { await deleteBranch(deleteConfirm.id); if (selectedBranch?.id === deleteConfirm.id) setSelectedBranch(null); setDeleteConfirm(null); } }, [deleteBranch, deleteConfirm, selectedBranch]);

  // Teacher handlers
  const handleAddTeacher = useCallback(async (userId: string, role: BranchMemberRole, salary?: { type: 'monthly' | 'hourly'; amount: number }) => { await addMember(userId, role, salary); }, [addMember]);
  const handleUpdateTeacher = useCallback(async (memberId: string, updates: { role?: BranchMemberRole; salary?: { type: 'monthly' | 'hourly'; amount: number } }) => { await updateMember(memberId, updates); }, [updateMember]);
  const handleCreateSchedule = useCallback(async (data: TeacherScheduleFormData) => { await createSchedule(data); setShowScheduleModal(false); }, [createSchedule]);
  const handleUpdateSchedule = useCallback(async (data: TeacherScheduleFormData) => { if (editingSchedule) await updateSchedule(editingSchedule.id, data); setShowScheduleModal(false); }, [editingSchedule, updateSchedule]);
  const handleCreateSession = useCallback(async (data: { classroomId: string; date: string; startTime: string; endTime: string; note?: string }) => { if (selectedTeacher) await createSession(selectedTeacher.userId, data); setShowSessionModal(false); }, [createSession, selectedTeacher]);
  const handleApproveSession = useCallback(async (sessionId: string) => { if (currentUser) await approveSession(sessionId, currentUser.id); }, [approveSession, currentUser]);

  // Salary handlers
  const handleApproveSalary = useCallback(async (salary: Salary) => { if (currentUser) await approveSalary(salary.id, currentUser.id); }, [approveSalary, currentUser]);
  const handleMarkPaid = useCallback(async (salary: Salary) => { if (currentUser) await markAsPaid(salary.id, currentUser.id); }, [markAsPaid, currentUser]);
  const handleSaveSalary = useCallback(async (data: { bonus: number; bonusNote?: string; deduction: number; deductionNote?: string; note?: string }) => { if (editingSalary) { await updateSalary(editingSalary.id, data); setEditingSalary(null); } }, [editingSalary, updateSalary]);
  const handleGenerateSalaries = useCallback(async () => { if (currentUser) await generateAllSalaries(currentUser.id); }, [generateAllSalaries, currentUser]);

  // Loading state
  if (loading) return <div className="branch-mgmt-loading"><div className="loading-spinner" /><span>Đang tải...</span></div>;

  // List View
  if (!selectedBranch) {
    return (
      <div className="branch-mgmt-page">
        <BranchListView
          branches={branches}
          isDirector={isDirector}
          onSelectBranch={handleSelectBranch}
          onCreateBranch={() => { setEditingBranch(undefined); setShowCreateModal(true); }}
          onEditBranch={(b) => { setEditingBranch(b); setShowCreateModal(true); }}
          onDeleteBranch={(b) => setDeleteConfirm(b)}
        />
        <BranchCreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch} branch={editingBranch} />
        <ConfirmModal isOpen={!!deleteConfirm} title="Xóa chi nhánh" message={`Xóa "${deleteConfirm?.name}"?`} confirmText="Xóa" onConfirm={handleDeleteBranch} onCancel={() => setDeleteConfirm(null)} />
      </div>
    );
  }

  // Detail View
  return (
    <div className="branch-mgmt-page">
      {/* Header */}
      <div className="branch-mgmt-header branch-detail-header">
        <button className="btn btn-back" onClick={handleBack}>← Quay lại</button>
        <div className="header-title">
          <h1>{selectedBranch.name}</h1>
          <span className={`status-badge status-${selectedBranch.status}`}>{BRANCH_STATUS_LABELS[selectedBranch.status]}</span>
        </div>
        {isDirector && <button className="btn btn-secondary" onClick={() => { setEditingBranch(selectedBranch); setShowCreateModal(true); }}>Sửa</button>}
      </div>

      {/* Tabs */}
      <div className="branch-mgmt-tabs">
        {(['overview', 'teachers', 'salaries', 'staff'] as DetailTab[]).map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            <span className="tab-icon">{tab === 'overview' ? '📊' : tab === 'teachers' ? '👨‍🏫' : tab === 'salaries' ? '💰' : '👥'}</span>
            {tab === 'overview' ? 'Tổng quan' : tab === 'teachers' ? `Giáo viên (${teachers.length})` : tab === 'salaries' ? 'Lương' : `Nhân sự (${membersWithUsers.length})`}
          </button>
        ))}
        {isDirector && <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><span className="tab-icon">⚙️</span> Cài đặt</button>}
      </div>

      {/* Tab Content */}
      <div className="branch-mgmt-content">
        {activeTab === 'overview' && <BranchOverviewTab branch={selectedBranch} stats={stats} salarySummary={overviewSalarySummary} selectedMonth={selectedMonth} />}
        {activeTab === 'teachers' && (
          <BranchTeachersTab
            teachers={teachers} schedules={schedulesWithDetails} sessions={sessionsWithDetails} classrooms={branchClassrooms} users={users} isAdmin={isBranchAdmin}
            loading={{ members: membersLoading, schedules: schedulesLoading, sessions: sessionsLoading }}
            onAddTeacher={() => { setSelectedTeacher(null); setShowTeacherModal(true); }}
            onEditTeacher={(m) => { setSelectedTeacher(m); setShowTeacherModal(true); }}
            onRemoveTeacher={(id) => removeMember(id)}
            onAddSchedule={() => { setEditingSchedule(undefined); setShowScheduleModal(true); }}
            onEditSchedule={(s) => { setEditingSchedule(s); setShowScheduleModal(true); }}
            onDeleteSchedule={(id) => deleteSchedule(id)}
            onAddSession={(id) => { setSelectedTeacher(teachers.find(t => t.userId === id) || null); setShowSessionModal(true); }}
            onApproveSession={handleApproveSession}
          />
        )}
        {activeTab === 'salaries' && (
          <BranchSalariesTab
            salaries={salariesWithUsers} summary={summary} branch={selectedBranch} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} isAdmin={isBranchAdmin} loading={salariesLoading}
            onApprove={handleApproveSalary} onMarkPaid={handleMarkPaid} onEdit={(s) => setEditingSalary(s)} onRecalculate={(s) => recalculateSalary(s.id)} onGenerateAll={handleGenerateSalaries} onViewSlip={(s) => setViewingSalary(s)}
          />
        )}
        {activeTab === 'staff' && <BranchStaffTab members={membersWithUsers} availableUsers={availableAdmins} isDirector={isDirector} loading={membersLoading} onAddAdmin={(id) => addMember(id, 'branch_admin')} onRemoveMember={removeMember} />}
        {activeTab === 'settings' && isDirector && <BranchSettingsTab branch={selectedBranch} onToggleStatus={() => updateBranch(selectedBranch.id, { name: selectedBranch.name, code: selectedBranch.code, status: selectedBranch.status === 'active' ? 'inactive' : 'active' })} onDelete={() => setDeleteConfirm(selectedBranch)} />}
      </div>

      {/* Modals */}
      <BranchCreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch} branch={editingBranch} />
      <ConfirmModal isOpen={!!deleteConfirm} title="Xóa chi nhánh" message={`Xóa "${deleteConfirm?.name}"?`} confirmText="Xóa" onConfirm={handleDeleteBranch} onCancel={() => setDeleteConfirm(null)} />
      <TeacherAddModal isOpen={showTeacherModal} onClose={() => setShowTeacherModal(false)} onSubmit={async (data, userId) => { selectedTeacher ? await handleUpdateTeacher(selectedTeacher.id, { role: data.role, salary: data.salary }) : userId && await handleAddTeacher(userId, data.role, data.salary); setShowTeacherModal(false); }} existingUsers={users.filter(u => !teachers.some(t => t.userId === u.id))} existingMemberIds={teachers.map(t => t.userId)} member={selectedTeacher || undefined} />
      <ScheduleModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule} schedule={editingSchedule} teachers={teachers.map(t => ({ id: t.userId, ...t.user, role: t.role } as User & { role?: BranchMemberRole }))} classrooms={branchClassrooms} />
      <TeachingSessionModal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} onSubmit={handleCreateSession} classrooms={branchClassrooms} />
      <SalaryEditModal isOpen={!!editingSalary} onClose={() => setEditingSalary(null)} onSubmit={handleSaveSalary} salary={editingSalary ? { ...editingSalary, teacher: users.find(u => u.id === editingSalary.teacherId) } : undefined} />
      {viewingSalary && <SalarySlip salary={{ ...viewingSalary, teacher: users.find(u => u.id === viewingSalary.teacherId), branch: selectedBranch }} onClose={() => setViewingSalary(null)} />}
    </div>
  );
}
