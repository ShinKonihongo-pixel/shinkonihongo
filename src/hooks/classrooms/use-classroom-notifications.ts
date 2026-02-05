// Classroom notifications management hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ClassroomNotification } from '../../types/classroom';
import * as classroomService from '../../services/classroom-firestore';

export function useClassroomNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<ClassroomNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToNotifications(userId, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await classroomService.markAsRead(notificationId);
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      await classroomService.markAllAsRead(userId);
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [userId]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Unread notifications
  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
