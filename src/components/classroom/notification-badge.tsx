// Notification badge component for header

import { useState } from 'react';
import type { ClassroomNotification } from '../../types/classroom';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  notifications: ClassroomNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onMarkAllAsRead: () => Promise<boolean>;
  onClick?: (notification: ClassroomNotification) => void;
}

export function NotificationBadge({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClick,
}: NotificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notification: ClassroomNotification) => {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }
    onClick?.(notification);
    setIsOpen(false);
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'test_assigned': return '📝';
      case 'assignment_assigned': return '📋';
      case 'submission_graded': return '✅';
      case 'deadline_reminder': return '⏰';
      case 'class_invitation': return '🎓';
      default: return '🔔';
    }
  };

  return (
    <div className="notification-badge-container">
      <button
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  className="btn btn-link btn-sm"
                  onClick={async () => {
                    await onMarkAllAsRead();
                  }}
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <p>Không có thông báo</p>
                </div>
              ) : (
                notifications.slice(0, 10).map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
                    <div className="notification-content">
                      <span className="notification-title">{notification.title}</span>
                      <span className="notification-message">{notification.message}</span>
                      <span className="notification-time">{formatTime(notification.createdAt)}</span>
                    </div>
                    {!notification.isRead && <span className="notification-dot" />}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 10 && (
              <div className="notification-footer">
                <button className="btn btn-link btn-sm">
                  Xem tất cả ({notifications.length})
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
