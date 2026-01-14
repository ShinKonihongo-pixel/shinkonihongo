// Hook for managing offline functionality

import { useState, useEffect, useCallback } from 'react';
import type { Flashcard, Lesson } from '../types/flashcard';
import {
  saveFlashcardsOffline,
  loadFlashcardsOffline,
  saveLessonsOffline,
  loadLessonsOffline,
  saveLastSynced,
  getOfflineStatus,
  isIndexedDBSupported,
  clearOfflineData,
} from '../lib/offline-storage';

export interface OfflineState {
  isOnline: boolean;
  isSupported: boolean;
  isSyncing: boolean;
  lastSynced: string | null;
  offlineCardCount: number;
  offlineLessonCount: number;
}

export function useOffline(cards: Flashcard[], lessons: Lesson[]) {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isSupported: isIndexedDBSupported(),
    isSyncing: false,
    lastSynced: null,
    offlineCardCount: 0,
    offlineLessonCount: 0,
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline status on mount
  useEffect(() => {
    if (!state.isSupported) return;

    getOfflineStatus().then(status => {
      setState(prev => ({
        ...prev,
        lastSynced: status.lastSynced,
        offlineCardCount: status.flashcardCount,
        offlineLessonCount: status.lessonCount,
      }));
    });
  }, [state.isSupported]);

  // Auto-sync when data changes (if online)
  useEffect(() => {
    if (!state.isSupported || !state.isOnline) return;
    if (cards.length === 0 && lessons.length === 0) return;

    // Debounce sync
    const timeout = setTimeout(() => {
      syncToOffline();
    }, 5000); // 5 second delay

    return () => clearTimeout(timeout);
  }, [cards, lessons, state.isSupported, state.isOnline]);

  // Sync data to offline storage
  const syncToOffline = useCallback(async () => {
    if (!state.isSupported) return;

    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      await Promise.all([
        saveFlashcardsOffline(cards),
        saveLessonsOffline(lessons),
      ]);
      await saveLastSynced();

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSynced: new Date().toISOString(),
        offlineCardCount: cards.length,
        offlineLessonCount: lessons.length,
      }));
    } catch (error) {
      console.error('Failed to sync offline:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [cards, lessons, state.isSupported]);

  // Load data from offline storage (when offline)
  const loadFromOffline = useCallback(async (): Promise<{
    cards: Flashcard[];
    lessons: Lesson[];
  } | null> => {
    if (!state.isSupported) return null;

    try {
      const [offlineCards, offlineLessons] = await Promise.all([
        loadFlashcardsOffline(),
        loadLessonsOffline(),
      ]);

      return {
        cards: offlineCards,
        lessons: offlineLessons,
      };
    } catch (error) {
      console.error('Failed to load offline data:', error);
      return null;
    }
  }, [state.isSupported]);

  // Clear offline data
  const clearOffline = useCallback(async () => {
    if (!state.isSupported) return;

    try {
      await clearOfflineData();
      setState(prev => ({
        ...prev,
        lastSynced: null,
        offlineCardCount: 0,
        offlineLessonCount: 0,
      }));
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, [state.isSupported]);

  // Format last synced time
  const getLastSyncedText = useCallback(() => {
    if (!state.lastSynced) return 'Chưa đồng bộ';

    const syncDate = new Date(state.lastSynced);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`;
    return syncDate.toLocaleDateString('vi-VN');
  }, [state.lastSynced]);

  return {
    ...state,
    syncToOffline,
    loadFromOffline,
    clearOffline,
    getLastSyncedText,
  };
}
