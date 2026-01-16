// Teacher management page - For branch admins to manage teachers

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useBranches, useCurrentBranch, useBranchMembers } from '../../hooks/use-branches';
import { useTeacherSchedules, useTeachingSessions } from '../../hooks/use-teachers';
import { useClassrooms } from '../../hooks/use-classrooms';
import { TeacherList } from '../teacher/teacher-list';
import { TeacherAddModal } from '../teacher/teacher-add-modal';
import { TeacherSchedule, ScheduleModal } from '../teacher/teacher-schedule';
import { TeachingLog, TeachingSessionModal } from '../teacher/teaching-log';
import { BranchSelector } from '../branch/branch-selector';
import type { BranchMember, BranchMemberRole } from '../../types/branch';
import type { TeacherSchedule as TSchedule, TeacherScheduleFormData } from '../../types/teacher';
import type { User } from '../../types/user';

type ViewMode = 'list' | 'schedule' | 'log';

interface TeacherManagementPageProps {
  users: User[];
}

export function TeacherManagementPage({ users }: TeacherManagementPageProps) {
  const { currentUser } = useAuth();
  const isBranchAdmin = currentUser?.role === 'branch_admin' || currentUser?.role === 'director' || currentUser?.role === 'super_admin';

  // Branch selection
  const { branches } = useBranches(currentUser?.id || null, true);
  const { currentBranch, setCurrentBranch } = useCurrentBranch();

  // Branch members (teachers)
  const {
    membersWithUsers,
    loading: membersLoading,
    addMember,
    updateMember,
    removeMember,
  } = useBranchMembers(currentBranch?.id || null, users);

  // Teacher schedules
  const {
    schedulesWithDetails,
    loading: schedulesLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useTeacherSchedules(currentBranch?.id || null);

  // Teaching sessions
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth] = useState(currentMonth);
  const {
    sessionsWithDetails,
    loading: sessionsLoading,
    createSession,
    approveSession,
  } = useTeachingSessions(currentBranch?.id || null, undefined, selectedMonth);

  // Classrooms for schedule assignment
  const { classrooms } = useClassrooms(currentUser?.id || null, true);

  // Filter classrooms by current branch
  const branchClassrooms = useMemo(() => {
    return classrooms.filter(c => c.branchId === currentBranch?.id);
  }, [classrooms, currentBranch?.id]);

  // Filter teachers only
  const teachers = useMemo(() => {
    return membersWithUsers.filter(m =>
      ['main_teacher', 'part_time_teacher', 'assistant'].includes(m.role)
    );
  }, [membersWithUsers]);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTeacher, setSelectedTeacher] = useState<(BranchMember & { user?: User }) | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TSchedule | undefined>();

  // Handle add teacher
  const handleAddTeacher = useCallback(async (
    data: { userId?: string; newUser?: Partial<User> },
    role: BranchMemberRole,
    salary?: { type: 'monthly' | 'hourly'; amount: number }
  ): Promise<boolean> => {
    if (data.userId) {
      const result = await addMember(data.userId, role, salary);
      return !!result;
    }
    // TODO: Handle create new user case
    return false;
  }, [addMember]);

  // Handle update teacher
  const handleUpdateTeacher = useCallback(async (
    memberId: string,
    updates: { role?: BranchMemberRole; salary?: { type: 'monthly' | 'hourly'; amount: number } }
  ): Promise<boolean> => {
    return await updateMember(memberId, updates);
  }, [updateMember]);

  // Handle remove teacher
  const handleRemoveTeacher = useCallback(async (memberId: string) => {
    await removeMember(memberId);
  }, [removeMember]);

  // Handle create schedule
  const handleCreateSchedule = useCallback(async (data: TeacherScheduleFormData): Promise<boolean> => {
    const result = await createSchedule(data);
    return !!result;
  }, [createSchedule]);

  // Handle update schedule
  const handleUpdateSchedule = useCallback(async (data: TeacherScheduleFormData): Promise<boolean> => {
    if (!editingSchedule) return false;
    return await updateSchedule(editingSchedule.id, data);
  }, [editingSchedule, updateSchedule]);

  // Handle create session
  const handleCreateSession = useCallback(async (data: {
    classroomId: string;
    date: string;
    startTime: string;
    endTime: string;
    note?: string;
  }): Promise<void> => {
    if (!selectedTeacher) return;
    await createSession(selectedTeacher.userId, data);
  }, [createSession, selectedTeacher]);

  // Handle approve session
  const handleApproveSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!currentUser) return false;
    return await approveSession(sessionId, currentUser.id);
  }, [approveSession, currentUser]);

  // Get teacher schedules
  const getTeacherSchedules = (teacherId: string) => {
    return schedulesWithDetails.filter(s => s.teacherId === teacherId);
  };

  // Get teacher sessions
  const getTeacherSessions = (teacherId: string) => {
    return sessionsWithDetails.filter(s => s.teacherId === teacherId);
  };

  if (!currentBranch && branches.length > 0) {
    setCurrentBranch(branches[0]);
  }

  return (
    <div className="teacher-page">
      {/* Header */}
      <div className="page-header">
        <h1>Quản lý Giáo viên</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {branches.length > 1 && (
            <BranchSelector
              branches={branches}
              currentBranch={currentBranch}
              onSelect={(branch) => setCurrentBranch(branch)}
            />
          )}
          {isBranchAdmin && viewMode === 'list' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              + Thêm giáo viên
            </button>
          )}
        </div>
      </div>

      {/* No branch selected */}
      {!currentBranch ? (
        <div className="empty-state">
          <p>Vui lòng chọn chi nhánh để quản lý giáo viên</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="page-tabs">
            <button
              className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              Danh sách ({teachers.length})
            </button>
            <button
              className={`tab-btn ${viewMode === 'schedule' ? 'active' : ''}`}
              onClick={() => setViewMode('schedule')}
            >
              Lịch dạy
            </button>
            <button
              className={`tab-btn ${viewMode === 'log' ? 'active' : ''}`}
              onClick={() => setViewMode('log')}
            >
              Ghi nhận giờ
            </button>
          </div>

          {/* Tab content */}
          <div className="page-content">
            {/* List View */}
            {viewMode === 'list' && (
              <TeacherList
                teachers={teachers}
                loading={membersLoading}
                onEdit={isBranchAdmin ? (member) => {
                  setSelectedTeacher(member);
                  setShowAddModal(true);
                } : undefined}
                onRemove={isBranchAdmin ? (member) => handleRemoveTeacher(member.id) : undefined}
                onViewSchedule={(member) => {
                  setSelectedTeacher(member);
                  setViewMode('schedule');
                }}
              />
            )}

            {/* Schedule View */}
            {viewMode === 'schedule' && (
              <div>
                {/* Teacher filter for schedule */}
                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>Giáo viên:</label>
                  <select
                    value={selectedTeacher?.userId || ''}
                    onChange={(e) => {
                      const teacher = teachers.find(t => t.userId === e.target.value);
                      setSelectedTeacher(teacher || null);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Tất cả giáo viên</option>
                    {teachers.map(t => (
                      <option key={t.userId} value={t.userId}>
                        {t.user?.displayName || t.user?.username || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
                <TeacherSchedule
                  schedules={selectedTeacher
                    ? getTeacherSchedules(selectedTeacher.userId)
                    : schedulesWithDetails
                  }
                  classrooms={branchClassrooms}
                  teachers={teachers.map(t => ({ id: t.userId, ...t.user } as User & { role?: BranchMemberRole }))}
                  loading={schedulesLoading}
                  onAdd={isBranchAdmin ? () => {
                    setEditingSchedule(undefined);
                    setShowScheduleModal(true);
                  } : undefined}
                  onEdit={isBranchAdmin ? (schedule) => {
                    setEditingSchedule(schedule);
                    setShowScheduleModal(true);
                  } : undefined}
                  onDelete={isBranchAdmin ? (schedule) => deleteSchedule(schedule.id) : undefined}
                />
              </div>
            )}

            {/* Teaching Log View */}
            {viewMode === 'log' && (
              <div>
                {/* Teacher filter for log */}
                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>Giáo viên:</label>
                  <select
                    value={selectedTeacher?.userId || ''}
                    onChange={(e) => {
                      const teacher = teachers.find(t => t.userId === e.target.value);
                      setSelectedTeacher(teacher || null);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Tất cả giáo viên</option>
                    {teachers.map(t => (
                      <option key={t.userId} value={t.userId}>
                        {t.user?.displayName || t.user?.username || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
                <TeachingLog
                  sessions={selectedTeacher
                    ? getTeacherSessions(selectedTeacher.userId)
                    : sessionsWithDetails
                  }
                  classrooms={branchClassrooms}
                  teachers={teachers.map(t => ({ id: t.userId, ...t.user } as User))}
                  loading={sessionsLoading}
                  isAdmin={isBranchAdmin}
                  onAdd={isBranchAdmin && selectedTeacher ? () => {
                    setShowSessionModal(true);
                  } : undefined}
                  onApprove={isBranchAdmin ? (session) => handleApproveSession(session.id) : undefined}
                />
              </div>
            )}
          </div>

          {/* Add/Edit Teacher Modal */}
          <TeacherAddModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setSelectedTeacher(null);
            }}
            onSubmit={async (data, userId) => {
              if (selectedTeacher) {
                // Edit mode
                await handleUpdateTeacher(selectedTeacher.id, {
                  role: data.role,
                  salary: data.salary,
                });
              } else if (userId) {
                // Add existing user
                await handleAddTeacher({ userId }, data.role, data.salary);
              }
              setShowAddModal(false);
            }}
            existingUsers={users.filter(u => !teachers.some(t => t.userId === u.id))}
            existingMemberIds={teachers.map(t => t.userId)}
            member={selectedTeacher || undefined}
          />

          {/* Schedule Modal */}
          <ScheduleModal
            isOpen={showScheduleModal}
            onClose={() => {
              setShowScheduleModal(false);
              setEditingSchedule(undefined);
            }}
            onSubmit={async (data) => {
              if (editingSchedule) {
                await handleUpdateSchedule(data);
              } else {
                await handleCreateSchedule(data);
              }
            }}
            schedule={editingSchedule}
            teachers={teachers.map(t => ({ id: t.userId, ...t.user, role: t.role } as User & { role?: BranchMemberRole }))}
            classrooms={branchClassrooms}
          />

          {/* Session Modal */}
          <TeachingSessionModal
            isOpen={showSessionModal}
            onClose={() => setShowSessionModal(false)}
            onSubmit={handleCreateSession}
            classrooms={branchClassrooms}
          />
        </>
      )}
    </div>
  );
}
