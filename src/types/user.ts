// User types for authentication system
// Role hierarchy: super_admin > director > branch_admin > main_teacher > part_time_teacher > assistant > vip_user > user

export type UserRole =
  | 'super_admin'
  | 'director'           // Giám đốc - quản lý nhiều chi nhánh
  | 'branch_admin'       // Admin chi nhánh
  | 'main_teacher'       // Giáo viên chính
  | 'part_time_teacher'  // Giáo viên part-time
  | 'assistant'          // Trợ giảng
  | 'admin'              // Legacy - for backward compatibility
  | 'vip_user'
  | 'user';

// Role labels (Vietnamese)
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  director: 'Giám đốc',
  branch_admin: 'Admin chi nhánh',
  main_teacher: 'Giáo viên chính',
  part_time_teacher: 'Giáo viên part-time',
  assistant: 'Trợ giảng',
  admin: 'Admin',
  vip_user: 'VIP',
  user: 'Người dùng',
};

// Role hierarchy level (higher = more permissions)
export const USER_ROLE_LEVEL: Record<UserRole, number> = {
  super_admin: 100,
  director: 90,
  branch_admin: 70,
  main_teacher: 50,
  part_time_teacher: 40,
  assistant: 30,
  admin: 60,  // Legacy
  vip_user: 20,
  user: 10,
};

// Check if user has permission (role level >= required level)
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return USER_ROLE_LEVEL[userRole] >= USER_ROLE_LEVEL[requiredRole];
}

// Check if user is any type of teacher
export function isTeacher(role: UserRole): boolean {
  return ['main_teacher', 'part_time_teacher', 'assistant'].includes(role);
}

// Check if user is admin level or higher
export function isAdminLevel(role: UserRole): boolean {
  return USER_ROLE_LEVEL[role] >= USER_ROLE_LEVEL.branch_admin;
}

// JLPT Level type for user's study level
export type UserJLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export const USER_JLPT_LEVELS: UserJLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const USER_JLPT_LEVEL_LABELS: Record<UserJLPTLevel, string> = {
  N5: 'N5 - Sơ cấp',
  N4: 'N4 - Sơ trung cấp',
  N3: 'N3 - Trung cấp',
  N2: 'N2 - Trung cao cấp',
  N1: 'N1 - Cao cấp',
};

export interface User {
  id: string;
  username: string;
  password: string; // In real app, this would be hashed
  role: UserRole;
  displayName?: string; // Optional display name
  email?: string; // User email
  avatar?: string; // Avatar URL or emoji
  profileBackground?: string; // Profile background gradient/color
  jlptLevel?: UserJLPTLevel; // User's current JLPT study level
  vipExpirationDate?: string; // VIP expiration date (YYYY-MM-DD), auto convert to user when expired
  createdBy?: string; // ID of admin who created this user
  createdAt: string;
  // Branch-related fields
  branchId?: string;      // Chi nhánh hiện tại (cho teacher, branch_admin)
  branchIds?: string[];   // Các chi nhánh được quản lý (cho director)
}

export interface CurrentUser {
  id: string;
  username: string;
  role: UserRole;
  displayName?: string;
  avatar?: string;
  profileBackground?: string;
  jlptLevel?: UserJLPTLevel;
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
  // Medal tracking (ranks 1, 2, 3)
  goldMedals: number;    // Hạng 1
  silverMedals: number;  // Hạng 2
  bronzeMedals: number;  // Hạng 3
  totalMedals: number;   // Tổng huy chương (1+2+3)
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
  // XP formula:
  // - Study sessions: 10 XP each
  // - Games played: 5 XP each
  // - Gold medals (rank 1): 30 XP each
  // - Silver medals (rank 2): 20 XP each
  // - Bronze medals (rank 3): 10 XP each
  // - JLPT sessions: 15 XP each
  // - Study time: 1 XP per minute
  const totalXp =
    stats.totalStudySessions * 10 +
    stats.totalGamesPlayed * 5 +
    stats.goldMedals * 30 +
    stats.silverMedals * 20 +
    stats.bronzeMedals * 10 +
    stats.totalJLPTSessions * 15 +
    Math.floor(stats.totalStudyTime / 60);

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
