// Hook for managing daily words learning
// Persists progress to localStorage, selects random words each day

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Flashcard } from '../types/flashcard';
import type { DailyWordsSession, DailyWordsState } from '../types/daily-words';

const STORAGE_KEY = 'daily-words-data';
const MAX_HISTORY = 30;
const DAY_MS = 86400000;

// Date utilities
const getToday = (): string => new Date().toISOString().split('T')[0];
const getYesterday = (): string => new Date(Date.now() - DAY_MS).toISOString().split('T')[0];

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Calculate streak from history
function calculateStreak(history: DailyWordsSession[]): { current: number; longest: number } {
  const completed = history.filter(s => s.isCompleted);
  if (completed.length === 0) return { current: 0, longest: 0 };

  const sorted = [...completed].sort((a, b) => b.date.localeCompare(a.date));
  const today = getToday();
  const yesterday = getYesterday();

  // Calculate current streak
  let currentStreak = 0;
  const lastCompleted = sorted[0]?.date;

  if (lastCompleted === today || lastCompleted === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const dayDiff = (new Date(sorted[i - 1].date).getTime() - new Date(sorted[i].date).getTime()) / DAY_MS;
      if (dayDiff === 1) currentStreak++;
      else break;
    }
  }

  // Calculate longest streak
  let longestStreak = currentStreak;
  let tempStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const dayDiff = (new Date(sorted[i - 1].date).getTime() - new Date(sorted[i].date).getTime()) / DAY_MS;
    if (dayDiff === 1) tempStreak++;
    else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

// Update streak when completing
function updateStreak(history: DailyWordsSession[], currentStreak: number): { streak: number; isNewRecord: boolean } {
  const today = getToday();
  const yesterday = getYesterday();
  const lastCompleted = history
    .filter(s => s.isCompleted)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  let newStreak = currentStreak;
  if (!lastCompleted || lastCompleted.date === yesterday) {
    newStreak = currentStreak + 1;
  } else if (lastCompleted.date !== today) {
    newStreak = 1;
  }

  return { streak: newStreak, isNewRecord: newStreak > currentStreak };
}

interface UseDailyWordsOptions {
  allCards: Flashcard[];
  targetCount: 5 | 10 | 15 | 20;
  enabled: boolean;
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
  showNotification: boolean; // Whether to show notification badge
  dismissNotification: () => void; // Dismiss notification for today
}

export function useDailyWords({ allCards, targetCount, enabled }: UseDailyWordsOptions): DailyWordsReturn {
  const [state, setState] = useState<DailyWordsState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: add learnedWordIds if missing
        if (parsed.currentSession && !parsed.currentSession.learnedWordIds) {
          parsed.currentSession.learnedWordIds = [];
        }
        // Ensure todayWords array exists
        return {
          ...parsed,
          todayWords: parsed.todayWords || [],
        };
      }
    } catch { /* ignore */ }
    return {
      currentSession: null,
      todayWords: [],
      history: [],
      streak: 0,
      longestStreak: 0,
      notificationDismissedDate: undefined,
    };
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevCompletedRef = useRef(false);

  // Derived completedWordIds from session (persisted)
  const completedWordIds = useMemo(() => {
    return new Set(state.currentSession?.learnedWordIds || []);
  }, [state.currentSession?.learnedWordIds]);

  // Reset justCompleted after animation
  useEffect(() => {
    if (justCompleted) {
      const timer = setTimeout(() => setJustCompleted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justCompleted]);

  // Persist to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const toSave = {
        currentSession: state.currentSession,
        history: state.history.slice(-MAX_HISTORY),
        streak: state.streak,
        longestStreak: state.longestStreak,
        notificationDismissedDate: state.notificationDismissedDate,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* ignore */ }
  }, [state, isInitialized]);

  // Initialize daily words
  useEffect(() => {
    if (!enabled || allCards.length === 0) {
      setIsInitialized(true);
      return;
    }

    const today = getToday();
    const { currentSession } = state;

    if (!currentSession || currentSession.date !== today) {
      // Archive previous session
      let newHistory = [...state.history];
      if (currentSession && currentSession.date !== today) {
        newHistory = [...newHistory, currentSession].slice(-MAX_HISTORY);
      }

      // Check for existing today session in history
      const existingToday = newHistory.find(s => s.date === today);

      if (existingToday) {
        const streaks = calculateStreak(newHistory);
        const todayWords = allCards.filter(c => existingToday.wordIds.includes(c.id));
        setState(prev => ({
          ...prev,
          currentSession: existingToday,
          todayWords,
          history: newHistory.filter(s => s.date !== today),
          streak: streaks.current,
          longestStreak: Math.max(prev.longestStreak, streaks.longest),
        }));
      } else {
        // Select new random words - prioritize non-memorized
        const notMemorized = allCards.filter(c => c.memorizationStatus !== 'memorized');
        const pool = notMemorized.length >= targetCount ? notMemorized : allCards;
        const selectedWords = shuffleArray(pool).slice(0, targetCount);

        const newSession: DailyWordsSession = {
          date: today,
          targetWords: targetCount,
          completedWords: 0,
          wordIds: selectedWords.map(w => w.id),
          learnedWordIds: [], // Track which specific words are learned
          isCompleted: false,
        };

        const streaks = calculateStreak(newHistory);
        setState(prev => ({
          ...prev,
          currentSession: newSession,
          todayWords: selectedWords,
          history: newHistory,
          streak: streaks.current,
          longestStreak: Math.max(prev.longestStreak, streaks.longest),
        }));
      }
    } else {
      // Same day - sync todayWords with cards
      const todayWords = allCards.filter(c => currentSession.wordIds.includes(c.id));
      if (todayWords.length !== (state.todayWords?.length || 0)) {
        setState(prev => ({ ...prev, todayWords }));
      }
    }

    setIsInitialized(true);
  }, [allCards, enabled, targetCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark single word as learned
  const markWordLearned = useCallback((wordId: string) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      if (!prev.currentSession.wordIds.includes(wordId)) return prev;
      if (prev.currentSession.isCompleted) return prev;
      // Check if already learned - prevent duplicate
      if (prev.currentSession.learnedWordIds.includes(wordId)) return prev;

      const newLearnedWordIds = [...prev.currentSession.learnedWordIds, wordId];
      const newCompletedWords = newLearnedWordIds.length;
      const isCompleted = newCompletedWords >= prev.currentSession.targetWords;

      const updatedSession: DailyWordsSession = {
        ...prev.currentSession,
        completedWords: newCompletedWords,
        learnedWordIds: newLearnedWordIds,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };

      let newStreak = prev.streak;
      let newLongestStreak = prev.longestStreak;

      if (isCompleted && !prev.currentSession.isCompleted) {
        const result = updateStreak(prev.history, prev.streak);
        newStreak = result.streak;
        newLongestStreak = Math.max(newLongestStreak, newStreak);
      }

      return {
        ...prev,
        currentSession: updatedSession,
        streak: newStreak,
        longestStreak: newLongestStreak,
      };
    });
  }, []);

  // Mark all words as learned
  const markAllLearned = useCallback(() => {
    setState(prev => {
      if (!prev.currentSession || prev.currentSession.isCompleted) return prev;

      const allWordIds = prev.currentSession.wordIds;
      const updatedSession: DailyWordsSession = {
        ...prev.currentSession,
        completedWords: prev.currentSession.targetWords,
        learnedWordIds: allWordIds, // Mark all as learned
        isCompleted: true,
        completedAt: new Date().toISOString(),
      };

      const result = updateStreak(prev.history, prev.streak);
      const newLongestStreak = Math.max(prev.longestStreak, result.streak);

      return {
        ...prev,
        currentSession: updatedSession,
        streak: result.streak,
        longestStreak: newLongestStreak,
      };
    });
  }, []);

  // Refresh with new random words
  const refreshWords = useCallback(() => {
    if (!enabled || allCards.length === 0) return;

    const notMemorized = allCards.filter(c => c.memorizationStatus !== 'memorized');
    const pool = notMemorized.length >= targetCount ? notMemorized : allCards;
    const selectedWords = shuffleArray(pool).slice(0, targetCount);

    const newSession: DailyWordsSession = {
      date: getToday(),
      targetWords: targetCount,
      completedWords: 0,
      wordIds: selectedWords.map(w => w.id),
      learnedWordIds: [], // Reset learned words
      isCompleted: false,
    };

    setState(prev => ({
      ...prev,
      currentSession: newSession,
      todayWords: selectedWords,
    }));
  }, [allCards, targetCount, enabled]);

  // Detect completion for animation trigger
  useEffect(() => {
    const isNowCompleted = state.currentSession?.isCompleted || false;
    if (isNowCompleted && !prevCompletedRef.current) {
      setJustCompleted(true);
    }
    prevCompletedRef.current = isNowCompleted;
  }, [state.currentSession?.isCompleted]);

  // Computed progress
  const progress = useMemo(() => {
    if (!state.currentSession) return { completed: 0, target: targetCount, percent: 0 };
    const { completedWords, targetWords } = state.currentSession;
    return {
      completed: completedWords,
      target: targetWords,
      percent: Math.round((completedWords / targetWords) * 100),
    };
  }, [state.currentSession, targetCount]);

  // Check if notification was dismissed today
  const showNotification = useMemo(() => {
    if (!enabled) return false;
    if (state.currentSession?.isCompleted) return false;
    const today = getToday();
    // Show notification if not dismissed today
    return state.notificationDismissedDate !== today;
  }, [enabled, state.currentSession?.isCompleted, state.notificationDismissedDate]);

  // Dismiss notification for today
  const dismissNotification = useCallback(() => {
    const today = getToday();
    setState(prev => ({
      ...prev,
      notificationDismissedDate: today,
    }));
  }, []);

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
  };
}
