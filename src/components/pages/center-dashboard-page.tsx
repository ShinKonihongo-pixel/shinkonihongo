// Center dashboard - admin overview with stats, invites, branding editor

import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Settings, UserPlus, BarChart3 } from 'lucide-react';
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

export function CenterDashboardPage({ currentUser }: CenterDashboardPageProps) {
  const { center, isAdmin, branding, userRole } = useCenter();
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [activeTab, setActiveTab] = useState<DashTab>('home');

  useEffect(() => {
    getBranchStats(center.id).then(setStats);
  }, [center.id]);

  return (
    <div className="center-dashboard">
      {/* Header */}
      <div className="center-dashboard-header">
        {branding.logo && (
          <img src={branding.logo} alt={center.name} className="center-dashboard-logo" />
        )}
        <div className="center-dashboard-title">
          <h1>{center.name}</h1>
          <p>
            {userRole === 'director' ? 'Giám đốc' :
             userRole === 'branch_admin' ? 'Admin' :
             userRole === 'student' ? 'Học viên' :
             userRole === 'main_teacher' ? 'Giáo viên chính' :
             userRole === 'part_time_teacher' ? 'Giáo viên part-time' :
             userRole === 'assistant' ? 'Trợ giảng' : 'Thành viên'}
          </p>
        </div>
      </div>

      {/* Tabs for admin */}
      {isAdmin && (
        <div className="branch-mgmt-tabs" style={{ marginBottom: '1rem' }}>
          <button className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <span className="tab-icon"><BarChart3 size={14} /></span> Tổng quan
          </button>
          <button className={`tab-btn ${activeTab === 'invites' ? 'active' : ''}`} onClick={() => setActiveTab('invites')}>
            <span className="tab-icon"><UserPlus size={14} /></span> Mã mời
          </button>
          <button className={`tab-btn ${activeTab === 'branding' ? 'active' : ''}`} onClick={() => setActiveTab('branding')}>
            <span className="tab-icon"><Settings size={14} /></span> Giao diện
          </button>
        </div>
      )}

      {/* Home tab */}
      {activeTab === 'home' && (
        <>
          {/* Stats */}
          <div className="center-dashboard-stats">
            <div className="center-dashboard-stat">
              <div className="center-dashboard-stat-value">{stats?.totalClasses ?? '-'}</div>
              <div className="center-dashboard-stat-label">Lớp học</div>
            </div>
            <div className="center-dashboard-stat">
              <div className="center-dashboard-stat-value">{stats?.totalStudents ?? '-'}</div>
              <div className="center-dashboard-stat-label">Học viên</div>
            </div>
            <div className="center-dashboard-stat">
              <div className="center-dashboard-stat-value">{stats?.totalTeachers ?? '-'}</div>
              <div className="center-dashboard-stat-label">Giáo viên</div>
            </div>
            <div className="center-dashboard-stat">
              <div className="center-dashboard-stat-value">{stats?.activeClasses ?? '-'}</div>
              <div className="center-dashboard-stat-label">Lớp đang học</div>
            </div>
          </div>

          {/* Quick info cards */}
          <div className="center-dashboard-nav">
            <div className="center-dashboard-nav-item">
              <BookOpen size={20} className="center-dashboard-nav-icon" /> Học tập
            </div>
            <div className="center-dashboard-nav-item">
              <GraduationCap size={20} className="center-dashboard-nav-icon" /> Lớp học
            </div>
            {isAdmin && (
              <>
                <div className="center-dashboard-nav-item">
                  <Users size={20} className="center-dashboard-nav-icon" /> Quản lý thành viên
                </div>
                <button className="center-dashboard-nav-item" onClick={() => setActiveTab('invites')}>
                  <UserPlus size={20} className="center-dashboard-nav-icon" /> Mời học viên
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
