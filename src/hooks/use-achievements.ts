// Hook for achievement state management and checking

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  UserAchievementProgress,
  CheckableStats,
  AchievementToastItem,
  AchievementTier,
} from '../types/achievements';
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievement-definitions';
import {
  subscribeUserAchievements,
  batchUpdateAchievements,
} from '../services/firestore/achievement-service';

// Resolve stat value from CheckableStats by achievement ID
function getStatValue(achievementId: string, stats: CheckableStats): number {
  switch (achievementId) {
    case 'words_learned':
    case 'cards_studied':
      return stats.totalCardsStudied;
    case 'study_sessions':
      return stats.totalStudySessions;
    case 'study_time_hours':
      return Math.floor(stats.totalStudyTime / 3600);
    case 'kanji_learned':
      return stats.kanjiLearned;
    case 'jlpt_questions':
      return stats.totalJLPTQuestions;
    case 'streak_days':
      return Math.max(stats.currentStreak, stats.longestStreak);
    case 'games_played':
      return stats.totalGamesPlayed;
    case 'games_won':
      return stats.totalGameWins;
    case 'gold_medals':
      return stats.goldMedals;
    case 'elo_reached':
      return 0; // TODO: integrate ELO from quiz_battle_ratings
    case 'friends_added':
      return stats.friendCount;
    case 'badges_sent':
      return stats.badgesSent;
    case 'badges_received':
      return stats.badgesReceived;
    case 'jlpt_n5_mastery':
      return stats.masteryByLevel['N5'] || 0;
    case 'jlpt_n4_mastery':
      return stats.masteryByLevel['N4'] || 0;
    case 'jlpt_n3_mastery':
      return stats.masteryByLevel['N3'] || 0;
    case 'jlpt_n2_mastery':
      return stats.masteryByLevel['N2'] || 0;
    case 'jlpt_n1_mastery':
      return stats.masteryByLevel['N1'] || 0;
    case 'all_modes_tried':
      return stats.modesUsed;
    default:
      return 0;
  }
}

export function useAchievements(userId: string | null) {
  const [achievements, setAchievements] = useState<Record<string, UserAchievementProgress>>({});
  const [loading, setLoading] = useState(true);
  const [toastQueue, setToastQueue] = useState<AchievementToastItem[]>([]);
  const isChecking = useRef(false);

  // Subscribe to Firestore
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeUserAchievements(userId, (data) => {
      setAchievements(data.achievements);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  // Check all achievements against current stats
  const checkAchievements = useCallback(async (stats: CheckableStats) => {
    if (!userId || isChecking.current) return;
    isChecking.current = true;

    try {
      const updates: Array<{
        achievementId: string;
        newValue: number;
        newlyUnlockedTier?: AchievementTier;
      }> = [];
      const newToasts: AchievementToastItem[] = [];

      for (const def of ACHIEVEMENT_DEFINITIONS) {
        const currentValue = getStatValue(def.id, stats);
        const existing = achievements[def.id];
        const unlockedTiers = existing?.unlockedTiers || [];

        // Check each tier
        let newlyUnlocked: AchievementTier | undefined;
        for (const tierDef of def.tiers) {
          if (currentValue >= tierDef.threshold && !unlockedTiers.includes(tierDef.tier)) {
            newlyUnlocked = tierDef.tier;
            newToasts.push({
              id: `${def.id}-${tierDef.tier}-${Date.now()}`,
              achievementId: def.id,
              tier: tierDef.tier,
              nameVi: def.nameVi,
              icon: def.icon,
              xpReward: tierDef.xpReward,
              timestamp: Date.now(),
            });
          }
        }

        // Only update if value changed or tier unlocked
        if (currentValue !== (existing?.currentValue || 0) || newlyUnlocked) {
          updates.push({ achievementId: def.id, newValue: currentValue, newlyUnlockedTier: newlyUnlocked });
        }
      }

      if (updates.length > 0) {
        await batchUpdateAchievements(userId, updates);
      }
      if (newToasts.length > 0) {
        setToastQueue(prev => [...prev, ...newToasts]);
      }
    } finally {
      isChecking.current = false;
    }
  }, [userId, achievements]);

  // Toast management
  const consumeToast = useCallback((): AchievementToastItem | null => {
    if (toastQueue.length === 0) return null;
    const [first, ...rest] = toastQueue;
    setToastQueue(rest);
    return first;
  }, [toastQueue]);

  const pendingToast = toastQueue.length > 0 ? toastQueue[0] : null;

  const dismissToast = useCallback(() => {
    setToastQueue(prev => prev.slice(1));
  }, []);

  return {
    achievements,
    loading,
    checkAchievements,
    pendingToast,
    dismissToast,
    consumeToast,
    toastQueue,
  };
}
