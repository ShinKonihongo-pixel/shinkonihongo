// Sub-hook: daily words UI state (notification, modal, justCompleted animation)

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { DailyWordsState } from '../types/daily-words';
import { getToday } from './use-daily-words-storage';

interface UseDailyWordsUIOptions {
  state: DailyWordsState;
  setState: React.Dispatch<React.SetStateAction<DailyWordsState>>;
  enabled: boolean;
}

export function useDailyWordsUI({ state, setState, enabled }: UseDailyWordsUIOptions) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const prevCompletedRef = useRef(false);

  // Reset justCompleted after animation
  useEffect(() => {
    if (justCompleted) {
      const timer = setTimeout(() => setJustCompleted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justCompleted]);

  // Detect completion for animation trigger
  useEffect(() => {
    const isNowCompleted = state.currentSession?.isCompleted || false;
    if (isNowCompleted && !prevCompletedRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJustCompleted(true);
    }
    prevCompletedRef.current = isNowCompleted;
  }, [state.currentSession?.isCompleted]);

  const showNotification = useMemo(() => {
    if (!enabled) return false;
    if (state.currentSession?.isCompleted) return false;
    const today = getToday();
    return state.notificationDismissedDate !== today;
  }, [enabled, state.currentSession?.isCompleted, state.notificationDismissedDate]);

  const dismissNotification = useCallback(() => {
    const today = getToday();
    setState(prev => ({ ...prev, notificationDismissedDate: today }));
  }, [setState]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return { justCompleted, isModalOpen, showNotification, dismissNotification, openModal, closeModal };
}
