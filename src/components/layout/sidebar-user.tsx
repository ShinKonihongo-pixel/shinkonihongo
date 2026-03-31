// SidebarUser — avatar, username, notification bell, and dropdown menus

import { Settings, User, LogOut, Bell } from 'lucide-react';
import type { CurrentUser } from '../../types/user';
import type { Page } from './header';
import { isImageAvatar } from '../../utils/avatar-icons';
import { useCenterOptional } from '../../contexts/center-context';
import { BRANCH_MEMBER_ROLE_LABELS, BRANCH_MEMBER_ROLE_COLORS } from '../../types/branch';
import { SidebarNotifications } from './sidebar-notifications';
import type { DailyWordsNotification } from './sidebar-types';
import type { ClassroomNotification } from '../../types/classroom';
import type { FriendNotification } from '../../types/friendship';

interface SidebarUserProps {
  currentUser: CurrentUser;
  isCollapsed: boolean;
  showNotifications: boolean;
  showAvatarMenu: boolean;
  totalUnread: number;
  classroomNotifications: ClassroomNotification[];
  friendNotifications: FriendNotification[];
  dailyWordsNotification: DailyWordsNotification | undefined;
  hasDailyWordsReminder: boolean;
  markClassroomRead: (id: string) => Promise<boolean>;
  markAllClassroomRead: () => void;
  markFriendRead: (id: string) => Promise<boolean>;
  markAllFriendRead: () => void;
  onToggleNotifications: () => void;
  onToggleAvatarMenu: () => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  onCloseNotifications: () => void;
  onCloseAvatarMenu: () => void;
  onCloseMobile: () => void;
}

export function SidebarUser({
  currentUser,
  isCollapsed,
  showNotifications,
  showAvatarMenu,
  totalUnread,
  classroomNotifications,
  friendNotifications,
  dailyWordsNotification,
  hasDailyWordsReminder,
  markClassroomRead,
  markAllClassroomRead,
  markFriendRead,
  markAllFriendRead,
  onToggleNotifications,
  onToggleAvatarMenu,
  onNavigate,
  onLogout,
  onCloseNotifications,
  onCloseAvatarMenu,
  onCloseMobile,
}: SidebarUserProps) {
  const centerCtx = useCenterOptional();
  const avatarValue = currentUser.avatar;
  const isAvatarImage = avatarValue ? isImageAvatar(avatarValue) : false;

  return (
    <div className={`sidebar-user ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Notification bell - only show when sidebar is expanded */}
      {!isCollapsed && (
        <button
          className="sidebar-notification-btn"
          onClick={onToggleNotifications}
          title="Thông báo"
          aria-label={`Thông báo${totalUnread > 0 ? `, ${totalUnread} chưa đọc` : ''}`}
        >
          <Bell size={18} />
          {totalUnread > 0 && (
            <span className="notification-badge-count">{totalUnread > 9 ? '9+' : totalUnread}</span>
          )}
        </button>
      )}

      {/* Avatar - centered, clickable */}
      <div className="sidebar-avatar-wrapper">
        <button
          className={`sidebar-user-avatar ${isAvatarImage ? 'has-image' : ''}`}
          onClick={onToggleAvatarMenu}
          title={isCollapsed ? (currentUser.displayName || currentUser.username) : undefined}
          aria-label={`Menu tài khoản của ${currentUser.displayName || currentUser.username}`}
          style={isAvatarImage ? { backgroundImage: `url(${avatarValue})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!isAvatarImage && (avatarValue || (currentUser.displayName || currentUser.username).charAt(0).toUpperCase())}
        </button>

        {/* Avatar dropdown menu */}
        {showAvatarMenu && (
          <div className="sidebar-avatar-menu">
            <button
              className="avatar-menu-item"
              onClick={() => { onNavigate('settings'); onCloseAvatarMenu(); onCloseMobile(); }}
            >
              <Settings size={16} /> Cài đặt
            </button>
            <button
              className="avatar-menu-item"
              onClick={() => { onNavigate('profile'); onCloseAvatarMenu(); onCloseMobile(); }}
            >
              <User size={16} /> Cá nhân
            </button>
            <button
              className="avatar-menu-item logout"
              onClick={() => { onLogout(); onCloseAvatarMenu(); }}
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Username + center role badge - below avatar */}
      {!isCollapsed && (
        <span className={`sidebar-username role-name-${currentUser.role}`}>
          {currentUser.displayName || currentUser.username}
          {centerCtx && centerCtx.userRole && (
            <span
              className="sidebar-center-role-badge"
              style={{
                backgroundColor: centerCtx.userRole === 'director'
                  ? '#e74c3c'
                  : BRANCH_MEMBER_ROLE_COLORS[centerCtx.userRole as keyof typeof BRANCH_MEMBER_ROLE_COLORS] || '#888',
              }}
            >
              {centerCtx.userRole === 'director'
                ? 'Giám đốc'
                : BRANCH_MEMBER_ROLE_LABELS[centerCtx.userRole as keyof typeof BRANCH_MEMBER_ROLE_LABELS] || centerCtx.userRole}
            </span>
          )}
        </span>
      )}

      {/* Notification dropdown — extracted to sidebar-notifications.tsx */}
      {showNotifications && (
        <SidebarNotifications
          classroomNotifications={classroomNotifications}
          friendNotifications={friendNotifications}
          dailyWordsNotification={dailyWordsNotification ? {
            progress: dailyWordsNotification.progress,
            streak: dailyWordsNotification.streak,
            onDismiss: dailyWordsNotification.onDismiss,
            onOpenModal: dailyWordsNotification.onOpenModal,
          } : null}
          hasDailyWordsReminder={hasDailyWordsReminder}
          totalUnread={totalUnread}
          onMarkAllClassroomRead={markAllClassroomRead}
          onMarkAllFriendRead={markAllFriendRead}
          onMarkClassroomRead={markClassroomRead}
          onMarkFriendRead={markFriendRead}
          onNavigate={onNavigate}
          onClose={onCloseNotifications}
        />
      )}
    </div>
  );
}
