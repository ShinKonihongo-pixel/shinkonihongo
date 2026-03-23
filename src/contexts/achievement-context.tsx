// Achievement & Daily Mission context provider
// Watches user-data-context sessions reactively (Option B: no changes to user-data-context)

import { createContext, useContext, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react';
import type {
  UserAchievementProgress,
  DailyMission,
  AchievementToastItem,
  MissionType,
  CelebrationReason,
  CheckableStats,
} from '../types/achievements';
import { useAchievements } from '../hooks/use-achievements';
import { useDailyMissions } from '../hooks/use-daily-missions';
import { useUserData } from './user-data-context';
import { useState } from 'react';

interface AchievementContextValue {
  // Achievements
  achievements: Record<string, UserAchievementProgress>;
  achievementsLoading: boolean;

  // Missions
  missions: DailyMission[];
  allMissionsCompleted: boolean;
  bonusXpClaimed: boolean;
  bonusXp: number;
  claimMissionBonus: () => void;

  // Mission progress (for direct calls from pages without session tracking)
  updateMissionProgress: (type: MissionType, increment: number) => void;

  // Toast
  pendingToast: AchievementToastItem | null;
  dismissToast: () => void;

  // Celebration
  celebration: CelebrationReason | null;
  dismissCelebration: () => void;

  // Showcase modal
  showShowcase: boolean;
  openShowcase: () => void;
  closeShowcase: () => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

export function useAchievementContext(): AchievementContextValue {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievementContext must be used within AchievementProvider');
  return ctx;
}

// Optional version that returns null outside provider (for sidebar, etc.)
export function useAchievementContextOptional(): AchievementContextValue | null {
  return useContext(AchievementContext);
}

interface AchievementProviderProps {
  children: ReactNode;
}

export function AchievementProvider({ children }: AchievementProviderProps) {
  const {
    currentUser,
    userStats,
    studySessions,
    gameSessions,
    jlptSessions,
    friendsWithUsers,
    badgeStats,
  } = useUserData();

  const userId = currentUser?.id ?? null;

  // Achievement hook
  const {
    achievements,
    loading: achievementsLoading,
    checkAchievements,
    pendingToast,
    dismissToast,
  } = useAchievements(userId);

  // Mission hook
  const {
    missions,
    allCompleted: allMissionsCompleted,
    bonusXpClaimed,
    bonusXp,
    justCompletedAll,
    updateMissionProgress,
    dismissAllComplete,
    claimBonus,
  } = useDailyMissions(userId);

  // Celebration state
  const [celebration, setCelebration] = useState<CelebrationReason | null>(null);

  // Showcase modal
  const [showShowcase, setShowShowcase] = useState(false);

  // Track session counts to detect new sessions
  const prevStudyCount = useRef(studySessions.length);
  const prevGameCount = useRef(gameSessions.length);
  const prevJlptCount = useRef(jlptSessions.length);

  // Assemble checkable stats from current user data
  const assembleStats = useCallback((): CheckableStats => {
    const streak = currentUser ? {
      currentStreak: 0,
      longestStreak: 0,
    } : { currentStreak: 0, longestStreak: 0 };

    return {
      totalCardsStudied: userStats?.totalCardsStudied ?? 0,
      totalStudySessions: userStats?.totalStudySessions ?? 0,
      totalStudyTime: userStats?.totalStudyTime ?? 0,
      totalGamesPlayed: userStats?.totalGamesPlayed ?? 0,
      totalGameWins: userStats?.totalGameWins ?? 0,
      goldMedals: userStats?.goldMedals ?? 0,
      totalJLPTQuestions: userStats?.totalJLPTQuestions ?? 0,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      friendCount: friendsWithUsers?.length ?? 0,
      badgesSent: badgeStats?.totalSent ?? 0,
      badgesReceived: badgeStats?.totalReceived ?? 0,
      masteryByLevel: {},
      modesUsed: 0,
      kanjiLearned: 0,
    };
  }, [currentUser, userStats, friendsWithUsers, badgeStats]);

  // Watch study sessions for changes
  useEffect(() => {
    if (studySessions.length > prevStudyCount.current && studySessions.length > 0) {
      const newSession = studySessions[0];
      updateMissionProgress('study_words', newSession.cardsStudied);
      updateMissionProgress('review_cards', newSession.cardsStudied);
      checkAchievements(assembleStats());
    }
    prevStudyCount.current = studySessions.length;
  }, [studySessions.length, studySessions, updateMissionProgress, checkAchievements, assembleStats]);

  // Watch game sessions
  useEffect(() => {
    if (gameSessions.length > prevGameCount.current && gameSessions.length > 0) {
      updateMissionProgress('play_game', 1);
      checkAchievements(assembleStats());
    }
    prevGameCount.current = gameSessions.length;
  }, [gameSessions.length, gameSessions, updateMissionProgress, checkAchievements, assembleStats]);

  // Watch JLPT sessions
  useEffect(() => {
    if (jlptSessions.length > prevJlptCount.current && jlptSessions.length > 0) {
      const newSession = jlptSessions[0];
      updateMissionProgress('jlpt_practice', newSession.totalQuestions);
      checkAchievements(assembleStats());
    }
    prevJlptCount.current = jlptSessions.length;
  }, [jlptSessions.length, jlptSessions, updateMissionProgress, checkAchievements, assembleStats]);

  // Trigger celebration when all missions complete
  useEffect(() => {
    if (justCompletedAll) {
      setCelebration('all_missions');
      dismissAllComplete();
    }
  }, [justCompletedAll, dismissAllComplete]);

  // Trigger celebration for gold achievement
  useEffect(() => {
    if (pendingToast?.tier === 'gold') {
      setCelebration('gold_achievement');
    }
  }, [pendingToast]);

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  const value = useMemo<AchievementContextValue>(() => ({
    achievements,
    achievementsLoading,
    missions,
    allMissionsCompleted,
    bonusXpClaimed,
    bonusXp,
    claimMissionBonus: claimBonus,
    updateMissionProgress,
    pendingToast,
    dismissToast,
    celebration,
    dismissCelebration,
    showShowcase,
    openShowcase: () => setShowShowcase(true),
    closeShowcase: () => setShowShowcase(false),
  }), [
    achievements,
    achievementsLoading,
    missions,
    allMissionsCompleted,
    bonusXpClaimed,
    bonusXp,
    claimBonus,
    updateMissionProgress,
    pendingToast,
    dismissToast,
    celebration,
    dismissCelebration,
    showShowcase,
  ]);

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}
