// Left sidebar navigation component

import { useState, type ReactNode } from 'react';
import type { CurrentUser } from '../../types/user';
import type { Page } from './header';
import {
  Home,
  ClipboardList,
  BookOpen,
  BarChart3,
  Gamepad2,
  FileText,
  GraduationCap,
  MessageCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Helper to get role display name
const getRoleBadge = (role: string): { label: string; className: string } | null => {
  switch (role) {
    case 'super_admin': return { label: 'Super Admin', className: 'role-badge super-admin' };
    case 'admin': return { label: 'Admin', className: 'role-badge admin' };
    case 'vip_user': return { label: 'VIP', className: 'role-badge vip' };
    default: return null;
  }
};

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: CurrentUser | null;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  page: Page;
  label: string;
  icon: ReactNode;
  roles?: string[]; // If specified, only show for these roles
}

const iconProps = { size: 20, strokeWidth: 1.75 };

const navItems: NavItem[] = [
  { page: 'home', label: 'Trang chủ', icon: <Home {...iconProps} /> },
  { page: 'cards', label: 'Quản Lí', icon: <ClipboardList {...iconProps} />, roles: ['admin', 'super_admin'] },
  { page: 'study', label: 'Học', icon: <BookOpen {...iconProps} /> },
  { page: 'progress', label: 'Tiến độ', icon: <BarChart3 {...iconProps} /> },
  { page: 'quiz', label: 'Game', icon: <Gamepad2 {...iconProps} /> },
  { page: 'jlpt', label: 'JLPT', icon: <FileText {...iconProps} /> },
  { page: 'lectures', label: 'Bài giảng', icon: <GraduationCap {...iconProps} /> },
  { page: 'kaiwa', label: '会話', icon: <MessageCircle {...iconProps} />, roles: ['vip_user', 'admin', 'super_admin'] },
  { page: 'settings', label: 'Cài đặt', icon: <Settings {...iconProps} /> },
];

export function Sidebar({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const canAccess = (item: NavItem): boolean => {
    if (!item.roles) return true;
    if (!currentUser) return false;
    return item.roles.includes(currentUser.role);
  };

  const roleBadge = currentUser ? getRoleBadge(currentUser.role) : null;

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger-icon ${mobileOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo/Title */}
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            {isCollapsed ? '日' : '日本語 Flashcards'}
          </h1>
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User info */}
        {currentUser && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {currentUser.avatar || (currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-username">
                  {currentUser.displayName || currentUser.username}
                </span>
                {roleBadge && (
                  <span className={roleBadge.className}>{roleBadge.label}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            if (!canAccess(item)) return null;
            return (
              <button
                key={item.page}
                className={`sidebar-nav-btn ${currentPage === item.page ? 'active' : ''}`}
                onClick={() => handleNavigate(item.page)}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="sidebar-nav-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        {currentUser && (
          <div className="sidebar-footer">
            <button
              className="sidebar-logout-btn"
              onClick={onLogout}
              title={isCollapsed ? 'Đăng xuất' : undefined}
            >
              <span className="sidebar-nav-icon"><LogOut {...iconProps} /></span>
              {!isCollapsed && <span className="sidebar-nav-label">Đăng xuất</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
