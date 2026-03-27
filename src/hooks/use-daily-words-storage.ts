// Sub-hook: daily words localStorage persistence and initialization

import { useState, useEffect } from 'react';
import type { Flashcard } from '../types/flashcard';
import type { DailyWordsSession, DailyWordsState } from '../types/daily-words';
import { shuffleArray } from '../lib/game-utils';

export const DAILY_WORDS_STORAGE_KEY = 'daily-words-data';
const MAX_HISTORY = 30;
const DAY_MS = 86400000;

export const getToday = (): string => new Date().toISOString().split('T')[0];
export const getYesterday = (): string => new Date(Date.now() - DAY_MS).toISOString().split('T')[0];

// Calculate streak from history
export function calculateStreak(history: DailyWordsSession[]): { current: number; longest: number } {
  const completed = history.filter(s => s.isCompleted);
  if (completed.length === 0) return { current: 0, longest: 0 };

  const sorted = [...completed].sort((a, b) => b.date.localeCompare(a.date));
  const today = getToday();
  const yesterday = getYesterday();

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
export function updateStreak(history: DailyWordsSession[], currentStreak: number): { streak: number; isNewRecord: boolean } {
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

// Select words from card pool based on JLPT level filter
export function selectWords(
  allCards: Flashcard[],
  targetCount: number,
  userJlptLevel?: string
): Flashcard[] {
  const levelFilteredCards = userJlptLevel
    ? allCards.filter(c => c.jlptLevel === userJlptLevel)
    : allCards;
  const basePool = levelFilteredCards.length >= targetCount ? levelFilteredCards : allCards;
  const notMemorized = basePool.filter(c => c.memorizationStatus !== 'memorized');
  const pool = notMemorized.length >= targetCount ? notMemorized : basePool;
  return shuffleArray(pool).slice(0, targetCount);
}

interface UseDailyWordsStorageOptions {
  allCards: Flashcard[];
  targetCount: 5 | 10 | 15 | 20;
  enabled: boolean;
  userJlptLevel?: string;
}

export function useDailyWordsStorage({
  allCards,
  targetCount,
  enabled,
  userJlptLevel,
}: UseDailyWordsStorageOptions) {
  const [state, setState] = useState<DailyWordsState>(() => {
    try {
      const stored = localStorage.getItem(DAILY_WORDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.currentSession && !parsed.currentSession.learnedWordIds) {
          parsed.currentSession.learnedWordIds = [];
        }
        return { ...parsed, todayWords: parsed.todayWords || [] };
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
      localStorage.setItem(DAILY_WORDS_STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* ignore */ }
  }, [state, isInitialized]);

  // Initialize daily words
  useEffect(() => {
    if (!enabled || allCards.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInitialized(true);
      return;
    }

    const today = getToday();
    const { currentSession } = state;

    if (!currentSession || currentSession.date !== today) {
      let newHistory = [...state.history];
      if (currentSession && currentSession.date !== today) {
        newHistory = [...newHistory, currentSession].slice(-MAX_HISTORY);
      }

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
        const selectedWords = selectWords(allCards, targetCount, userJlptLevel);
        const newSession: DailyWordsSession = {
          date: today,
          targetWords: targetCount,
          completedWords: 0,
          wordIds: selectedWords.map(w => w.id),
          learnedWordIds: [],
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
      const todayWords = allCards.filter(c => currentSession.wordIds.includes(c.id));
      if (todayWords.length !== (state.todayWords?.length || 0)) {
        setState(prev => ({ ...prev, todayWords }));
      }
    }

    setIsInitialized(true);
  }, [allCards, enabled, targetCount, userJlptLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, setState, isInitialized };
}
