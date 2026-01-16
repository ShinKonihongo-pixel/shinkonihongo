// Teacher list component for displaying branch teachers

import { useState } from 'react';
import type { BranchMember, BranchMemberRole } from '../../types/branch';
import type { User } from '../../types/user';
import {
  BRANCH_MEMBER_ROLE_LABELS,
  BRANCH_MEMBER_ROLE_COLORS,
  BRANCH_MEMBER_STATUS_LABELS,
  SALARY_TYPE_LABELS,
} from '../../types/branch';
import { formatCurrency } from '../../types/teacher';

interface TeacherWithUser extends BranchMember {
  user?: User;
}

interface TeacherListProps {
  teachers: TeacherWithUser[];
  onEdit?: (teacher: TeacherWithUser) => void;
  onRemove?: (teacher: TeacherWithUser) => void;
  onViewSchedule?: (teacher: TeacherWithUser) => void;
  loading?: boolean;
}

export function TeacherList({
  teachers,
  onEdit,
  onRemove,
  onViewSchedule,
  loading,
}: TeacherListProps) {
  const [filter, setFilter] = useState<BranchMemberRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter teachers
  const filteredTeachers = teachers.filter(t => {
    // Filter by role
    if (filter !== 'all' && t.role !== filter) return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = t.user?.displayName || t.user?.username || '';
      return name.toLowerCase().includes(query);
    }

    return true;
  });

  // Group by role
  const roleGroups: BranchMemberRole[] = ['main_teacher', 'part_time_teacher', 'assistant'];

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải danh sách giáo viên...
      </div>
    );
  }

  return (
    <div>
      {/* Header & Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Tìm kiếm giáo viên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px',
            minWidth: '200px',
          }}
        />

        {/* Role filter tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <FilterTab
            label="Tất cả"
            active={filter === 'all'}
            count={teachers.length}
            onClick={() => setFilter('all')}
          />
          {roleGroups.map(role => (
            <FilterTab
              key={role}
              label={BRANCH_MEMBER_ROLE_LABELS[role]}
              active={filter === role}
              count={teachers.filter(t => t.role === role).length}
              color={BRANCH_MEMBER_ROLE_COLORS[role]}
              onClick={() => setFilter(role)}
            />
          ))}
        </div>
      </div>

      {/* Teacher cards */}
      {filteredTeachers.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#999',
          background: '#f9f9f9',
          borderRadius: '12px',
        }}>
          {searchQuery || filter !== 'all'
            ? 'Không tìm thấy giáo viên phù hợp'
            : 'Chưa có giáo viên nào'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}>
          {filteredTeachers.map(teacher => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onEdit={onEdit}
              onRemove={onRemove}
              onViewSchedule={onViewSchedule}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterTabProps {
  label: string;
  active: boolean;
  count: number;
  color?: string;
  onClick: () => void;
}

function FilterTab({ label, active, count, color, onClick }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        border: active ? 'none' : '1px solid #ddd',
        background: active ? (color || '#667eea') : '#fff',
        color: active ? '#fff' : '#666',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
      }}
    >
      {label}
      <span style={{
        background: active ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
      }}>
        {count}
      </span>
    </button>
  );
}

interface TeacherCardProps {
  teacher: TeacherWithUser;
  onEdit?: (teacher: TeacherWithUser) => void;
  onRemove?: (teacher: TeacherWithUser) => void;
  onViewSchedule?: (teacher: TeacherWithUser) => void;
}

function TeacherCard({ teacher, onEdit, onRemove, onViewSchedule }: TeacherCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #eee',
        position: 'relative',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${BRANCH_MEMBER_ROLE_COLORS[teacher.role]} 0%, ${BRANCH_MEMBER_ROLE_COLORS[teacher.role]}88 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '20px',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {teacher.user?.avatar || (teacher.user?.displayName || teacher.user?.username || '?').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
            {teacher.user?.displayName || teacher.user?.username || 'Unknown'}
          </h4>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              background: `${BRANCH_MEMBER_ROLE_COLORS[teacher.role]}20`,
              color: BRANCH_MEMBER_ROLE_COLORS[teacher.role],
            }}>
              {BRANCH_MEMBER_ROLE_LABELS[teacher.role]}
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              background: teacher.status === 'active' ? '#e8f5e9' : '#ffebee',
              color: teacher.status === 'active' ? '#27ae60' : '#e74c3c',
            }}>
              {BRANCH_MEMBER_STATUS_LABELS[teacher.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Salary info */}
      {teacher.salary && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {SALARY_TYPE_LABELS[teacher.salary.type]}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#27ae60' }}>
            {formatCurrency(teacher.salary.amount)}
            {teacher.salary.type === 'hourly' && '/giờ'}
          </span>
        </div>
      )}

      {/* Join date */}
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: '#999',
      }}>
        Tham gia: {new Date(teacher.joinedAt).toLocaleDateString('vi-VN')}
      </div>

      {/* Actions (on hover) */}
      {showActions && (onEdit || onRemove || onViewSchedule) && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '4px',
        }}>
          {onViewSchedule && (
            <ActionButton
              icon="📅"
              title="Xem lịch dạy"
              onClick={() => onViewSchedule(teacher)}
            />
          )}
          {onEdit && (
            <ActionButton
              icon="✏️"
              title="Chỉnh sửa"
              onClick={() => onEdit(teacher)}
            />
          )}
          {onRemove && (
            <ActionButton
              icon="🗑️"
              title="Xóa"
              onClick={() => onRemove(teacher)}
              danger
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  icon: string;
  title: string;
  onClick: () => void;
  danger?: boolean;
}

function ActionButton({ icon, title, onClick, danger }: ActionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        background: danger ? '#fff5f5' : '#f5f5f5',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? '#ffebee' : '#eee';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = danger ? '#fff5f5' : '#f5f5f5';
      }}
    >
      {icon}
    </button>
  );
}
