// Branch Teachers Tab - Manage teachers, schedules, and teaching sessions

import { useState } from 'react';
import { TeacherList } from '../teacher/teacher-list';
import { TeacherSchedule } from '../teacher/teacher-schedule';
import { TeachingLog } from '../teacher/teaching-log';
import type { BranchMemberRole } from '../../types/branch';
import type { User } from '../../types/user';
import type { BranchTeachersTabProps, TeacherSubTab, TeacherMember } from './branch-management-types';

export function BranchTeachersTab({
  teachers,
  schedules,
  sessions,
  classrooms,
  users,
  isAdmin,
  loading,
  onAddTeacher,
  onEditTeacher,
  onRemoveTeacher,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onAddSession,
  onApproveSession,
}: BranchTeachersTabProps) {
  const [subTab, setSubTab] = useState<TeacherSubTab>('list');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherMember | null>(null);

  // Filter data by selected teacher
  const filteredSchedules = selectedTeacher
    ? schedules.filter(s => s.teacherId === selectedTeacher.userId)
    : schedules;
  const filteredSessions = selectedTeacher
    ? sessions.filter(s => s.teacherId === selectedTeacher.userId)
    : sessions;

  return (
    <div className="tab-content-teachers">
      {/* Sub-tabs */}
      <div className="sub-tabs">
        <button className={`sub-tab ${subTab === 'list' ? 'active' : ''}`} onClick={() => setSubTab('list')}>
          Danh sách ({teachers.length})
        </button>
        <button className={`sub-tab ${subTab === 'schedule' ? 'active' : ''}`} onClick={() => setSubTab('schedule')}>
          Lịch dạy
        </button>
        <button className={`sub-tab ${subTab === 'log' ? 'active' : ''}`} onClick={() => setSubTab('log')}>
          Ghi nhận giờ
        </button>
        {isAdmin && subTab === 'list' && (
          <button className="btn btn-primary btn-add" onClick={onAddTeacher}>
            + Thêm giáo viên
          </button>
        )}
      </div>

      {/* Teacher List */}
      {subTab === 'list' && (
        <TeacherList
          teachers={teachers}
          loading={loading.members}
          onEdit={isAdmin ? onEditTeacher : undefined}
          onRemove={isAdmin ? (m) => onRemoveTeacher(m.id) : undefined}
          onViewSchedule={(m) => { setSelectedTeacher(m); setSubTab('schedule'); }}
        />
      )}

      {/* Teacher Schedule */}
      {subTab === 'schedule' && (
        <div>
          <TeacherFilter teachers={teachers} selected={selectedTeacher} onSelect={setSelectedTeacher} />
          <TeacherSchedule
            schedules={filteredSchedules}
            classrooms={classrooms}
            teachers={teachers.map(t => ({ id: t.userId, ...t.user, role: t.role } as User & { role?: BranchMemberRole }))}
            loading={loading.schedules}
            onAdd={isAdmin ? onAddSchedule : undefined}
            onEdit={isAdmin ? onEditSchedule : undefined}
            onDelete={isAdmin ? (s) => onDeleteSchedule(s.id) : undefined}
          />
        </div>
      )}

      {/* Teaching Log */}
      {subTab === 'log' && (
        <div>
          <TeacherFilter teachers={teachers} selected={selectedTeacher} onSelect={setSelectedTeacher} />
          <TeachingLog
            sessions={filteredSessions}
            classrooms={classrooms}
            teachers={teachers.map(t => ({ id: t.userId, ...t.user } as User))}
            loading={loading.sessions}
            isAdmin={isAdmin}
            onAdd={isAdmin && selectedTeacher ? () => onAddSession(selectedTeacher.userId) : undefined}
            onApprove={isAdmin ? (s) => onApproveSession(s.id) : undefined}
          />
        </div>
      )}
    </div>
  );
}

// Teacher filter dropdown
function TeacherFilter({
  teachers,
  selected,
  onSelect,
}: {
  teachers: TeacherMember[];
  selected: TeacherMember | null;
  onSelect: (teacher: TeacherMember | null) => void;
}) {
  return (
    <div className="filter-bar">
      <label>Giáo viên:</label>
      <select
        value={selected?.userId || ''}
        onChange={(e) => onSelect(teachers.find(t => t.userId === e.target.value) || null)}
      >
        <option value="">Tất cả giáo viên</option>
        {teachers.map(t => (
          <option key={t.userId} value={t.userId}>
            {t.user?.displayName || t.user?.username || 'Unknown'}
          </option>
        ))}
      </select>
    </div>
  );
}
