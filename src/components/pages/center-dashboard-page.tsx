// Center Dashboard — Ultra-premium management for classes, students, settings
// Professional SaaS-grade dashboard with animated rings, stagger animations

import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Layers, GraduationCap, BookOpen, Users, UserPlus,
  Settings, Search, School, UserMinus, Calendar, ChevronRight,
  Sparkles, Plus, TrendingUp, UserCheck, Clock, BarChart3,
} from 'lucide-react';
import { useCenter } from '../../contexts/center-context';
import { DashboardLeaderboard } from '../dashboard/dashboard-leaderboard';
import { useClassrooms } from '../../hooks/use-classrooms';
import { useCenterMembers, type CenterMemberInfo } from '../../hooks/use-center-members';
import { getBranchStats } from '../../services/branch-firestore';
import { CenterInviteManager } from '../center/center-invite-manager';
import { CenterBrandingEditor } from '../center/center-branding-editor';
import { CenterAnalyticsTab } from '../dashboard/center-analytics-tab';
import { useCenterAnalytics } from '../../hooks/use-center-analytics';
import { BRANCH_MEMBER_ROLE_LABELS, BRANCH_MEMBER_ROLE_COLORS } from '../../types/branch';
import { CLASSROOM_LEVEL_LABELS, DAY_OF_WEEK_LABELS } from '../../types/classroom';
import type { BranchStats } from '../../types/branch';
import type { Classroom, ClassroomLevel } from '../../types/classroom';
import type { User } from '../../types/user';
import type { Page } from '../layout/header';
import { isImageAvatar } from '../../utils/avatar-icons';
import './center-dashboard-page.css';

interface CenterDashboardPageProps {
  currentUser: { id: string; role: string };
  users: User[];
  onNavigate?: (page: Page) => void;
}

type DashTab = 'overview' | 'analytics' | 'classes' | 'students' | 'settings';
type ClassFilter = 'all' | ClassroomLevel;
type MemberFilter = 'all' | 'student' | 'teacher' | 'admin';

const ROLE_LABELS: Record<string, string> = {
  director: 'Giám đốc',
  branch_admin: 'Admin',
  student: 'Học viên',
  main_teacher: 'Giáo viên chính',
  part_time_teacher: 'Giáo viên part-time',
  assistant: 'Trợ giảng',
};

/* SVG ring chart for overview hero section */
function ActivityRing({ value, max, label, gradientId }: {
  value: number; max: number; label: string; gradientId: string;
}) {
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const percent = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - percent);

  return (
    <div className="cdash-ring-container">
      <svg className="cdash-ring-svg" viewBox="0 0 90 90">
        <circle className="cdash-ring-bg" cx="45" cy="45" r={r} />
        <circle
          className={`cdash-ring-fill ${gradientId}`}
          cx="45" cy="45" r={r}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="cdash-ring-center">
        <span className="cdash-ring-value">{value}</span>
        <span className="cdash-ring-label">{label}</span>
      </div>
    </div>
  );
}

export function CenterDashboardPage({ currentUser, users, onNavigate }: CenterDashboardPageProps) {
  const { center, isAdmin, branding, userRole } = useCenter();
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [activeTab, setActiveTab] = useState<DashTab>('overview');

  // Data hooks
  const { classrooms, loading: classLoading } = useClassrooms(currentUser.id, isAdmin, center.id);
  const { members, loading: membersLoading, removeMember } = useCenterMembers(center.id, users);

  // Search & filter state
  const [classSearch, setClassSearch] = useState('');
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => { getBranchStats(center.id).then(setStats); }, [center.id]);

  // Analytics data
  const analytics = useCenterAnalytics(center.id, members, classrooms);

  const roleLabel = (userRole && ROLE_LABELS[userRole]) || 'Thành viên';

  // Derived data
  const activeClasses = useMemo(() => classrooms.filter(c => c.isActive).length, [classrooms]);
  const studentCount = useMemo(() => members.filter(m => m.member.role === 'student').length, [members]);
  const teacherCount = useMemo(() => members.filter(m =>
    ['main_teacher', 'part_time_teacher', 'assistant'].includes(m.member.role)
  ).length, [members]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    let result = classrooms;
    if (classFilter !== 'all') result = result.filter(c => c.level === classFilter);
    if (classSearch.trim()) {
      const q = classSearch.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    return result;
  }, [classrooms, classFilter, classSearch]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    let result = members;
    if (memberFilter === 'student') result = result.filter(m => m.member.role === 'student');
    else if (memberFilter === 'teacher') result = result.filter(m => ['main_teacher', 'part_time_teacher', 'assistant'].includes(m.member.role));
    else if (memberFilter === 'admin') result = result.filter(m => m.member.role === 'branch_admin');
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      result = result.filter(m => m.displayName.toLowerCase().includes(q) || m.username.toLowerCase().includes(q));
    }
    return result;
  }, [members, memberFilter, memberSearch]);

  const formatSchedule = (classroom: Classroom) => {
    if (!classroom.schedule?.length) return '';
    return classroom.schedule.map(s =>
      `${DAY_OF_WEEK_LABELS[s.dayOfWeek]} ${s.startTime}-${s.endTime}`
    ).join(', ');
  };

  const handleRemove = async (member: CenterMemberInfo) => {
    if (!confirm(`Xóa ${member.displayName} khỏi trung tâm?`)) return;
    setRemoving(member.member.id);
    try { await removeMember(member.member.id); } finally { setRemoving(null); }
  };

  const getAvatarClass = (role: string) => {
    if (role === 'student') return 'role-student';
    if (['main_teacher', 'part_time_teacher', 'assistant'].includes(role)) return 'role-teacher';
    return 'role-admin';
  };

  const totalClasses = stats?.totalClasses ?? classrooms.length;
  const totalStudents = stats?.totalStudents ?? studentCount;
  const totalTeachers = stats?.totalTeachers ?? teacherCount;

  return (
    <div className="cdash">
      {/* SVG gradient definitions for rings */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="ring-gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="ring-gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>

      {/* ===== HEADER ===== */}
      <div className="cdash-header">
        {branding.logo ? (
          <img src={branding.logo} alt={center.name} className="cdash-logo" />
        ) : (
          <div className="cdash-logo-placeholder">
            <Building2 size={22} />
          </div>
        )}
        <div className="cdash-header-info">
          <h1>{center.name}</h1>
          <span className="cdash-role-badge">{roleLabel}</span>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="cdash-tabs">
        {([
          { key: 'overview', icon: <TrendingUp size={14} />, label: 'Tổng quan' },
          { key: 'analytics', icon: <BarChart3 size={14} />, label: 'Phân tích' },
          { key: 'classes', icon: <School size={14} />, label: 'Lớp học', badge: classrooms.length },
          { key: 'students', icon: <Users size={14} />, label: 'Thành viên', badge: members.length },
          ...(isAdmin ? [{ key: 'settings', icon: <Settings size={14} />, label: 'Cài đặt' }] : []),
        ] as { key: DashTab; icon: React.ReactNode; label: string; badge?: number }[]).map(tab => (
          <button
            key={tab.key}
            className={`cdash-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge != null && <span className="cdash-tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* ===== CONTENT ===== */}
      <div className="cdash-content">

        {/* ────── OVERVIEW ────── */}
        {activeTab === 'overview' && (
          <>
            {/* Hero ring section */}
            <div className="cdash-hero-ring">
              <ActivityRing
                value={activeClasses}
                max={Math.max(totalClasses, 1)}
                label="Lớp mở"
                gradientId="purple"
              />
              <div className="cdash-hero-stats">
                <div className="cdash-hero-stat-row">
                  <span className="cdash-hero-dot purple" />
                  <span className="cdash-hero-stat-text"><strong>{totalClasses}</strong> lớp học</span>
                </div>
                <div className="cdash-hero-stat-row">
                  <span className="cdash-hero-dot green" />
                  <span className="cdash-hero-stat-text"><strong>{activeClasses}</strong> đang mở</span>
                </div>
                <div className="cdash-hero-stat-row">
                  <span className="cdash-hero-dot pink" />
                  <span className="cdash-hero-stat-text"><strong>{totalStudents}</strong> học viên</span>
                </div>
                <div className="cdash-hero-stat-row">
                  <span className="cdash-hero-dot blue" />
                  <span className="cdash-hero-stat-text"><strong>{totalTeachers}</strong> giáo viên</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="cdash-stats-grid">
              <div className="cdash-stat-card">
                <div className="cdash-stat-icon purple"><Layers size={18} /></div>
                <div className="cdash-stat-info">
                  <span className="cdash-stat-value">{totalClasses}</span>
                  <span className="cdash-stat-label">Lớp học</span>
                </div>
              </div>
              <div className="cdash-stat-card">
                <div className="cdash-stat-icon green"><Sparkles size={18} /></div>
                <div className="cdash-stat-info">
                  <span className="cdash-stat-value">{activeClasses}</span>
                  <span className="cdash-stat-label">Đang mở</span>
                </div>
              </div>
              <div className="cdash-stat-card">
                <div className="cdash-stat-icon pink"><GraduationCap size={18} /></div>
                <div className="cdash-stat-info">
                  <span className="cdash-stat-value">{totalStudents}</span>
                  <span className="cdash-stat-label">Học viên</span>
                </div>
              </div>
              <div className="cdash-stat-card">
                <div className="cdash-stat-icon blue"><UserCheck size={18} /></div>
                <div className="cdash-stat-info">
                  <span className="cdash-stat-value">{totalTeachers}</span>
                  <span className="cdash-stat-label">Giáo viên</span>
                </div>
              </div>
            </div>

            <div className="cdash-divider" />

            {/* Quick Actions */}
            <div className="cdash-section-title">Truy cập nhanh</div>
            <div className="cdash-quick-actions">
              <button className="cdash-quick-action" onClick={() => setActiveTab('classes')}>
                <School size={18} />
                <span>Lớp học</span>
              </button>
              <button className="cdash-quick-action" onClick={() => setActiveTab('students')}>
                <Users size={18} />
                <span>Thành viên</span>
              </button>
              {onNavigate && (
                <button className="cdash-quick-action" onClick={() => onNavigate('classroom')}>
                  <GraduationCap size={18} />
                  <span>Quản lí lớp</span>
                </button>
              )}
              {isAdmin && (
                <button className="cdash-quick-action" onClick={() => setActiveTab('settings')}>
                  <UserPlus size={18} />
                  <span>Mời học viên</span>
                </button>
              )}
              {onNavigate && (
                <button className="cdash-quick-action" onClick={() => onNavigate('study')}>
                  <BookOpen size={18} />
                  <span>Học tập</span>
                </button>
              )}
              {isAdmin && (
                <button className="cdash-quick-action" onClick={() => setActiveTab('settings')}>
                  <Settings size={18} />
                  <span>Cài đặt</span>
                </button>
              )}
            </div>

            <div className="cdash-divider" />

            {/* Recent Classes */}
            <div className="cdash-section-title">Lớp học</div>
            <div className="cdash-recent-list">
              {classrooms.slice(0, 5).map(c => (
                <div
                  key={c.id}
                  className="cdash-class-card"
                  data-level={c.level}
                  onClick={() => onNavigate?.('classroom')}
                >
                  <div className={`cdash-class-icon ${c.level}`}>
                    <School size={17} />
                  </div>
                  <div className="cdash-class-info">
                    <span className="cdash-class-name">{c.name}</span>
                    <div className="cdash-class-meta">
                      <span><Users size={11} /> {c.studentCount}</span>
                      {c.schedule?.[0] && (
                        <span><Clock size={11} /> {DAY_OF_WEEK_LABELS[c.schedule[0].dayOfWeek]}</span>
                      )}
                    </div>
                  </div>
                  <div className={`cdash-class-status ${c.isActive ? 'active' : 'inactive'}`} />
                  <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />
                </div>
              ))}
              {classrooms.length === 0 && !classLoading && (
                <div className="cdash-empty">
                  <div className="cdash-empty-icon"><School size={24} /></div>
                  <p>Chưa có lớp học nào</p>
                  {isAdmin && <span className="cdash-empty-hint">Tạo lớp học đầu tiên cho trung tâm</span>}
                </div>
              )}
            </div>

            <div className="cdash-divider" />

            {/* Quiz Battle Leaderboard */}
            <DashboardLeaderboard currentUserId={currentUser.id} />
          </>
        )}

        {/* ────── ANALYTICS TAB ────── */}
        {activeTab === 'analytics' && (
          <CenterAnalyticsTab analytics={analytics} totalStudents={studentCount} />
        )}

        {/* ────── CLASSES TAB ────── */}
        {activeTab === 'classes' && (
          <>
            <div className="cdash-toolbar">
              <div className="cdash-search">
                <Search size={15} />
                <input
                  value={classSearch}
                  onChange={e => setClassSearch(e.target.value)}
                  placeholder="Tìm lớp theo tên hoặc mã..."
                />
              </div>
              {isAdmin && onNavigate && (
                <button className="cdash-btn-add" onClick={() => onNavigate('classroom')}>
                  <Plus size={14} /> Tạo lớp
                </button>
              )}
            </div>

            <div className="cdash-filters">
              {([
                { key: 'all', label: `Tất cả (${classrooms.length})` },
                { key: 'basic', label: `Cơ bản` },
                { key: 'intermediate', label: `Trung cấp` },
                { key: 'advanced', label: `Nâng cao` },
              ] as { key: ClassFilter; label: string }[]).map(f => (
                <button
                  key={f.key}
                  className={`cdash-filter-pill ${classFilter === f.key ? 'active' : ''}`}
                  onClick={() => setClassFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {(classSearch.trim() || classFilter !== 'all') && (
              <div className="cdash-result-count">{filteredClasses.length} kết quả</div>
            )}

            <div className="cdash-class-list">
              {classLoading ? (
                <div className="cdash-loading"><div className="app-loading-spinner" /></div>
              ) : filteredClasses.length === 0 ? (
                <div className="cdash-empty">
                  <div className="cdash-empty-icon"><School size={24} /></div>
                  <p>{classSearch || classFilter !== 'all' ? 'Không tìm thấy lớp nào' : 'Chưa có lớp học'}</p>
                </div>
              ) : (
                filteredClasses.map(c => (
                  <div
                    key={c.id}
                    className="cdash-class-card"
                    data-level={c.level}
                    onClick={() => onNavigate?.('classroom')}
                  >
                    <div className={`cdash-class-icon ${c.level}`}>
                      <School size={17} />
                    </div>
                    <div className="cdash-class-info">
                      <span className="cdash-class-name">{c.name}</span>
                      <div className="cdash-class-meta">
                        <span><Users size={11} /> {c.studentCount} học viên</span>
                        {c.schedule?.length > 0 && (
                          <span className="cdash-schedule-text">
                            <Calendar size={11} /> {formatSchedule(c)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="cdash-class-count-bar">
                      <span className="count-num">{c.studentCount}</span>
                      <span className="count-label">HV</span>
                    </div>
                    <span className={`cdash-class-level ${c.level}`}>
                      {CLASSROOM_LEVEL_LABELS[c.level]}
                    </span>
                    <div className={`cdash-class-status ${c.isActive ? 'active' : 'inactive'}`} />
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ────── MEMBERS TAB ────── */}
        {activeTab === 'students' && (
          <>
            {/* Mini stats */}
            <div className="cdash-stats-grid" style={{ marginBottom: '0.5rem' }}>
              <div className="cdash-stat-card">
                <div className="cdash-stat-icon green"><GraduationCap size={16} /></div>
                <div className="cdash-stat-info">
                  <span className="cdash-stat-value">{studentCount}</span>
                  <span className="cdash-stat-label">Học viên</span>
                </div>
              </div>
              <div className="cdash-stat-card">
                <div className="cdash-stat-icon blue"><BookOpen size={16} /></div>
                <div className="cdash-stat-info">
                  <span className="cdash-stat-value">{teacherCount}</span>
                  <span className="cdash-stat-label">Giáo viên</span>
                </div>
              </div>
            </div>

            <div className="cdash-toolbar">
              <div className="cdash-search">
                <Search size={15} />
                <input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Tìm theo tên..."
                />
              </div>
            </div>

            <div className="cdash-filters">
              {([
                { key: 'all', label: `Tất cả (${members.length})` },
                { key: 'student', label: `Học viên (${studentCount})` },
                { key: 'teacher', label: `Giáo viên (${teacherCount})` },
                { key: 'admin', label: 'Admin' },
              ] as { key: MemberFilter; label: string }[]).map(f => (
                <button
                  key={f.key}
                  className={`cdash-filter-pill ${memberFilter === f.key ? 'active' : ''}`}
                  onClick={() => setMemberFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {(memberSearch.trim() || memberFilter !== 'all') && (
              <div className="cdash-result-count">{filteredMembers.length} kết quả</div>
            )}

            <div className="cdash-student-list">
              {membersLoading ? (
                <div className="cdash-loading"><div className="app-loading-spinner" /></div>
              ) : filteredMembers.length === 0 ? (
                <div className="cdash-empty">
                  <div className="cdash-empty-icon"><Users size={24} /></div>
                  <p>{memberSearch || memberFilter !== 'all' ? 'Không tìm thấy' : 'Chưa có thành viên'}</p>
                </div>
              ) : (
                filteredMembers.map(m => (
                  <div key={m.member.id} className="cdash-student-card">
                    <div className={`cdash-student-avatar ${getAvatarClass(m.member.role)}`}>
                      {m.avatar && isImageAvatar(m.avatar) ? (
                        <img src={m.avatar} alt={m.displayName} loading="lazy" />
                      ) : (
                        <span>{m.avatar || m.displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="cdash-student-info">
                      <span className="cdash-student-name">{m.displayName}</span>
                      <span
                        className="cdash-student-role"
                        style={{
                          color: BRANCH_MEMBER_ROLE_COLORS[m.member.role],
                          background: `${BRANCH_MEMBER_ROLE_COLORS[m.member.role]}18`,
                        }}
                      >
                        {BRANCH_MEMBER_ROLE_LABELS[m.member.role]}
                      </span>
                    </div>
                    <span className="cdash-student-joined">
                      {new Date(m.member.joinedAt).toLocaleDateString('vi-VN')}
                    </span>
                    {isAdmin && m.member.role !== 'branch_admin' && (
                      <div className="cdash-student-actions">
                        <button
                          className="cdash-btn-remove"
                          onClick={() => handleRemove(m)}
                          disabled={removing === m.member.id}
                          title="Xóa thành viên"
                        >
                          <UserMinus size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ────── SETTINGS TAB ────── */}
        {activeTab === 'settings' && isAdmin && (
          <>
            <div className="cdash-settings-section">
              <div className="cdash-settings-section-title">
                <UserPlus size={16} /> Quản lý mã mời
              </div>
              <CenterInviteManager
                branchId={center.id}
                centerSlug={center.slug || ''}
                currentUserId={currentUser.id}
              />
            </div>

            <div className="cdash-divider" />

            <div className="cdash-settings-section">
              <div className="cdash-settings-section-title">
                <Settings size={16} /> Giao diện trung tâm
              </div>
              <CenterBrandingEditor center={center} />
            </div>
          </>
        )}

      </div>
    </div>
  );
}
