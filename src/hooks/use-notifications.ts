// Hook for managing browser notifications for spaced repetition reminders

import { useState, useEffect, useCallback } from 'react';
import type { Flashcard } from '../types/flashcard';

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:MM format
  minCardsDue: number; // Minimum cards due to trigger notification
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  reminderTime: '09:00',
  minCardsDue: 5,
};

const STORAGE_KEY = 'flashcard-notification-settings';
const LAST_NOTIFICATION_KEY = 'flashcard-last-notification-date';

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function useNotifications(cards: Flashcard[]) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  });

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission(Notification.permission);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Calculate cards due today
  const cardsDueToday = cards.filter(c => c.nextReviewDate <= getTodayISO()).length;

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch {
      return false;
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Send notification
  const sendNotification = useCallback((title: string, body: string) => {
    if (permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'flashcard-reminder',
        requireInteraction: false,
      });
    } catch {
      // Fallback for mobile
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
        });
      }
    }
  }, [permission]);

  // Check and send reminder
  const checkAndSendReminder = useCallback(() => {
    if (!settings.enabled || permission !== 'granted') return;
    if (cardsDueToday < settings.minCardsDue) return;

    // Check if already sent today
    const lastNotification = localStorage.getItem(LAST_NOTIFICATION_KEY);
    const today = getTodayISO();
    if (lastNotification === today) return;

    // Check if current time matches reminder time
    const now = new Date();
    const [hours, minutes] = settings.reminderTime.split(':').map(Number);
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);

    // Send if within 5 minutes of reminder time
    const diffMinutes = Math.abs(now.getTime() - reminderDate.getTime()) / (1000 * 60);
    if (diffMinutes <= 5) {
      sendNotification(
        '📚 Đến giờ ôn bài rồi!',
        `Bạn có ${cardsDueToday} thẻ cần ôn hôm nay. Hãy học ngay để không quên nhé!`
      );
      localStorage.setItem(LAST_NOTIFICATION_KEY, today);
    }
  }, [settings, permission, cardsDueToday, sendNotification]);

  // Set up interval to check reminders
  useEffect(() => {
    if (!settings.enabled || permission !== 'granted') return;

    // Check immediately
    checkAndSendReminder();

    // Check every minute
    const interval = setInterval(checkAndSendReminder, 60000);
    return () => clearInterval(interval);
  }, [settings.enabled, permission, checkAndSendReminder]);

  // Send manual notification
  const sendManualReminder = useCallback(() => {
    if (cardsDueToday > 0) {
      sendNotification(
        '📚 Nhắc nhở ôn bài',
        `Bạn có ${cardsDueToday} thẻ cần ôn. Học ngay nào!`
      );
    } else {
      sendNotification(
        '✨ Tuyệt vời!',
        'Bạn đã ôn hết các thẻ cần thiết hôm nay!'
      );
    }
  }, [cardsDueToday, sendNotification]);

  return {
    permission,
    settings,
    cardsDueToday,
    isSupported: 'Notification' in window,
    requestPermission,
    updateSettings,
    sendManualReminder,
  };
}
