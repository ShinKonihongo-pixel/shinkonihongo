// Progress tracking types

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  cardsStudied: number;
  minutesStudied: number;
  jlptPracticed: number;
  gamesPlayed: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  isActiveToday: boolean;
}

export interface LevelProgress {
  level: string; // N5, N4, etc.
  totalCards: number;
  memorized: number;
  learning: number;
  dueForReview: number;
  masteryPercent: number;
}

export interface WeeklyGoal {
  cardsTarget: number;
  cardsCompleted: number;
  minutesTarget: number;
  minutesCompleted: number;
}

export interface ProgressSummary {
  dailyActivity: DailyActivity[];
  streak: StreakInfo;
  levelProgress: LevelProgress[];
  weeklyGoal: WeeklyGoal;
  cardsDueToday: number;
  totalXP: number;
  currentLevel: number;
  levelTitle: string;
}
