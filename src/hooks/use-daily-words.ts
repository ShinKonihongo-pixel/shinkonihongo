// Hook for managing daily words learning
// Persists progress to localStorage, selects random words each day

import { useMemo } from 'react';
import type { Flashcard } from '../types/flashcard';
import { useDailyWordsStorage } from './use-daily-words-storage';
import { useDailyWordsSession } from './use-daily-words-session';
import { useDailyWordsUI } from './use-daily-words-ui';

interface UseDailyWordsOptions {
  allCards: Flashcard[];
  targetCount: 5 | 10 | 15 | 20;
  enabled: boolean;
  userJlptLevel?: string;
}

interface DailyWordsReturn {
  todayWords: Flashcard[];
  progress: { completed: number; target: number; percent: number };
  isCompleted: boolean;
  streak: number;
  longestStreak: number;
  markWordLearned: (wordId: string) => void;
  markAllLearned: () => void;
  refreshWords: () => void;
  isInitialized: boolean;
  enabled: boolean;
  justCompleted: boolean;
  completedWordIds: Set<string>;
  showNotification: boolean;
  dismissNotification: () => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export function useDailyWords({ allCards, targetCount, enabled, userJlptLevel }: UseDailyWordsOptions): DailyWordsReturn {
  const { state, setState, isInitialized } = useDailyWordsStorage({
    allCards, targetCount, enabled, userJlptLevel,
  });

  const { markWordLearned, markAllLearned, refreshWords } = useDailyWordsSession({
    state, setState, allCards, targetCount, enabled, userJlptLevel,
  });

  const { justCompleted, isModalOpen, showNotification, dismissNotification, openModal, closeModal } =
    useDailyWordsUI({ state, setState, enabled });

  const completedWordIds = useMemo(() => {
    return new Set(state.currentSession?.learnedWordIds || []);
  }, [state.currentSession?.learnedWordIds]);

  const progress = useMemo(() => {
    if (!state.currentSession) return { completed: 0, target: targetCount, percent: 0 };
    const { completedWords, targetWords } = state.currentSession;
    return {
      completed: completedWords,
      target: targetWords,
      percent: Math.round((completedWords / targetWords) * 100),
    };
  }, [state.currentSession, targetCount]);

  return {
    todayWords: state.todayWords,
    progress,
    isCompleted: state.currentSession?.isCompleted || false,
    streak: state.streak,
    longestStreak: state.longestStreak,
    markWordLearned,
    markAllLearned,
    refreshWords,
    isInitialized,
    enabled,
    justCompleted,
    completedWordIds,
    showNotification,
    dismissNotification,
    isModalOpen,
    openModal,
    closeModal,
  };
}
