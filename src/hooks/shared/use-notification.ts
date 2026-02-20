// Auto-dismiss notification hook
// Replaces identical notification pattern across game pages

import { useState, useEffect } from 'react';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useNotification(timeout = 3000) {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), timeout);
    return () => clearTimeout(timer);
  }, [notification, timeout]);

  return { notification, setNotification };
}
