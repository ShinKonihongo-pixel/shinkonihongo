// Hook for computing comprehensive analytics data from study/game/JLPT sessions

import { useMemo } from 'react';
import type { StudySession, GameSession, JLPTSession, UserStats } from '../types/user';
import type { Flashcard } from '../types/flashcard';
import type { GrammarCard } from '../types/flashcard';
import type { KanjiCard } from '../types/kanji';

export interface AnalyticsLevelProgress {
  level: string;
  mastered: number;
  total: number;
  percent: number;
}

export interface AnalyticsDailyActivity {
  date: string;   // YYYY-MM-DD
  vocab: number;  // cards studied
  grammar: number; // jlpt minutes (proxy for grammar)
  kanji: number;  // game minutes (proxy for kanji/game)
}

export interface AnalyticsSkillDistribution {
  name: string;
  percent: number;
  color: string;
}

export interface AnalyticsWeeklyTrend {
  week: string;        // e.g. "T1" "T2"
  studyMinutes: number;
  gameMinutes: number;
  jlptMinutes: number;
}

export interface AnalyticsXPPoint {
  date: string;
  xp: number;
  streak: number;
}

export interface AnalyticsMonthlyComparison {
  category: string;
  thisMonth: number;
  lastMonth: number;
}

export interface AnalyticsData {
  levelProgress: AnalyticsLevelProgress[];
  dailyActivity: AnalyticsDailyActivity[];
  skillDistribution: AnalyticsSkillDistribution[];
  weeklyTrends: AnalyticsWeeklyTrend[];
  xpProgression: AnalyticsXPPoint[];
  gameWinRate: number;
  studyCompletionRate: number;
  jlptAccuracy: number;
  monthlyComparison: AnalyticsMonthlyComparison[];
}

interface UseAnalyticsDataInput {
  studySessions: StudySession[];
  gameSessions: GameSession[];
  jlptSessions: JLPTSession[];
  userStats: UserStats;
  cards: Flashcard[];
  grammarCards: GrammarCard[];
  kanjiCards: KanjiCard[];
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function normalizeDate(dateStr: string): string {
  return dateStr.split('T')[0];
}

// Returns "YYYY-Www" for a date string
function getWeekKey(dateStr: string): string {
  const d = new Date(normalizeDate(dateStr));
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const weekNum = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

// Returns "YYYY-MM"
function getMonthKey(dateStr: string): string {
  return normalizeDate(dateStr).slice(0, 7);
}

export function useAnalyticsData({
  studySessions,
  gameSessions,
  jlptSessions,
  userStats,
  cards,
  grammarCards,
  kanjiCards,
}: UseAnalyticsDataInput): AnalyticsData {

  // 1. JLPT Level Progress — cards mastered per JLPT level
  const levelProgress = useMemo((): AnalyticsLevelProgress[] => {
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
    return levels.map(level => {
      const vocabCards = cards.filter(c => c.jlptLevel === level);
      const gramCards = grammarCards.filter(c => c.jlptLevel === level);
      const knCards = kanjiCards.filter(c => c.jlptLevel === level);
      const total = vocabCards.length + gramCards.length + knCards.length;
      const mastered =
        vocabCards.filter(c => c.memorizationStatus === 'memorized').length +
        gramCards.filter(c => c.memorizationStatus === 'memorized').length +
        knCards.filter(c => c.memorizationStatus === 'memorized').length;
      const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
      return { level, mastered, total, percent };
    });
  }, [cards, grammarCards, kanjiCards]);

  // 2. Daily Activity — 30 days bucketed by date
  const dailyActivity = useMemo((): AnalyticsDailyActivity[] => {
    const days = 30;
    const result: AnalyticsDailyActivity[] = [];

    // Build maps
    const studyMap = new Map<string, number>(); // date → cardsStudied
    for (const s of studySessions) {
      const d = normalizeDate(s.date);
      studyMap.set(d, (studyMap.get(d) ?? 0) + s.cardsStudied);
    }

    const jlptMap = new Map<string, number>(); // date → jlpt minutes
    for (const s of jlptSessions) {
      const d = normalizeDate(s.date);
      jlptMap.set(d, (jlptMap.get(d) ?? 0) + Math.round(s.duration / 60));
    }

    const gameMap = new Map<string, number>(); // date → game sessions count
    for (const s of gameSessions) {
      const d = normalizeDate(s.date);
      gameMap.set(d, (gameMap.get(d) ?? 0) + 1);
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = getDateNDaysAgo(i);
      result.push({
        date,
        vocab: studyMap.get(date) ?? 0,
        grammar: jlptMap.get(date) ?? 0,
        kanji: gameMap.get(date) ?? 0,
      });
    }

    return result;
  }, [studySessions, jlptSessions, gameSessions]);

  // 3. Skill Distribution — from memorization rates across card types
  const skillDistribution = useMemo((): AnalyticsSkillDistribution[] => {
    const vocabTotal = cards.length;
    const vocabMastered = cards.filter(c => c.memorizationStatus === 'memorized').length;
    const gramTotal = grammarCards.length;
    const gramMastered = grammarCards.filter(c => c.memorizationStatus === 'memorized').length;
    const kanjiTotal = kanjiCards.length;
    const kanjiMastered = kanjiCards.filter(c => c.memorizationStatus === 'memorized').length;
    const jlptTotal = userStats.totalJLPTQuestions;
    const jlptCorrect = userStats.totalJLPTCorrect;
    const gameTotal = userStats.totalGamesPlayed;
    const gameWins = userStats.totalGameWins;

    const safe = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;

    return [
      { name: 'Từ vựng', percent: safe(vocabMastered, vocabTotal), color: '#06b6d4' },
      { name: 'Ngữ pháp', percent: safe(gramMastered, gramTotal), color: '#8b5cf6' },
      { name: 'Hán tự', percent: safe(kanjiMastered, kanjiTotal), color: '#ec4899' },
      { name: 'JLPT', percent: safe(jlptCorrect, jlptTotal), color: '#14b8a6' },
      { name: 'Game', percent: safe(gameWins, gameTotal), color: '#f59e0b' },
    ];
  }, [cards, grammarCards, kanjiCards, userStats]);

  // 4. Weekly Trends — last 8 weeks
  const weeklyTrends = useMemo((): AnalyticsWeeklyTrend[] => {
    const weekStudy = new Map<string, number>();
    const weekGame = new Map<string, number>();
    const weekJlpt = new Map<string, number>();

    for (const s of studySessions) {
      const wk = getWeekKey(s.date);
      weekStudy.set(wk, (weekStudy.get(wk) ?? 0) + Math.round(s.duration / 60));
    }
    for (const s of gameSessions) {
      // No duration on GameSession, count as 10 min each
      const wk = getWeekKey(s.date);
      weekGame.set(wk, (weekGame.get(wk) ?? 0) + 10);
    }
    for (const s of jlptSessions) {
      const wk = getWeekKey(s.date);
      weekJlpt.set(wk, (weekJlpt.get(wk) ?? 0) + Math.round(s.duration / 60));
    }

    // Build sorted week keys from all sessions
    const allKeys = new Set([...weekStudy.keys(), ...weekGame.keys(), ...weekJlpt.keys()]);
    const sorted = Array.from(allKeys).sort().slice(-8);

    if (sorted.length === 0) {
      // Generate last 4 weeks as empty
      const res: AnalyticsWeeklyTrend[] = [];
      for (let i = 3; i >= 0; i--) {
        res.push({ week: `T${4 - i}`, studyMinutes: 0, gameMinutes: 0, jlptMinutes: 0 });
      }
      return res;
    }

    return sorted.map((wk, idx) => ({
      week: `T${idx + 1}`,
      studyMinutes: weekStudy.get(wk) ?? 0,
      gameMinutes: weekGame.get(wk) ?? 0,
      jlptMinutes: weekJlpt.get(wk) ?? 0,
    }));
  }, [studySessions, gameSessions, jlptSessions]);

  // 5. XP Progression — last 14 days
  const xpProgression = useMemo((): AnalyticsXPPoint[] => {
    const days = 14;
    const result: AnalyticsXPPoint[] = [];

    // XP formula: study session = 10xp, game = 5xp, gold = 30xp, silver = 20xp, bronze = 10xp, jlpt = 15xp
    const studyXpMap = new Map<string, number>();
    for (const s of studySessions) {
      const d = normalizeDate(s.date);
      studyXpMap.set(d, (studyXpMap.get(d) ?? 0) + 10);
    }

    const gameXpMap = new Map<string, number>();
    for (const s of gameSessions) {
      const d = normalizeDate(s.date);
      let xp = 5;
      if (s.rank === 1) xp += 30;
      else if (s.rank === 2) xp += 20;
      else if (s.rank === 3) xp += 10;
      gameXpMap.set(d, (gameXpMap.get(d) ?? 0) + xp);
    }

    const jlptXpMap = new Map<string, number>();
    for (const s of jlptSessions) {
      const d = normalizeDate(s.date);
      jlptXpMap.set(d, (jlptXpMap.get(d) ?? 0) + 15);
    }

    // Build cumulative XP and compute streak
    let runningXp = 0;
    let streak = 0;
    const today = getTodayISO();

    for (let i = days - 1; i >= 0; i--) {
      const date = getDateNDaysAgo(i);
      const dailyXp = (studyXpMap.get(date) ?? 0) + (gameXpMap.get(date) ?? 0) + (jlptXpMap.get(date) ?? 0);
      runningXp += dailyXp;

      // Simple streak calculation
      if (dailyXp > 0 || date === today) {
        if (dailyXp > 0) streak++;
        else streak = 0;
      } else {
        streak = 0;
      }

      result.push({ date, xp: runningXp, streak });
    }

    return result;
  }, [studySessions, gameSessions, jlptSessions]);

  // 6. Donut stats
  const gameWinRate = useMemo(() => {
    const t = userStats.totalGamesPlayed;
    return t > 0 ? Math.round((userStats.totalGameWins / t) * 100) : 0;
  }, [userStats]);

  const studyCompletionRate = useMemo(() => {
    const total = userStats.totalCardsStudied;
    if (total === 0) return 0;
    // Use correct rate from study sessions
    const totalCorrect = studySessions.reduce((sum, s) => sum + s.correctCount, 0);
    const totalCards = studySessions.reduce((sum, s) => sum + s.cardsStudied, 0);
    return totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0;
  }, [userStats, studySessions]);

  const jlptAccuracy = useMemo(() => {
    const t = userStats.totalJLPTQuestions;
    return t > 0 ? Math.round((userStats.totalJLPTCorrect / t) * 100) : 0;
  }, [userStats]);

  // 7. Monthly Comparison — this month vs last month
  const monthlyComparison = useMemo((): AnalyticsMonthlyComparison[] => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    const studyThis = studySessions.filter(s => getMonthKey(s.date) === thisMonth);
    const studyLast = studySessions.filter(s => getMonthKey(s.date) === lastMonth);
    const gameThis = gameSessions.filter(s => getMonthKey(s.date) === thisMonth);
    const gameLast = gameSessions.filter(s => getMonthKey(s.date) === lastMonth);
    const jlptThis = jlptSessions.filter(s => getMonthKey(s.date) === thisMonth);
    const jlptLast = jlptSessions.filter(s => getMonthKey(s.date) === lastMonth);

    return [
      {
        category: 'Học tập',
        thisMonth: studyThis.length,
        lastMonth: studyLast.length,
      },
      {
        category: 'Game',
        thisMonth: gameThis.length,
        lastMonth: gameLast.length,
      },
      {
        category: 'JLPT',
        thisMonth: jlptThis.length,
        lastMonth: jlptLast.length,
      },
      {
        category: 'Thẻ học',
        thisMonth: studyThis.reduce((s, x) => s + x.cardsStudied, 0),
        lastMonth: studyLast.reduce((s, x) => s + x.cardsStudied, 0),
      },
    ];
  }, [studySessions, gameSessions, jlptSessions]);

  return {
    levelProgress,
    dailyActivity,
    skillDistribution,
    weeklyTrends,
    xpProgression,
    gameWinRate,
    studyCompletionRate,
    jlptAccuracy,
    monthlyComparison,
  };
}
