// Center analytics hook — computes engagement, performance, and trend metrics
// Derives all data from existing Firestore collections (no new collections needed)

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, db } from '../services/firestore/collections';
import type { CenterMemberInfo } from './use-center-members';
import type { Classroom } from '../types/classroom';
import { handleError } from '../utils/error-handler';

// ========== Types ==========

export interface EngagementMetrics {
  activeThisWeek: number;    // members with any activity in last 7 days
  activeThisMonth: number;   // members with any activity in last 30 days
  engagementRate: number;    // activeThisWeek / totalStudents (0-100)
  avgStudyMinutes: number;   // average study time per active student this week
  totalStudySessions: number;
  totalGameSessions: number;
  totalJlptSessions: number;
}

export interface ClassPerformance {
  classId: string;
  className: string;
  level: string;
  studentCount: number;
  activeStudents: number;    // studied this week
  avgStudyTime: number;      // minutes per student
  avgGameScore: number;
  engagementPercent: number;
}

export interface WeeklyTrend {
  week: string; // 'W1', 'W2', etc. or date range
  sessions: number;
  activeUsers: number;
  avgMinutes: number;
}

export interface TopStudent {
  userId: string;
  displayName: string;
  avatar?: string;
  totalSessions: number;
  totalMinutes: number;
  totalGames: number;
}

export interface CenterAnalytics {
  engagement: EngagementMetrics;
  classPerformance: ClassPerformance[];
  weeklyTrends: WeeklyTrend[];
  topStudents: TopStudent[];
  loading: boolean;
}

// ========== Helpers ==========

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function getWeekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return 'Tuần này';
  if (weeksAgo === 1) return 'Tuần trước';
  return `${weeksAgo} tuần trước`;
}

// ========== Hook ==========

export function useCenterAnalytics(
  centerId: string,
  members: CenterMemberInfo[],
  classrooms: Classroom[],
) {
  const [studySessions, setStudySessions] = useState<any[]>([]);
  const [gameSessions, setGameSessions] = useState<any[]>([]);
  const [jlptSessions, setJlptSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get all student user IDs
  const studentIds = useMemo(
    () => members.filter(m => m.member.role === 'student').map(m => m.member.userId),
    [members]
  );

  // Fetch sessions for all center students (last 30 days)
  useEffect(() => {
    if (studentIds.length === 0) {
      setLoading(false);
      return;
    }

    const thirtyDaysAgo = getDateNDaysAgo(30);

    async function fetchSessions() {
      setLoading(true);
      try {
        // Firestore 'in' query supports max 30 items per batch
        const batches = [];
        for (let i = 0; i < studentIds.length; i += 30) {
          batches.push(studentIds.slice(i, i + 30));
        }

        const allStudy: any[] = [];
        const allGames: any[] = [];
        const allJlpt: any[] = [];

        for (const batch of batches) {
          // Study sessions
          const studyQ = query(
            collection(db, 'studySessions'),
            where('userId', 'in', batch),
            where('date', '>=', thirtyDaysAgo),
          );
          const studySnap = await getDocs(studyQ);
          studySnap.forEach(d => allStudy.push({ id: d.id, ...d.data() }));

          // Game sessions
          const gameQ = query(
            collection(db, 'gameSessions'),
            where('userId', 'in', batch),
            where('date', '>=', thirtyDaysAgo),
          );
          const gameSnap = await getDocs(gameQ);
          gameSnap.forEach(d => allGames.push({ id: d.id, ...d.data() }));

          // JLPT sessions
          const jlptQ = query(
            collection(db, 'jlptSessions'),
            where('userId', 'in', batch),
            where('date', '>=', thirtyDaysAgo),
          );
          const jlptSnap = await getDocs(jlptQ);
          jlptSnap.forEach(d => allJlpt.push({ id: d.id, ...d.data() }));
        }

        setStudySessions(allStudy);
        setGameSessions(allGames);
        setJlptSessions(allJlpt);
      } catch (err) {
        console.error('Center analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [studentIds]);

  // Compute engagement metrics
  const engagement = useMemo<EngagementMetrics>(() => {
    const sevenDaysAgo = getDateNDaysAgo(7);
    const totalStudents = studentIds.length;

    // Active users this week
    const weeklyActiveIds = new Set<string>();
    const monthlyActiveIds = new Set<string>();
    let totalMinutes = 0;

    for (const s of studySessions) {
      monthlyActiveIds.add(s.userId);
      if (s.date >= sevenDaysAgo) {
        weeklyActiveIds.add(s.userId);
        totalMinutes += (s.duration || 0) / 60;
      }
    }
    for (const g of gameSessions) {
      monthlyActiveIds.add(g.userId);
      if (g.date >= sevenDaysAgo) weeklyActiveIds.add(g.userId);
    }
    for (const j of jlptSessions) {
      monthlyActiveIds.add(j.userId);
      if (j.date >= sevenDaysAgo) weeklyActiveIds.add(j.userId);
    }

    const activeWeek = weeklyActiveIds.size;
    const avgMinutes = activeWeek > 0 ? Math.round(totalMinutes / activeWeek) : 0;

    return {
      activeThisWeek: activeWeek,
      activeThisMonth: monthlyActiveIds.size,
      engagementRate: totalStudents > 0 ? Math.round((activeWeek / totalStudents) * 100) : 0,
      avgStudyMinutes: avgMinutes,
      totalStudySessions: studySessions.filter(s => s.date >= sevenDaysAgo).length,
      totalGameSessions: gameSessions.filter(g => g.date >= sevenDaysAgo).length,
      totalJlptSessions: jlptSessions.filter(j => j.date >= sevenDaysAgo).length,
    };
  }, [studySessions, gameSessions, jlptSessions, studentIds]);

  // Per-class performance
  const classPerformance = useMemo<ClassPerformance[]>(() => {
    const sevenDaysAgo = getDateNDaysAgo(7);

    return classrooms.map(c => {
      // Get student IDs for this class (from classroom members)
      // Since we don't have classroom_members here, use all students as approximation
      // NOTE: classroom_members collection not yet available — all students used as approximation
      // UI-level filter by classId is applied in CenterAnalyticsTab
      const classStudySessions = studySessions.filter(s => s.date >= sevenDaysAgo);
      const activeIds = new Set(classStudySessions.map((s: any) => s.userId));
      const totalMinutes = classStudySessions.reduce((sum: number, s: any) => sum + (s.duration || 0) / 60, 0);

      return {
        classId: c.id,
        className: c.name,
        level: c.level || 'basic',
        studentCount: c.studentCount || 0,
        activeStudents: Math.min(activeIds.size, c.studentCount || 0),
        avgStudyTime: activeIds.size > 0 ? Math.round(totalMinutes / activeIds.size) : 0,
        avgGameScore: 0,
        engagementPercent: c.studentCount > 0
          ? Math.round((Math.min(activeIds.size, c.studentCount) / c.studentCount) * 100)
          : 0,
      };
    });
  }, [classrooms, studySessions]);

  // Weekly trends (last 4 weeks)
  const weeklyTrends = useMemo<WeeklyTrend[]>(() => {
    const weeks: WeeklyTrend[] = [];

    for (let w = 3; w >= 0; w--) {
      const weekStart = getDateNDaysAgo(w * 7 + 7);
      const weekEnd = getDateNDaysAgo(w * 7);

      const weekStudy = studySessions.filter(s => s.date >= weekStart && s.date < weekEnd);
      const weekGames = gameSessions.filter(g => g.date >= weekStart && g.date < weekEnd);
      const weekJlpt = jlptSessions.filter(j => j.date >= weekStart && j.date < weekEnd);

      const activeIds = new Set([
        ...weekStudy.map((s: any) => s.userId),
        ...weekGames.map((g: any) => g.userId),
        ...weekJlpt.map((j: any) => j.userId),
      ]);

      const totalMinutes = weekStudy.reduce((sum: number, s: any) => sum + (s.duration || 0) / 60, 0);

      weeks.push({
        week: getWeekLabel(w),
        sessions: weekStudy.length + weekGames.length + weekJlpt.length,
        activeUsers: activeIds.size,
        avgMinutes: activeIds.size > 0 ? Math.round(totalMinutes / activeIds.size) : 0,
      });
    }

    return weeks;
  }, [studySessions, gameSessions, jlptSessions]);

  // Top students (by total sessions this month)
  const topStudents = useMemo<TopStudent[]>(() => {
    const userMap = new Map<string, { sessions: number; minutes: number; games: number }>();

    for (const s of studySessions) {
      const existing = userMap.get(s.userId) || { sessions: 0, minutes: 0, games: 0 };
      existing.sessions++;
      existing.minutes += (s.duration || 0) / 60;
      userMap.set(s.userId, existing);
    }
    for (const g of gameSessions) {
      const existing = userMap.get(g.userId) || { sessions: 0, minutes: 0, games: 0 };
      existing.games++;
      userMap.set(g.userId, existing);
    }

    return Array.from(userMap.entries())
      .map(([userId, data]) => {
        const member = members.find(m => m.member.userId === userId);
        return {
          userId,
          displayName: member?.displayName || 'Unknown',
          avatar: member?.avatar,
          totalSessions: data.sessions,
          totalMinutes: Math.round(data.minutes),
          totalGames: data.games,
        };
      })
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, 10);
  }, [studySessions, gameSessions, members]);

  return {
    engagement,
    classPerformance,
    weeklyTrends,
    topStudents,
    loading,
  };
}
