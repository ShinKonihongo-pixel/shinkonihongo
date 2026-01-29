// Left sidebar navigation component

import { useState, type ReactNode } from 'react';
import type { CurrentUser } from '../../types/user';
import type { Page } from './header';
import { isImageAvatar } from '../../utils/avatar-icons';
import {
  Home,
  Layers,
  Gamepad2,
  Award,
  MessageCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
  Bell,
  Building2,
  BookOpen,
  Flame,
  Headphones,
  FileText,
  BookOpenCheck,
  LayoutGrid,
  User,
  ClipboardList,
} from 'lucide-react';
import { useClassroomNotifications } from '../../hooks/use-classrooms';
import { useFriendNotifications } from '../../hooks/use-friendships';

interface DailyWordsNotification {
  enabled: boolean;
  isCompleted: boolean;
  progress: {
    completed: number;
    target: number;
    percent: number;
  };
  streak: number;
  showNotification: boolean;
  onDismiss: () => void;
}

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: CurrentUser | null;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dailyWordsNotification?: DailyWordsNotification;
}

interface NavItem {
  page: Page;
  label: string;
  icon: ReactNode;
  roles?: string[]; // If specified, only show for these roles
}

const iconProps = { size: 20, strokeWidth: 1.75 };

// Section 1: Learning tabs (includes admin management)
const learningItems: NavItem[] = [
  { page: 'home', label: 'Trang chủ', icon: <Home {...iconProps} /> },
  { page: 'cards', label: 'Quản lí', icon: <LayoutGrid {...iconProps} />, roles: ['admin', 'super_admin'] },
  { page: 'study', label: 'Từ Vựng', icon: <Layers {...iconProps} /> },
  { page: 'grammar-study', label: 'Ngữ Pháp', icon: <FileText {...iconProps} /> },
  { page: 'reading', label: 'Đọc Hiểu', icon: <BookOpenCheck {...iconProps} /> },
  { page: 'listening', label: 'Nghe Hiểu', icon: <Headphones {...iconProps} /> },
  { page: 'exercises', label: 'Bài Tập', icon: <ClipboardList {...iconProps} /> },
];

// Section 2: Management/Activity tabs
const managementItems: NavItem[] = [
  { page: 'branches', label: 'Trung tâm', icon: <Building2 {...iconProps} />, roles: ['director', 'branch_admin', 'super_admin'] },
  { page: 'classroom', label: 'Lớp Học', icon: <School {...iconProps} /> },
  { page: 'jlpt', label: 'JLPT', icon: <Award {...iconProps} /> },
  { page: 'kaiwa', label: '会話', icon: <MessageCircle {...iconProps} />, roles: ['vip_user', 'admin', 'super_admin', 'director', 'branch_admin', 'main_teacher'] },
  { page: 'game-hub', label: 'Game', icon: <Gamepad2 {...iconProps} /> },
];

// No more role-specific items needed (moved to managementItems)
const roleSpecificItems: NavItem[] = [];

export function Sidebar({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  dailyWordsNotification,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // Classroom notifications
  const { notifications: classroomNotifications, unreadCount: classroomUnread, markAsRead: markClassroomRead, markAllAsRead: markAllClassroomRead } = useClassroomNotifications(currentUser?.id || null);

  // Friend notifications (including badge received)
  const { notifications: friendNotifications, unreadCount: friendUnread, markAsRead: markFriendRead, markAllAsRead: markAllFriendRead } = useFriendNotifications(currentUser?.id || null);

  // Daily words notification flag - use new showNotification prop
  const hasDailyWordsReminder = dailyWordsNotification?.showNotification ?? false;

  // Combined notifications
  const totalUnread = classroomUnread + friendUnread + (hasDailyWordsReminder ? 1 : 0);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const canAccess = (item: NavItem): boolean => {
    if (!item.roles) return true;
    if (!currentUser) return false;
    return item.roles.includes(currentUser.role);
  };

  // Get avatar value for display
  const avatarValue = currentUser?.avatar;
  const isAvatarImage = avatarValue ? isImageAvatar(avatarValue) : false;

  const renderNavItem = (item: NavItem) => {
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
  };

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
          <div className={`sidebar-user ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Notification bell - top right corner */}
            <button
              className="sidebar-notification-btn"
              onClick={() => { setShowNotifications(!showNotifications); setShowAvatarMenu(false); }}
              title="Thông báo"
            >
              <Bell size={18} />
              {totalUnread > 0 && (
                <span className="notification-badge-count">{totalUnread > 9 ? '9+' : totalUnread}</span>
              )}
            </button>

            {/* Avatar - centered, clickable */}
            <div className="sidebar-avatar-wrapper">
              <button
                className={`sidebar-user-avatar ${isAvatarImage ? 'has-image' : ''}`}
                onClick={() => { setShowAvatarMenu(!showAvatarMenu); setShowNotifications(false); }}
                title={isCollapsed ? (currentUser.displayName || currentUser.username) : undefined}
                style={isAvatarImage ? { backgroundImage: `url(${avatarValue})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!isAvatarImage && (avatarValue || (currentUser.displayName || currentUser.username).charAt(0).toUpperCase())}
              </button>

              {/* Avatar dropdown menu */}
              {showAvatarMenu && (
                <div className="sidebar-avatar-menu">
                  <button
                    className="avatar-menu-item"
                    onClick={() => { onNavigate('settings'); setShowAvatarMenu(false); setMobileOpen(false); }}
                  >
                    <Settings size={16} /> Cài đặt
                  </button>
                  <button
                    className="avatar-menu-item"
                    onClick={() => { onNavigate('profile'); setShowAvatarMenu(false); setMobileOpen(false); }}
                  >
                    <User size={16} /> Cá nhân
                  </button>
                  <button
                    className="avatar-menu-item logout"
                    onClick={() => { onLogout(); setShowAvatarMenu(false); }}
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Username - below avatar */}
            {!isCollapsed && (
              <span className={`sidebar-username role-name-${currentUser.role}`}>
                {currentUser.displayName || currentUser.username}
              </span>
            )}

            {/* Notification dropdown */}
            {showNotifications && (
          <div className="sidebar-notifications">
            <div className="sidebar-notifications-header">
              <span>Thông báo</span>
              {totalUnread > 0 && (
                <button
                  className="btn btn-link btn-xs"
                  onClick={() => {
                    markAllClassroomRead();
                    markAllFriendRead();
                  }}
                >
                  Đọc tất cả
                </button>
              )}
            </div>
            <div className="sidebar-notifications-list">
              {classroomNotifications.length === 0 && friendNotifications.length === 0 && !hasDailyWordsReminder ? (
                <p className="empty-text">Không có thông báo</p>
              ) : (
                <>
                  {/* Daily words notification */}
                  {hasDailyWordsReminder && dailyWordsNotification && (
                    <div
                      className="sidebar-notification-item unread daily-words-notification"
                      onClick={() => {
                        dailyWordsNotification.onDismiss(); // Dismiss notification
                        onNavigate('daily-words');
                        setShowNotifications(false);
                      }}
                    >
                      <span className="notification-icon daily-words-icon">
                        <BookOpen size={18} />
                      </span>
                      <div className="notification-content">
                        <span className="notification-title">Nhiệm vụ học từ hôm nay</span>
                        <span className="notification-progress">
                          {dailyWordsNotification.progress.completed}/{dailyWordsNotification.progress.target} từ
                          {dailyWordsNotification.streak > 0 && (
                            <span className="streak-badge">
                              <Flame size={12} /> {dailyWordsNotification.streak}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="notification-progress-bar">
                        <div
                          className="notification-progress-fill"
                          style={{ width: `${dailyWordsNotification.progress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Friend notifications (badge received, friend requests, etc.) */}
                  {friendNotifications.slice(0, 3).map(n => (
                      <div
                        key={n.id}
                        className={`sidebar-notification-item ${n.isRead ? '' : 'unread'} ${n.type === 'badge_received' ? 'badge-notification' : ''}`}
                        onClick={() => {
                          if (!n.isRead) markFriendRead(n.id);
                          // Navigate based on notification type
                          if (n.type === 'badge_received') {
                            onNavigate('notifications'); // Go to notifications page to see gift stats
                          } else if (n.type === 'game_invitation') {
                            onNavigate('quiz');
                          } else {
                            onNavigate('settings');
                          }
                          setShowNotifications(false);
                        }}
                      >
                        <span className="notification-icon">
                          {n.type === 'badge_received' && '🎁'}
                          {n.type === 'friend_request' && '👋'}
                          {n.type === 'friend_accepted' && '🤝'}
                          {n.type === 'game_invitation' && '🎮'}
                        </span>
                        <div className="notification-content">
                          <span className="notification-title">
                            {n.fromUserName || 'Ai đó'} {n.message}
                          </span>
                          {n.type === 'badge_received' && (
                            <span className="notification-subtitle">Nhận huy hiệu mới!</span>
                          )}
                        </div>
                      </div>
                  ))}
                  {/* Classroom notifications */}
                  {classroomNotifications.slice(0, 3).map(n => (
                    <div
                      key={n.id}
                      className={`sidebar-notification-item ${n.isRead ? '' : 'unread'}`}
                      onClick={() => {
                        if (!n.isRead) markClassroomRead(n.id);
                        // Navigate based on notification type
                        if (n.type === 'test_assigned' || n.type === 'assignment_assigned' || n.type === 'submission_graded') {
                          onNavigate('classroom');
                        } else if (n.type === 'deadline_reminder') {
                          onNavigate('classroom');
                        } else if (n.type === 'class_invitation') {
                          onNavigate('classroom');
                        } else {
                          onNavigate('notifications');
                        }
                        setShowNotifications(false);
                      }}
                    >
                      <span className="notification-icon">
                        {n.type === 'test_assigned' && '📝'}
                        {n.type === 'assignment_assigned' && '📋'}
                        {n.type === 'submission_graded' && '✅'}
                        {n.type === 'deadline_reminder' && '⏰'}
                        {n.type === 'class_invitation' && '🎓'}
                        {n.type === 'announcement' && '📢'}
                      </span>
                      <div className="notification-content">
                        <span className="notification-title">{n.title}</span>
                        <span className="notification-message">{n.message}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            {/* View all link */}
            {(classroomNotifications.length > 0 || friendNotifications.length > 0) && (
              <div className="sidebar-notifications-footer">
                <button
                  className="btn btn-link btn-sm"
                  onClick={() => {
                    onNavigate('notifications');
                    setShowNotifications(false);
                  }}
                >
                  Xem tất cả thông báo →
                </button>
              </div>
            )}
          </div>
        )}
          </div>
        )}

        {/* Navigation - Section 1: Learning */}
        <nav className="sidebar-nav">
          {learningItems.map(renderNavItem)}

          {/* Separator between sections */}
          <div className="sidebar-nav-separator" />

          {/* Section 2: Management */}
          {managementItems.map(renderNavItem)}

          {/* Role-specific items (if any) */}
          {roleSpecificItems.length > 0 && roleSpecificItems.some(item => canAccess(item)) && (
            <>
              <div className="sidebar-nav-separator" />
              {roleSpecificItems.map(renderNavItem)}
            </>
          )}
        </nav>

      </aside>
    </>
  );
}
