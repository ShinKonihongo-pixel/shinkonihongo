// Sidebar notification dropdown — shows classroom, friend, and daily words notifications
// Extracted from sidebar.tsx to reduce component size

import { BookOpen, Flame } from 'lucide-react';
import type { ClassroomNotification } from '../../types/classroom';
import type { FriendNotification } from '../../types/friendship';
import type { Page } from './header';

interface DailyWordsNotificationData {
  progress: { completed: number; target: number; percent: number };
  streak: number;
  onDismiss: () => void;
  onOpenModal: () => void;
}

interface SidebarNotificationsProps {
  classroomNotifications: ClassroomNotification[];
  friendNotifications: FriendNotification[];
  dailyWordsNotification: DailyWordsNotificationData | null;
  hasDailyWordsReminder: boolean;
  totalUnread: number;
  onMarkAllClassroomRead: () => void;
  onMarkAllFriendRead: () => void;
  onMarkClassroomRead: (id: string) => Promise<boolean>;
  onMarkFriendRead: (id: string) => Promise<boolean>;
  onNavigate: (page: Page) => void;
  onClose: () => void;
}

export function SidebarNotifications({
  classroomNotifications,
  friendNotifications,
  dailyWordsNotification,
  hasDailyWordsReminder,
  totalUnread,
  onMarkAllClassroomRead,
  onMarkAllFriendRead,
  onMarkClassroomRead,
  onMarkFriendRead,
  onNavigate,
  onClose,
}: SidebarNotificationsProps) {
  return (
    <div className="sidebar-notifications">
      <div className="sidebar-notifications-header">
        <span>Thông báo</span>
        {totalUnread > 0 && (
          <button className="btn btn-link btn-xs" onClick={() => { onMarkAllClassroomRead(); onMarkAllFriendRead(); }}>
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
                onClick={() => { dailyWordsNotification.onDismiss(); dailyWordsNotification.onOpenModal(); onClose(); }}
              >
                <span className="notification-icon daily-words-icon"><BookOpen size={18} /></span>
                <div className="notification-content">
                  <span className="notification-title">Nhiệm vụ học từ hôm nay</span>
                  <span className="notification-progress">
                    {dailyWordsNotification.progress.completed}/{dailyWordsNotification.progress.target} từ
                    {dailyWordsNotification.streak > 0 && (
                      <span className="streak-badge"><Flame size={12} /> {dailyWordsNotification.streak}</span>
                    )}
                  </span>
                </div>
                <div className="notification-progress-bar">
                  <div className="notification-progress-fill" style={{ width: `${dailyWordsNotification.progress.percent}%` }} />
                </div>
              </div>
            )}

            {/* Friend notifications */}
            {friendNotifications.slice(0, 3).map(n => (
              <div
                key={n.id}
                className={`sidebar-notification-item ${n.isRead ? '' : 'unread'} ${n.type === 'badge_received' ? 'badge-notification' : ''}`}
                onClick={() => {
                  if (!n.isRead) onMarkFriendRead(n.id);
                  if (n.type === 'badge_received') onNavigate('notifications');
                  else if (n.type === 'game_invitation') onNavigate('quiz' as Page);
                  else onNavigate('settings');
                  onClose();
                }}
              >
                <span className="notification-icon">
                  {n.type === 'badge_received' && '🎁'}
                  {n.type === 'friend_request' && '👋'}
                  {n.type === 'friend_accepted' && '🤝'}
                  {n.type === 'game_invitation' && '🎮'}
                </span>
                <div className="notification-content">
                  <span className="notification-title">{n.fromUserName || 'Ai đó'} {n.message}</span>
                  {n.type === 'badge_received' && <span className="notification-subtitle">Nhận huy hiệu mới!</span>}
                </div>
              </div>
            ))}

            {/* Classroom notifications */}
            {classroomNotifications.slice(0, 3).map(n => (
              <div
                key={n.id}
                className={`sidebar-notification-item ${n.isRead ? '' : 'unread'}`}
                onClick={() => {
                  if (!n.isRead) onMarkClassroomRead(n.id);
                  onNavigate(n.type === 'announcement' ? 'notifications' : 'classroom');
                  onClose();
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
      {(classroomNotifications.length > 0 || friendNotifications.length > 0) && (
        <div className="sidebar-notifications-footer">
          <button className="btn btn-link btn-sm" onClick={() => { onNavigate('notifications'); onClose(); }}>
            Xem tất cả thông báo →
          </button>
        </div>
      )}
    </div>
  );
}
