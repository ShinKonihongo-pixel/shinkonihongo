// Hook for managing user history (study sessions, game sessions, JLPT sessions)

import { useState, useEffect, useCallback } from 'react';
import type { StudySession, GameSession, JLPTSession, UserStats } from '../types/user';
import * as firestoreService from '../services/firestore';

export function useUserHistory(userId: string | undefined) {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [jlptSessions, setJLPTSessions] = useState<JLPTSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all user history on mount
  useEffect(() => {
    if (!userId) {
      setStudySessions([]);
      setGameSessions([]);
      setJLPTSessions([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [study, game, jlpt] = await Promise.all([
          firestoreService.getStudySessionsByUser(userId),
          firestoreService.getGameSessionsByUser(userId),
          firestoreService.getJLPTSessionsByUser(userId),
        ]);
        setStudySessions(study.sort((a, b) => b.date.localeCompare(a.date)));
        setGameSessions(game.sort((a, b) => b.date.localeCompare(a.date)));
        setJLPTSessions(jlpt.sort((a, b) => b.date.localeCompare(a.date)));
      } catch (err) {
        console.error('Error fetching user history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  // Calculate user stats
  const stats: UserStats = {
    totalStudySessions: studySessions.length,
    totalCardsStudied: studySessions.reduce((sum, s) => sum + s.cardsStudied, 0),
    totalStudyTime: studySessions.reduce((sum, s) => sum + s.duration, 0),
    totalGamesPlayed: gameSessions.length,
    totalGameWins: gameSessions.filter(g => g.rank === 1).length,
    averageGameRank: gameSessions.length > 0
      ? gameSessions.reduce((sum, g) => sum + g.rank, 0) / gameSessions.length
      : 0,
    totalJLPTSessions: jlptSessions.length,
    totalJLPTCorrect: jlptSessions.reduce((sum, s) => sum + s.correctCount, 0),
    totalJLPTQuestions: jlptSessions.reduce((sum, s) => sum + s.totalQuestions, 0),
  };

  // Add study session
  const addStudySession = useCallback(async (data: Omit<StudySession, 'id' | 'userId'>) => {
    if (!userId) return;
    try {
      const session = await firestoreService.addStudySession({ ...data, userId });
      setStudySessions(prev => [session, ...prev]);
    } catch (err) {
      console.error('Error adding study session:', err);
    }
  }, [userId]);

  // Add game session
  const addGameSession = useCallback(async (data: Omit<GameSession, 'id' | 'userId'>) => {
    if (!userId) return;
    try {
      const session = await firestoreService.addGameSession({ ...data, userId });
      setGameSessions(prev => [session, ...prev]);
    } catch (err) {
      console.error('Error adding game session:', err);
    }
  }, [userId]);

  // Add JLPT session
  const addJLPTSession = useCallback(async (data: Omit<JLPTSession, 'id' | 'userId'>) => {
    if (!userId) return;
    try {
      const session = await firestoreService.addJLPTSession({ ...data, userId });
      setJLPTSessions(prev => [session, ...prev]);
    } catch (err) {
      console.error('Error adding JLPT session:', err);
    }
  }, [userId]);

  return {
    studySessions,
    gameSessions,
    jlptSessions,
    stats,
    loading,
    addStudySession,
    addGameSession,
    addJLPTSession,
  };
}
