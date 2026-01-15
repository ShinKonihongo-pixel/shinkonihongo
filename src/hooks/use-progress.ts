// Hook for calculating user progress and statistics

import { useMemo } from 'react';
import type { StudySession, GameSession, JLPTSession, UserStats } from '../types/user';
import type { Flashcard, JLPTLevel } from '../types/flashcard';
import type { DailyActivity, StreakInfo, LevelProgress, WeeklyGoal, ProgressSummary } from '../types/progress';
import { calculateUserLevel } from '../types/user';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}

// Normalize date to YYYY-MM-DD format (handles both ISO timestamps and date strings)
function normalizeDate(dateStr: string): string {
  return dateStr.split('T')[0];
}

function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  const normalizedDate = normalizeDate(date);
  return normalizedDate >= startDate && normalizedDate <= endDate;
}

// Calculate daily activity for the last N days
function calculateDailyActivity(
  studySessions: StudySession[],
  gameSessions: GameSession[],
  jlptSessions: JLPTSession[],
  days: number
): DailyActivity[] {
  const today = getTodayISO();
  const startDate = getDateNDaysAgo(days - 1);

  const activityMap = new Map<string, DailyActivity>();

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = getDateNDaysAgo(days - 1 - i);
    activityMap.set(date, {
      date,
      cardsStudied: 0,
      minutesStudied: 0,
      jlptPracticed: 0,
      gamesPlayed: 0,
    });
  }

  // Aggregate study sessions
  studySessions.forEach(session => {
    if (isDateInRange(session.date, startDate, today)) {
      const sessionDate = normalizeDate(session.date);
      const activity = activityMap.get(sessionDate);
      if (activity) {
        activity.cardsStudied += session.cardsStudied;
        activity.minutesStudied += Math.round(session.duration / 60);
      }
    }
  });

  // Aggregate game sessions
  gameSessions.forEach(session => {
    if (isDateInRange(session.date, startDate, today)) {
      const sessionDate = normalizeDate(session.date);
      const activity = activityMap.get(sessionDate);
      if (activity) {
        activity.gamesPlayed += 1;
      }
    }
  });

  // Aggregate JLPT sessions
  jlptSessions.forEach(session => {
    if (isDateInRange(session.date, startDate, today)) {
      const sessionDate = normalizeDate(session.date);
      const activity = activityMap.get(sessionDate);
      if (activity) {
        activity.jlptPracticed += session.totalQuestions;
      }
    }
  });

  return Array.from(activityMap.values());
}

// Calculate streak info
function calculateStreak(
  studySessions: StudySession[],
  gameSessions: GameSession[],
  jlptSessions: JLPTSession[]
): StreakInfo {
  const today = getTodayISO();

  // Get all unique dates with activity (normalized to YYYY-MM-DD)
  const activeDates = new Set<string>();
  studySessions.forEach(s => activeDates.add(normalizeDate(s.date)));
  gameSessions.forEach(s => activeDates.add(normalizeDate(s.date)));
  jlptSessions.forEach(s => activeDates.add(normalizeDate(s.date)));

  const sortedDates = Array.from(activeDates).sort((a, b) => b.localeCompare(a)); // descending

  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: '', isActiveToday: false };
  }

  const isActiveToday = sortedDates[0] === today;
  const lastActiveDate = sortedDates[0];

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = isActiveToday ? today : getDateNDaysAgo(1);

  // If not active today, check if yesterday was active to continue streak
  if (!isActiveToday && sortedDates[0] !== getDateNDaysAgo(1)) {
    currentStreak = 0;
  } else {
    for (let i = 0; i < 365; i++) {
      if (activeDates.has(checkDate)) {
        currentStreak++;
        checkDate = getDateNDaysAgo(isActiveToday ? i + 1 : i + 2);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort ascending for longest streak calculation
  const ascDates = Array.from(activeDates).sort();

  for (let i = 0; i < ascDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(ascDates[i - 1]);
      const currDate = new Date(ascDates[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak, lastActiveDate, isActiveToday };
}

// Calculate progress by JLPT level
function calculateLevelProgress(cards: Flashcard[]): LevelProgress[] {
  const today = getTodayISO();

  return JLPT_LEVELS.map(level => {
    const levelCards = cards.filter(c => c.jlptLevel === level);
    const totalCards = levelCards.length;

    if (totalCards === 0) {
      return {
        level,
        totalCards: 0,
        memorized: 0,
        learning: 0,
        dueForReview: 0,
        masteryPercent: 0,
      };
    }

    const memorized = levelCards.filter(c => c.memorizationStatus === 'memorized').length;
    const learning = levelCards.filter(c =>
      c.memorizationStatus !== 'memorized' && c.repetitions > 0
    ).length;
    const dueForReview = levelCards.filter(c => c.nextReviewDate <= today).length;
    const masteryPercent = Math.round((memorized / totalCards) * 100);

    return { level, totalCards, memorized, learning, dueForReview, masteryPercent };
  });
}

// Calculate weekly goal progress
function calculateWeeklyGoal(
  studySessions: StudySession[],
  targetCards: number = 50,
  targetMinutes: number = 60
): WeeklyGoal {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const mondayISO = monday.toISOString().split('T')[0];

  const weekSessions = studySessions.filter(s => normalizeDate(s.date) >= mondayISO);
  const cardsCompleted = weekSessions.reduce((sum, s) => sum + s.cardsStudied, 0);
  const minutesCompleted = Math.round(weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60);

  return {
    cardsTarget: targetCards,
    cardsCompleted,
    minutesTarget: targetMinutes,
    minutesCompleted,
  };
}

export function useProgress(
  studySessions: StudySession[],
  gameSessions: GameSession[],
  jlptSessions: JLPTSession[],
  stats: UserStats,
  cards: Flashcard[],
  weeklyCardsTarget: number = 50,
  weeklyMinutesTarget: number = 60
): ProgressSummary {
  return useMemo(() => {
    const today = getTodayISO();
    const dailyActivity = calculateDailyActivity(studySessions, gameSessions, jlptSessions, 14);
    const streak = calculateStreak(studySessions, gameSessions, jlptSessions);
    const levelProgress = calculateLevelProgress(cards);
    const weeklyGoal = calculateWeeklyGoal(studySessions, weeklyCardsTarget, weeklyMinutesTarget);
    const cardsDueToday = cards.filter(c => c.nextReviewDate <= today).length;

    const userLevel = calculateUserLevel(stats);

    return {
      dailyActivity,
      streak,
      levelProgress,
      weeklyGoal,
      cardsDueToday,
      totalXP: userLevel.xp,
      currentLevel: userLevel.level,
      levelTitle: userLevel.title,
    };
  }, [studySessions, gameSessions, jlptSessions, stats, cards, weeklyCardsTarget, weeklyMinutesTarget]);
}
