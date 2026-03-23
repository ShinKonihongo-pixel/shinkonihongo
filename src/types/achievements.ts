// Achievement system and daily mission type definitions

import type { LucideIcon } from 'lucide-react';

// Achievement tier levels
export type AchievementTier = 'bronze' | 'silver' | 'gold';

// Achievement categories
export type AchievementCategory = 'learning' | 'streak' | 'games' | 'social' | 'mastery' | 'special';

// Single tier threshold
export interface AchievementTierDef {
  tier: AchievementTier;
  threshold: number;
  xpReward: number;
}

// Static achievement definition
export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  nameVi: string;
  nameJp: string;
  description: string;
  icon: LucideIcon;
  tiers: AchievementTierDef[];
}

// User's progress on a specific achievement (Firestore)
export interface UserAchievementProgress {
  achievementId: string;
  currentValue: number;
  unlockedTiers: AchievementTier[];
  lastUnlockedAt?: string;
}

// Full user achievement doc in Firestore
export interface UserAchievementData {
  userId: string;
  achievements: Record<string, UserAchievementProgress>;
  updatedAt: string;
}

// Mission types
export type MissionType =
  | 'study_words'
  | 'review_cards'
  | 'play_game'
  | 'read_passage'
  | 'grammar_study'
  | 'listening'
  | 'kanji_study'
  | 'jlpt_practice';

// Mission template
export interface MissionTemplate {
  type: MissionType;
  titleTemplate: string;
  descriptionVi: string;
  icon: LucideIcon;
  xpReward: number;
  targetRange: { min: number; max: number };
}

// Active daily mission instance
export interface DailyMission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  icon: LucideIcon;
  target: number;
  progress: number;
  xpReward: number;
  isCompleted: boolean;
  completedAt?: string;
}

// Full daily mission state (localStorage)
export interface DailyMissionState {
  date: string;
  missions: DailyMission[];
  allCompleted: boolean;
  bonusXpClaimed: boolean;
  bonusXp: number;
}

// Toast item for achievement unlock
export interface AchievementToastItem {
  id: string;
  achievementId: string;
  tier: AchievementTier;
  nameVi: string;
  icon: LucideIcon;
  xpReward: number;
  timestamp: number;
}

// Celebration types
export type CelebrationReason = 'all_missions' | 'gold_achievement' | 'level_up';

// Stats used for achievement checking
export interface CheckableStats {
  totalCardsStudied: number;
  totalStudySessions: number;
  totalStudyTime: number;
  totalGamesPlayed: number;
  totalGameWins: number;
  goldMedals: number;
  totalJLPTQuestions: number;
  currentStreak: number;
  longestStreak: number;
  friendCount: number;
  badgesSent: number;
  badgesReceived: number;
  masteryByLevel: Record<string, number>;
  modesUsed: number;
  kanjiLearned: number;
}
