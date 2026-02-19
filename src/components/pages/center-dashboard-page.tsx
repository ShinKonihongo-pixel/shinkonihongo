// Center dashboard - admin overview with stats, invites, branding editor

import { useState, useEffect } from 'react';
import {
  Users, BookOpen, GraduationCap, Settings, UserPlus,
  BarChart3, Layers, Sparkles, ChevronRight, Building2,
} from 'lucide-react';
import { useCenter } from '../../contexts/center-context';
import { getBranchStats } from '../../services/branch-firestore';
import { CenterInviteManager } from '../center/center-invite-manager';
import { CenterBrandingEditor } from '../center/center-branding-editor';
import type { BranchStats } from '../../types/branch';
import type { CurrentUser } from '../../types/user';
import '../center/center.css';

interface CenterDashboardPageProps {
  currentUser: CurrentUser;
}

type DashTab = 'home' | 'invites' | 'branding';

const ROLE_LABELS: Record<string, string> = {
  director: 'Giám đốc',
  branch_admin: 'Admin',
  student: 'Học viên',
  main_teacher: 'Giáo viên chính',
  part_time_teacher: 'Giáo viên part-time',
  assistant: 'Trợ giảng',
};

export function CenterDashboardPage({ currentUser }: CenterDashboardPageProps) {
  const { center, isAdmin, branding, userRole } = useCenter();
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [activeTab, setActiveTab] = useState<DashTab>('home');

  useEffect(() => {
    getBranchStats(center.id).then(setStats);
  }, [center.id]);

  const roleLabel = (userRole && ROLE_LABELS[userRole]) || 'Thành viên';

  return (
    <div className="center-dashboard">
      {/* Premium header */}
      <div className="center-dashboard-header">
        {branding.logo ? (
          <img src={branding.logo} alt={center.name} className="center-dashboard-logo" />
        ) : (
          <div className="center-dashboard-logo-placeholder">
            <Building2 size={24} />
          </div>
        )}
        <div className="center-dashboard-title">
          <h1>{center.name}</h1>
          <p>
            <span className="center-role-badge">{roleLabel}</span>
          </p>
        </div>
      </div>

      {/* Admin tabs */}
      {isAdmin && (
        <div className="center-dashboard-tabs">
          <button className={`center-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <BarChart3 size={16} />
            <span>Tổng quan</span>
          </button>
          <button className={`center-tab ${activeTab === 'invites' ? 'active' : ''}`} onClick={() => setActiveTab('invites')}>
            <UserPlus size={16} />
            <span>Mã mời</span>
          </button>
          <button className={`center-tab ${activeTab === 'branding' ? 'active' : ''}`} onClick={() => setActiveTab('branding')}>
            <Settings size={16} />
            <span>Giao diện</span>
          </button>
        </div>
      )}

      {/* Home tab */}
      {activeTab === 'home' && (
        <>
          {/* Stats with icons */}
          <div className="center-dashboard-stats">
            <div className="center-dashboard-stat">
              <div className="center-stat-icon"><Layers size={20} /></div>
              <div className="center-dashboard-stat-value">{stats?.totalClasses ?? '-'}</div>
              <div className="center-dashboard-stat-label">Lớp học</div>
            </div>
            <div className="center-dashboard-stat">
              <div className="center-stat-icon"><GraduationCap size={20} /></div>
              <div className="center-dashboard-stat-value">{stats?.totalStudents ?? '-'}</div>
              <div className="center-dashboard-stat-label">Học viên</div>
            </div>
            <div className="center-dashboard-stat">
              <div className="center-stat-icon"><BookOpen size={20} /></div>
              <div className="center-dashboard-stat-value">{stats?.totalTeachers ?? '-'}</div>
              <div className="center-dashboard-stat-label">Giáo viên</div>
            </div>
            <div className="center-dashboard-stat">
              <div className="center-stat-icon"><Sparkles size={20} /></div>
              <div className="center-dashboard-stat-value">{stats?.activeClasses ?? '-'}</div>
              <div className="center-dashboard-stat-label">Lớp đang học</div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="center-dashboard-section-title">Truy cập nhanh</div>
          <div className="center-dashboard-nav">
            <div className="center-dashboard-nav-item">
              <div className="center-dashboard-nav-icon"><BookOpen size={20} /></div>
              <div className="center-dashboard-nav-text">
                <span className="center-nav-label">Học tập</span>
                <span className="center-nav-desc">Từ vựng, ngữ pháp, Kanji</span>
              </div>
              <ChevronRight size={16} className="center-nav-arrow" />
            </div>
            <div className="center-dashboard-nav-item">
              <div className="center-dashboard-nav-icon"><GraduationCap size={20} /></div>
              <div className="center-dashboard-nav-text">
                <span className="center-nav-label">Lớp học</span>
                <span className="center-nav-desc">Danh sách lớp học</span>
              </div>
              <ChevronRight size={16} className="center-nav-arrow" />
            </div>
            {isAdmin && (
              <>
                <div className="center-dashboard-nav-item">
                  <div className="center-dashboard-nav-icon"><Users size={20} /></div>
                  <div className="center-dashboard-nav-text">
                    <span className="center-nav-label">Quản lý thành viên</span>
                    <span className="center-nav-desc">{stats?.totalStudents ?? 0} học viên, {stats?.totalTeachers ?? 0} giáo viên</span>
                  </div>
                  <ChevronRight size={16} className="center-nav-arrow" />
                </div>
                <button className="center-dashboard-nav-item" onClick={() => setActiveTab('invites')}>
                  <div className="center-dashboard-nav-icon"><UserPlus size={20} /></div>
                  <div className="center-dashboard-nav-text">
                    <span className="center-nav-label">Mời học viên</span>
                    <span className="center-nav-desc">Tạo & quản lý mã mời</span>
                  </div>
                  <ChevronRight size={16} className="center-nav-arrow" />
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Invites tab */}
      {activeTab === 'invites' && isAdmin && (
        <CenterInviteManager
          branchId={center.id}
          centerSlug={center.slug}
          currentUserId={currentUser.id}
        />
      )}

      {/* Branding tab */}
      {activeTab === 'branding' && isAdmin && (
        <CenterBrandingEditor center={center} />
      )}
    </div>
  );
}
