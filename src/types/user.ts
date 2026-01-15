// User types for authentication system
// Role hierarchy: super_admin > admin > vip_user > user

export type UserRole = 'super_admin' | 'admin' | 'vip_user' | 'user';

export interface User {
  id: string;
  username: string;
  password: string; // In real app, this would be hashed
  role: UserRole;
  displayName?: string; // Optional display name
  avatar?: string; // Avatar URL or emoji
  profileBackground?: string; // Profile background gradient/color
  vipExpirationDate?: string; // VIP expiration date (YYYY-MM-DD), auto convert to user when expired
  createdBy?: string; // ID of admin who created this user
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  role: UserRole;
  displayName?: string;
  avatar?: string;
  profileBackground?: string;
}

// User statistics and history
export interface StudySession {
  id: string;
  userId: string;
  date: string;
  cardsStudied: number;
  correctCount: number;
  duration: number; // in seconds
  lessonIds: string[];
}

export interface GameSession {
  id: string;
  userId: string;
  date: string;
  gameTitle: string;
  rank: number;
  totalPlayers: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
}

export interface JLPTSession {
  id: string;
  userId: string;
  date: string;
  level: string;
  category: string;
  correctCount: number;
  totalQuestions: number;
  duration: number; // in seconds
}

export interface UserStats {
  totalStudySessions: number;
  totalCardsStudied: number;
  totalStudyTime: number; // in seconds
  totalGamesPlayed: number;
  totalGameWins: number;
  averageGameRank: number;
  totalJLPTSessions: number;
  totalJLPTCorrect: number;
  totalJLPTQuestions: number;
}

// Level system
export interface UserLevel {
  level: number;
  title: string;
  xp: number;
  nextLevelXp: number;
  progress: number; // 0-100%
}

// Level titles by level range
export const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: 'Tân binh' },
  { minLevel: 5, title: 'Học viên' },
  { minLevel: 10, title: 'Sinh viên' },
  { minLevel: 15, title: 'Cử nhân' },
  { minLevel: 20, title: 'Thạc sĩ' },
  { minLevel: 30, title: 'Tiến sĩ' },
  { minLevel: 40, title: 'Giáo sư' },
  { minLevel: 50, title: 'Học giả' },
  { minLevel: 60, title: 'Bậc thầy' },
  { minLevel: 75, title: 'Đại sư' },
  { minLevel: 100, title: 'Huyền thoại' },
];

// Calculate XP needed for next level (increases with level)
export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

// Get title for a level
export function getTitleForLevel(level: number): string {
  let title = LEVEL_TITLES[0].title;
  for (const t of LEVEL_TITLES) {
    if (level >= t.minLevel) {
      title = t.title;
    }
  }
  return title;
}

// Calculate user level from stats
export function calculateUserLevel(stats: UserStats): UserLevel {
  // XP formula: study sessions * 10 + games * 5 + wins * 20 + JLPT sessions * 15
  const totalXp =
    stats.totalStudySessions * 10 +
    stats.totalGamesPlayed * 5 +
    stats.totalGameWins * 20 +
    stats.totalJLPTSessions * 15 +
    Math.floor(stats.totalStudyTime / 60); // 1 XP per minute studied

  // Calculate level from XP
  let level = 1;
  let xpUsed = 0;
  while (true) {
    const xpNeeded = getXpForLevel(level);
    if (xpUsed + xpNeeded > totalXp) {
      break;
    }
    xpUsed += xpNeeded;
    level++;
  }

  const currentLevelXp = totalXp - xpUsed;
  const nextLevelXp = getXpForLevel(level);
  const progress = Math.floor((currentLevelXp / nextLevelXp) * 100);

  return {
    level,
    title: getTitleForLevel(level),
    xp: totalXp,
    nextLevelXp,
    progress,
  };
}
