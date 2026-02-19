// Center members page - member list with roles, search, filters, admin actions

import { useState, useMemo } from 'react';
import { Search, UserMinus, Users, GraduationCap, BookOpen, Shield, UserX } from 'lucide-react';
import { useCenter } from '../../contexts/center-context';
import { useCenterMembers, type CenterMemberInfo } from '../../hooks/use-center-members';
import { BRANCH_MEMBER_ROLE_LABELS, BRANCH_MEMBER_ROLE_COLORS } from '../../types/branch';
import type { User } from '../../types/user';
import { isImageAvatar } from '../../utils/avatar-icons';

interface CenterMembersPageProps {
  users: User[];
}

type FilterTab = 'all' | 'student' | 'teacher' | 'admin';

export function CenterMembersPage({ users }: CenterMembersPageProps) {
  const { center, isAdmin } = useCenter();
  const { members, loading, removeMember } = useCenterMembers(center.id, users);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [removing, setRemoving] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    let filtered = members;

    if (activeFilter === 'student') {
      filtered = filtered.filter(m => m.member.role === 'student');
    } else if (activeFilter === 'teacher') {
      filtered = filtered.filter(m =>
        ['main_teacher', 'part_time_teacher', 'assistant'].includes(m.member.role)
      );
    } else if (activeFilter === 'admin') {
      filtered = filtered.filter(m => m.member.role === 'branch_admin');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m =>
        m.displayName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [members, activeFilter, search]);

  const studentCount = members.filter(m => m.member.role === 'student').length;
  const teacherCount = members.filter(m =>
    ['main_teacher', 'part_time_teacher', 'assistant'].includes(m.member.role)
  ).length;
  const adminCount = members.filter(m => m.member.role === 'branch_admin').length;

  const handleRemove = async (member: CenterMemberInfo) => {
    if (!confirm(`Xóa ${member.displayName} khỏi trung tâm?`)) return;
    setRemoving(member.member.id);
    try {
      await removeMember(member.member.id);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="center-members-page center-members-loading">
        <div className="app-loading-spinner" />
        <span className="app-loading-label">Đang tải danh sách...</span>
      </div>
    );
  }

  return (
    <div className="center-members-page">
      <h2 className="center-members-title">Thành viên</h2>

      {/* Stats */}
      <div className="center-members-stats">
        <div className="center-members-stat">
          <Users size={18} />
          <span className="stat-value">{members.length}</span>
          <span className="stat-label">Tổng</span>
        </div>
        <div className="center-members-stat">
          <GraduationCap size={18} />
          <span className="stat-value">{studentCount}</span>
          <span className="stat-label">Học viên</span>
        </div>
        <div className="center-members-stat">
          <BookOpen size={18} />
          <span className="stat-value">{teacherCount}</span>
          <span className="stat-label">Giáo viên</span>
        </div>
        <div className="center-members-stat">
          <Shield size={18} />
          <span className="stat-value">{adminCount}</span>
          <span className="stat-label">Admin</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="center-members-toolbar">
        <div className="center-members-search">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên..."
          />
        </div>

        <div className="center-members-filters">
          {([
            { key: 'all', label: 'Tất cả' },
            { key: 'student', label: 'Học viên' },
            { key: 'teacher', label: 'Giáo viên' },
            { key: 'admin', label: 'Admin' },
          ] as { key: FilterTab; label: string }[]).map(tab => (
            <button
              key={tab.key}
              className={`center-members-filter-btn ${activeFilter === tab.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count when filtered */}
      {(search.trim() || activeFilter !== 'all') && (
        <div className="center-members-result-count">
          {filteredMembers.length} kết quả
        </div>
      )}

      {/* Member list */}
      <div className="center-members-list">
        {filteredMembers.length === 0 ? (
          <div className="center-members-empty">
            <UserX size={40} />
            <p>Không tìm thấy thành viên nào</p>
          </div>
        ) : (
          filteredMembers.map(m => (
            <div key={m.member.id} className="center-member-card">
              <div className="center-member-avatar">
                {m.avatar && isImageAvatar(m.avatar) ? (
                  <img src={m.avatar} alt={m.displayName} />
                ) : (
                  <span>{m.avatar || m.displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="center-member-info">
                <span className="center-member-name">{m.displayName}</span>
                <span
                  className="center-member-role"
                  style={{ color: BRANCH_MEMBER_ROLE_COLORS[m.member.role] }}
                >
                  {BRANCH_MEMBER_ROLE_LABELS[m.member.role]}
                </span>
                <span className="center-member-date">
                  Tham gia: {new Date(m.member.joinedAt).toLocaleDateString('vi-VN')}
                  {m.member.joinedViaCode && (
                    <span className="center-member-code"> (mã: {m.member.joinedViaCode})</span>
                  )}
                </span>
              </div>
              {isAdmin && m.member.role !== 'branch_admin' && (
                <button
                  className="center-member-remove-btn"
                  onClick={() => handleRemove(m)}
                  disabled={removing === m.member.id}
                  title="Xóa thành viên"
                >
                  <UserMinus size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
