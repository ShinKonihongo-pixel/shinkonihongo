// Hook for managing Kaiwa session history and statistics
// Persists data to localStorage with achievements tracking

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  KaiwaSession,
  KaiwaDailyRecord,
  KaiwaStats,
  KaiwaAchievement,
} from '../types/kaiwa-session';
import { KAIWA_ACHIEVEMENTS, DEFAULT_KAIWA_STATS } from '../types/kaiwa-session';
import type { JLPTLevel, ConversationTopic, KaiwaMessage, KaiwaEvaluation } from '../types/kaiwa';

const STORAGE_KEY_SESSIONS = 'kaiwa-sessions';
const STORAGE_KEY_STATS = 'kaiwa-stats';
const STORAGE_KEY_DAILY = 'kaiwa-daily-records';
const MAX_SESSIONS_STORED = 100;

// Generate unique ID
const generateId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Get today's date string
const getToday = () => new Date().toISOString().split('T')[0];

// Calculate streak from daily records
function calculateStreak(dailyRecords: KaiwaDailyRecord[]): { current: number; longest: number } {
  if (dailyRecords.length === 0) return { current: 0, longest: 0 };

  // Sort by date descending
  const sorted = [...dailyRecords].sort((a, b) => b.date.localeCompare(a.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = getToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check if practiced today or yesterday for current streak
  const startDate = sorted[0]?.date;
  if (startDate === today || startDate === yesterday) {
    currentStreak = 1;

    // Count consecutive days backwards
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].date);
      const currDate = new Date(sorted[i].date);
      const dayDiff = (prevDate.getTime() - currDate.getTime()) / 86400000;

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date);
    const currDate = new Date(sorted[i].date);
    const dayDiff = (prevDate.getTime() - currDate.getTime()) / 86400000;

    if (dayDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { current: currentStreak, longest: longestStreak };
}

// Check and unlock achievements
function checkAchievements(
  stats: KaiwaStats,
  sessions: KaiwaSession[],
  _dailyRecords: KaiwaDailyRecord[]
): KaiwaAchievement[] {
  const newAchievements: KaiwaAchievement[] = [];
  const existingIds = new Set(stats.achievements.map(a => a.id));
  const now = new Date().toISOString();

  for (const achievement of KAIWA_ACHIEVEMENTS) {
    if (existingIds.has(achievement.id)) continue;

    let unlocked = false;
    let progress = 0;

    switch (achievement.id) {
      // Session milestones
      case 'first_session':
        unlocked = stats.totalSessions >= 1;
        progress = Math.min(100, (stats.totalSessions / 1) * 100);
        break;
      case 'sessions_10':
        unlocked = stats.totalSessions >= 10;
        progress = Math.min(100, (stats.totalSessions / 10) * 100);
        break;
      case 'sessions_50':
        unlocked = stats.totalSessions >= 50;
        progress = Math.min(100, (stats.totalSessions / 50) * 100);
        break;
      case 'sessions_100':
        unlocked = stats.totalSessions >= 100;
        progress = Math.min(100, (stats.totalSessions / 100) * 100);
        break;

      // Streak achievements
      case 'streak_3':
        unlocked = stats.currentStreak >= 3 || stats.longestStreak >= 3;
        progress = Math.min(100, (Math.max(stats.currentStreak, stats.longestStreak) / 3) * 100);
        break;
      case 'streak_7':
        unlocked = stats.currentStreak >= 7 || stats.longestStreak >= 7;
        progress = Math.min(100, (Math.max(stats.currentStreak, stats.longestStreak) / 7) * 100);
        break;
      case 'streak_30':
        unlocked = stats.currentStreak >= 30 || stats.longestStreak >= 30;
        progress = Math.min(100, (Math.max(stats.currentStreak, stats.longestStreak) / 30) * 100);
        break;

      // Score achievements
      case 'perfect_10':
        unlocked = sessions.some(s => s.evaluation?.overallScore === 10);
        break;
      case 'consistent_8': {
        const recentSessions = sessions.slice(-5);
        const allAbove8 = recentSessions.length >= 5 &&
          recentSessions.every(s => s.evaluation && s.evaluation.overallScore >= 8);
        unlocked = allAbove8;
        const count = recentSessions.filter(s => s.evaluation && s.evaluation.overallScore >= 8).length;
        progress = Math.min(100, (count / 5) * 100);
        break;
      }

      // Level achievements
      case 'all_levels': {
        const levelsWithSessions = Object.entries(stats.levelProgress)
          .filter(([, v]) => v.sessions > 0).length;
        unlocked = levelsWithSessions === 5;
        progress = (levelsWithSessions / 5) * 100;
        break;
      }
      case 'n1_master': {
        const n1Avg = stats.levelProgress.N1.avgScore;
        unlocked = stats.levelProgress.N1.sessions >= 3 && n1Avg >= 8;
        progress = Math.min(100, (n1Avg / 8) * 100);
        break;
      }

      // Topic achievements
      case 'all_topics': {
        const topicsWithSessions = Object.entries(stats.topicProgress)
          .filter(([, v]) => v.sessions > 0).length;
        unlocked = topicsWithSessions === 10;
        progress = (topicsWithSessions / 10) * 100;
        break;
      }

      // Pronunciation achievements
      case 'pronunciation_90':
        unlocked = stats.pronunciationStats.bestAccuracy >= 90;
        progress = Math.min(100, (stats.pronunciationStats.bestAccuracy / 90) * 100);
        break;

      // Time achievements
      case 'hour_total':
        unlocked = stats.totalMinutes >= 60;
        progress = Math.min(100, (stats.totalMinutes / 60) * 100);
        break;
      case 'hours_10':
        unlocked = stats.totalMinutes >= 600;
        progress = Math.min(100, (stats.totalMinutes / 600) * 100);
        break;
    }

    newAchievements.push({
      ...achievement,
      unlockedAt: unlocked ? now : undefined,
      progress,
    });
  }

  return newAchievements;
}

export function useKaiwaSessionHistory() {
  const [sessions, setSessions] = useState<KaiwaSession[]>([]);
  const [stats, setStats] = useState<KaiwaStats>(DEFAULT_KAIWA_STATS);
  const [dailyRecords, setDailyRecords] = useState<KaiwaDailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<KaiwaAchievement | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const savedStats = localStorage.getItem(STORAGE_KEY_STATS);
      const savedDaily = localStorage.getItem(STORAGE_KEY_DAILY);

      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
      if (savedStats) {
        setStats({ ...DEFAULT_KAIWA_STATS, ...JSON.parse(savedStats) });
      }
      if (savedDaily) {
        setDailyRecords(JSON.parse(savedDaily));
      }
    } catch (error) {
      console.error('Failed to load kaiwa session history:', error);
    }
    setLoading(false);
  }, []);

  // Save sessions to localStorage
  const saveSessions = useCallback((newSessions: KaiwaSession[]) => {
    // Keep only most recent sessions
    const trimmed = newSessions.slice(-MAX_SESSIONS_STORED);
    setSessions(trimmed);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(trimmed));
  }, []);

  // Save stats to localStorage
  const saveStats = useCallback((newStats: KaiwaStats) => {
    setStats(newStats);
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(newStats));
  }, []);

  // Save daily records to localStorage
  const saveDailyRecords = useCallback((newRecords: KaiwaDailyRecord[]) => {
    // Keep only last 365 days
    const trimmed = newRecords.slice(-365);
    setDailyRecords(trimmed);
    localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(trimmed));
  }, []);

  // Record a completed session
  const recordSession = useCallback((params: {
    startTime: Date;
    endTime: Date;
    level: JLPTLevel;
    style: string;
    topic: ConversationTopic;
    topicName?: string;
    messages: KaiwaMessage[];
    evaluation?: KaiwaEvaluation;
    savedSentences: string[];
    pronunciationAttempts: number;
    avgPronunciationAccuracy: number;
    wordsUsed: Set<string>;
  }) => {
    const durationMinutes = Math.floor((params.endTime.getTime() - params.startTime.getTime()) / 60000);
    const userMessageCount = params.messages.filter(m => m.role === 'user').length;

    const newSession: KaiwaSession = {
      id: generateId(),
      startTime: params.startTime.toISOString(),
      endTime: params.endTime.toISOString(),
      durationMinutes,
      level: params.level,
      style: params.style as any,
      topic: params.topic,
      topicName: params.topicName,
      messageCount: params.messages.length,
      userMessageCount,
      evaluation: params.evaluation,
      savedSentences: params.savedSentences,
      pronunciationAttempts: params.pronunciationAttempts,
      avgPronunciationAccuracy: params.avgPronunciationAccuracy,
      wordsUsedCount: params.wordsUsed.size,
    };

    const newSessions = [...sessions, newSession];
    saveSessions(newSessions);

    // Update daily record
    const today = getToday();
    const existingDaily = dailyRecords.find(d => d.date === today);
    const score = params.evaluation?.overallScore || 0;

    let newDailyRecords: KaiwaDailyRecord[];
    if (existingDaily) {
      const newAvg = existingDaily.sessionsCount > 0
        ? ((existingDaily.avgScore * existingDaily.sessionsCount) + score) / (existingDaily.sessionsCount + 1)
        : score;
      newDailyRecords = dailyRecords.map(d =>
        d.date === today
          ? {
              ...d,
              sessionsCount: d.sessionsCount + 1,
              totalMinutes: d.totalMinutes + durationMinutes,
              avgScore: newAvg,
              levels: [...new Set([...d.levels, params.level])],
            }
          : d
      );
    } else {
      newDailyRecords = [...dailyRecords, {
        date: today,
        sessionsCount: 1,
        totalMinutes: durationMinutes,
        avgScore: score,
        levels: [params.level],
      }];
    }
    saveDailyRecords(newDailyRecords);

    // Update stats
    const { current: currentStreak, longest: longestStreak } = calculateStreak(newDailyRecords);

    const sessionsWithEval = newSessions.filter(s => s.evaluation);
    const avgScore = sessionsWithEval.length > 0
      ? sessionsWithEval.reduce((sum, s) => sum + (s.evaluation?.overallScore || 0), 0) / sessionsWithEval.length
      : 0;

    const levelProgress = { ...stats.levelProgress };
    const levelData = levelProgress[params.level];
    const levelAvg = levelData.sessions > 0
      ? ((levelData.avgScore * levelData.sessions) + score) / (levelData.sessions + 1)
      : score;
    levelProgress[params.level] = {
      sessions: levelData.sessions + 1,
      avgScore: levelAvg,
      lastPracticed: today,
    };

    const topicProgress = { ...stats.topicProgress };
    const topicData = topicProgress[params.topic];
    const topicAvg = topicData.sessions > 0
      ? ((topicData.avgScore * topicData.sessions) + score) / (topicData.sessions + 1)
      : score;
    topicProgress[params.topic] = {
      sessions: topicData.sessions + 1,
      avgScore: topicAvg,
    };

    const totalPronAttempts = stats.pronunciationStats.totalAttempts + params.pronunciationAttempts;
    const pronAvg = totalPronAttempts > 0
      ? ((stats.pronunciationStats.avgAccuracy * stats.pronunciationStats.totalAttempts) +
         (params.avgPronunciationAccuracy * params.pronunciationAttempts)) / totalPronAttempts
      : 0;

    const updatedStats: KaiwaStats = {
      totalSessions: stats.totalSessions + 1,
      totalMinutes: stats.totalMinutes + durationMinutes,
      totalExchanges: stats.totalExchanges + userMessageCount,
      avgScore,
      currentStreak,
      longestStreak,
      levelProgress,
      topicProgress,
      pronunciationStats: {
        totalAttempts: totalPronAttempts,
        avgAccuracy: pronAvg,
        bestAccuracy: Math.max(stats.pronunciationStats.bestAccuracy, params.avgPronunciationAccuracy),
      },
      achievements: stats.achievements,
    };

    // Check for new achievements
    const checkedAchievements = checkAchievements(updatedStats, newSessions, newDailyRecords);
    const previouslyUnlocked = new Set(stats.achievements.filter(a => a.unlockedAt).map(a => a.id));
    const newlyUnlocked = checkedAchievements.find(a => a.unlockedAt && !previouslyUnlocked.has(a.id));

    if (newlyUnlocked) {
      setNewAchievement(newlyUnlocked);
    }

    updatedStats.achievements = checkedAchievements;
    saveStats(updatedStats);

    return newSession;
  }, [sessions, stats, dailyRecords, saveSessions, saveStats, saveDailyRecords]);

  // Clear new achievement notification
  const clearNewAchievement = useCallback(() => {
    setNewAchievement(null);
  }, []);

  // Get recent sessions
  const recentSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.startTime.localeCompare(a.startTime)).slice(0, 10);
  }, [sessions]);

  // Get weekly stats
  const weeklyStats = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const weeklyDaily = dailyRecords.filter(d => d.date >= weekAgo);

    return {
      sessions: weeklyDaily.reduce((sum, d) => sum + d.sessionsCount, 0),
      minutes: weeklyDaily.reduce((sum, d) => sum + d.totalMinutes, 0),
      avgScore: weeklyDaily.length > 0
        ? weeklyDaily.reduce((sum, d) => sum + d.avgScore, 0) / weeklyDaily.length
        : 0,
      activeDays: weeklyDaily.length,
    };
  }, [dailyRecords]);

  return {
    sessions,
    stats,
    dailyRecords,
    loading,
    newAchievement,
    recentSessions,
    weeklyStats,
    recordSession,
    clearNewAchievement,
  };
}
