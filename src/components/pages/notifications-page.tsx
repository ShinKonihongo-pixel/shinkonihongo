// Notifications management page - view all notifications, gift statistics, and settings

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Gift,
  Settings,
  Check,
  Filter,
  School,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useUserData } from '../../contexts/user-data-context';

// Combined notification type for display
interface CombinedNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  source: 'classroom' | 'friend';
  relatedId?: string;
  fromUserName?: string;
}

interface NotificationSettings {
  enableClassroom: boolean;
  enableFriend: boolean;
  enableBadgeGifts: boolean;
  enableDeadlineReminder: boolean;
  reminderHoursBefore: number;
}

type TabType = 'all' | 'classroom' | 'gifts' | 'settings';
type FilterType = 'all' | 'unread' | 'read';

export function NotificationsPage() {
  const {
    classroomNotifications,
    friendNotifications,
    markClassroomRead,
    markAllClassroomRead,
    markFriendRead,
    markAllFriendRead,
  } = useUserData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [filter, setFilter] = useState<FilterType>('all');
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      enableClassroom: true,
      enableFriend: true,
      enableBadgeGifts: true,
      enableDeadlineReminder: true,
      reminderHoursBefore: 24,
    };
  });

  // Save settings to localStorage
  const updateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  // Combine and transform notifications
  const combinedNotifications = useMemo<CombinedNotification[]>(() => {
    const classroom: CombinedNotification[] = classroomNotifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
      source: 'classroom' as const,
      relatedId: n.relatedId,
    }));

    const friend: CombinedNotification[] = friendNotifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.type === 'badge_received' ? 'Nhận quà tặng' : n.message,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
      source: 'friend' as const,
      relatedId: n.relatedId,
      fromUserName: n.fromUserName,
    }));

    return [...classroom, ...friend].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [classroomNotifications, friendNotifications]);

  // Gift statistics
  const giftStats = useMemo(() => {
    const gifts = friendNotifications.filter(n => n.type === 'badge_received');
    const byUser = gifts.reduce((acc, gift) => {
      const name = gift.fromUserName || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: gifts.length,
      unread: gifts.filter(g => !g.isRead).length,
      byUser: Object.entries(byUser).sort((a, b) => b[1] - a[1]),
    };
  }, [friendNotifications]);

  // Filter notifications based on tab and filter
  const filteredNotifications = useMemo(() => {
    let result = combinedNotifications;

    // Filter by tab
    if (activeTab === 'classroom') {
      result = result.filter(n => n.source === 'classroom');
    } else if (activeTab === 'gifts') {
      result = result.filter(n => n.type === 'badge_received');
    }

    // Filter by read status
    if (filter === 'unread') {
      result = result.filter(n => !n.isRead);
    } else if (filter === 'read') {
      result = result.filter(n => n.isRead);
    }

    return result;
  }, [combinedNotifications, activeTab, filter]);

  // Handle notification click
  const handleNotificationClick = async (notification: CombinedNotification) => {
    // Mark as read
    if (!notification.isRead) {
      if (notification.source === 'classroom') {
        await markClassroomRead(notification.id);
      } else {
        await markFriendRead(notification.id);
      }
    }

    // Navigate based on type
    switch (notification.type) {
      case 'test_assigned':
      case 'assignment_assigned':
      case 'submission_graded':
      case 'deadline_reminder':
      case 'class_invitation':
        navigate('/classroom');
        break;
      case 'game_invitation':
        navigate('/games');
        break;
      case 'badge_received':
        // Stay on this page, show gifts tab
        setActiveTab('gifts');
        break;
      default:
        break;
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    await Promise.all([
      markAllClassroomRead(),
      markAllFriendRead(),
    ]);
  };

  // Format time
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

  // Get icon for notification type
  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'test_assigned': return '📝';
      case 'assignment_assigned': return '📋';
      case 'submission_graded': return '✅';
      case 'deadline_reminder': return '⏰';
      case 'class_invitation': return '🎓';
      case 'announcement': return '📢';
      case 'badge_received': return '🎁';
      case 'friend_request': return '👋';
      case 'friend_accepted': return '🤝';
      case 'game_invitation': return '🎮';
      default: return '🔔';
    }
  };

  const unreadCount = combinedNotifications.filter(n => !n.isRead).length;

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-left">
          <Bell size={24} />
          <h1>Thông báo</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} chưa đọc</span>
          )}
        </div>
        <div className="notifications-header-actions">
          {unreadCount > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
              <Check size={16} />
              Đọc tất cả
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="notifications-tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Bell size={18} />
          <span>Tất cả</span>
          {combinedNotifications.filter(n => !n.isRead).length > 0 && (
            <span className="tab-badge">{combinedNotifications.filter(n => !n.isRead).length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'classroom' ? 'active' : ''}`}
          onClick={() => setActiveTab('classroom')}
        >
          <School size={18} />
          <span>Lớp học</span>
          {classroomNotifications.filter(n => !n.isRead).length > 0 && (
            <span className="tab-badge">{classroomNotifications.filter(n => !n.isRead).length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'gifts' ? 'active' : ''}`}
          onClick={() => setActiveTab('gifts')}
        >
          <Gift size={18} />
          <span>Quà tặng</span>
          {giftStats.unread > 0 && (
            <span className="tab-badge">{giftStats.unread}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          <span>Cài đặt</span>
        </button>
      </div>

      {/* Content */}
      <div className="notifications-content">
        {activeTab === 'settings' ? (
          // Settings Panel
          <div className="notification-settings">
            <h2>Cài đặt thông báo</h2>

            <div className="settings-section">
              <h3>Loại thông báo</h3>

              <label className="setting-item">
                <div className="setting-info">
                  <School size={20} />
                  <div>
                    <span className="setting-title">Thông báo lớp học</span>
                    <span className="setting-desc">Bài kiểm tra, bài tập, điểm số</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableClassroom}
                  onChange={e => updateSettings({ ...settings, enableClassroom: e.target.checked })}
                />
              </label>

              <label className="setting-item">
                <div className="setting-info">
                  <Users size={20} />
                  <div>
                    <span className="setting-title">Thông báo bạn bè</span>
                    <span className="setting-desc">Lời mời kết bạn, chơi game</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableFriend}
                  onChange={e => updateSettings({ ...settings, enableFriend: e.target.checked })}
                />
              </label>

              <label className="setting-item">
                <div className="setting-info">
                  <Gift size={20} />
                  <div>
                    <span className="setting-title">Thông báo quà tặng</span>
                    <span className="setting-desc">Khi nhận được huy hiệu từ bạn bè</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableBadgeGifts}
                  onChange={e => updateSettings({ ...settings, enableBadgeGifts: e.target.checked })}
                />
              </label>
            </div>

            <div className="settings-section">
              <h3>Nhắc nhở deadline</h3>

              <label className="setting-item">
                <div className="setting-info">
                  <Bell size={20} />
                  <div>
                    <span className="setting-title">Bật nhắc nhở</span>
                    <span className="setting-desc">Nhắc trước khi bài tập hết hạn</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableDeadlineReminder}
                  onChange={e => updateSettings({ ...settings, enableDeadlineReminder: e.target.checked })}
                />
              </label>

              {settings.enableDeadlineReminder && (
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-title">Nhắc trước</span>
                  </div>
                  <select
                    value={settings.reminderHoursBefore}
                    onChange={e => updateSettings({ ...settings, reminderHoursBefore: Number(e.target.value) })}
                  >
                    <option value={1}>1 giờ</option>
                    <option value={3}>3 giờ</option>
                    <option value={6}>6 giờ</option>
                    <option value={12}>12 giờ</option>
                    <option value={24}>24 giờ</option>
                    <option value={48}>2 ngày</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'gifts' ? (
          // Gifts Statistics Panel
          <div className="gifts-panel">
            {/* Gift Stats Summary */}
            <div className="gifts-stats">
              <div className="stat-card">
                <Gift size={32} className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{giftStats.total}</span>
                  <span className="stat-label">Tổng quà nhận</span>
                </div>
              </div>
              <div className="stat-card">
                <Users size={32} className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{giftStats.byUser.length}</span>
                  <span className="stat-label">Người gửi</span>
                </div>
              </div>
            </div>

            {/* Top Gifters */}
            {giftStats.byUser.length > 0 && (
              <div className="top-gifters">
                <h3>Người tặng nhiều nhất</h3>
                <div className="gifters-list">
                  {giftStats.byUser.slice(0, 5).map(([name, count], index) => (
                    <div key={name} className="gifter-item">
                      <span className="gifter-rank">#{index + 1}</span>
                      <span className="gifter-avatar">{name.charAt(0).toUpperCase()}</span>
                      <span className="gifter-name">{name}</span>
                      <span className="gifter-count">{count} quà</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gift Notifications List */}
            <div className="gifts-list">
              <h3>Lịch sử nhận quà</h3>
              {filteredNotifications.length === 0 ? (
                <div className="empty-state">
                  <Gift size={48} />
                  <p>Chưa có quà tặng nào</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
                    <div className="notification-body">
                      <span className="notification-title">
                        {notification.fromUserName} đã tặng bạn một huy hiệu
                      </span>
                      <span className="notification-time">{formatTime(notification.createdAt)}</span>
                    </div>
                    {!notification.isRead && <span className="unread-dot" />}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // All/Classroom Notifications List
          <>
            {/* Filter */}
            <div className="notifications-filter">
              <Filter size={16} />
              <select value={filter} onChange={e => setFilter(e.target.value as FilterType)}>
                <option value="all">Tất cả</option>
                <option value="unread">Chưa đọc</option>
                <option value="read">Đã đọc</option>
              </select>
            </div>

            {/* Notifications List */}
            <div className="notifications-list">
              {filteredNotifications.length === 0 ? (
                <div className="empty-state">
                  <Bell size={48} />
                  <p>Không có thông báo</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
                    <div className="notification-body">
                      <span className="notification-title">{notification.title}</span>
                      <span className="notification-message">{notification.message}</span>
                      <span className="notification-time">{formatTime(notification.createdAt)}</span>
                    </div>
                    <ChevronRight size={18} className="notification-arrow" />
                    {!notification.isRead && <span className="unread-dot" />}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
