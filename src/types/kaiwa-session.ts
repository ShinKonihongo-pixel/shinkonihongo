// Kaiwa Session Types - Session history, statistics, and progress tracking

import type { JLPTLevel, ConversationStyle, ConversationTopic, KaiwaEvaluation } from './kaiwa';

// Session record for history
export interface KaiwaSession {
  id: string;
  startTime: string;           // ISO timestamp
  endTime: string;             // ISO timestamp
  durationMinutes: number;
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  topicName?: string;          // For advanced topics
  messageCount: number;
  userMessageCount: number;
  evaluation?: KaiwaEvaluation;
  savedSentences: string[];
  // Metrics
  pronunciationAttempts: number;
  avgPronunciationAccuracy: number;
  wordsUsedCount: number;
}

// Daily practice record for streaks
export interface KaiwaDailyRecord {
  date: string;                // YYYY-MM-DD
  sessionsCount: number;
  totalMinutes: number;
  avgScore: number;
  levels: JLPTLevel[];
}

// Overall statistics
export interface KaiwaStats {
  totalSessions: number;
  totalMinutes: number;
  totalExchanges: number;
  avgScore: number;
  currentStreak: number;       // Days
  longestStreak: number;
  levelProgress: Record<JLPTLevel, {
    sessions: number;
    avgScore: number;
    lastPracticed?: string;
  }>;
  topicProgress: Record<ConversationTopic, {
    sessions: number;
    avgScore: number;
  }>;
  pronunciationStats: {
    totalAttempts: number;
    avgAccuracy: number;
    bestAccuracy: number;
  };
  // Achievements
  achievements: KaiwaAchievement[];
}

// Achievement definition
export interface KaiwaAchievement {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  icon: string;
  unlockedAt?: string;         // ISO timestamp when unlocked
  progress?: number;           // 0-100 for progress-based achievements
  requirement: number;         // Target value
}

// Predefined achievements
export const KAIWA_ACHIEVEMENTS: Omit<KaiwaAchievement, 'unlockedAt' | 'progress'>[] = [
  // Session milestones
  { id: 'first_session', name: 'Bước đầu tiên', nameJa: '第一歩', description: 'Hoàn thành session đầu tiên', icon: '🌱', requirement: 1 },
  { id: 'sessions_10', name: 'Người chăm chỉ', nameJa: '努力家', description: 'Hoàn thành 10 sessions', icon: '📚', requirement: 10 },
  { id: 'sessions_50', name: 'Kiên trì', nameJa: '忍耐強い', description: 'Hoàn thành 50 sessions', icon: '💪', requirement: 50 },
  { id: 'sessions_100', name: 'Bậc thầy', nameJa: '達人', description: 'Hoàn thành 100 sessions', icon: '🏆', requirement: 100 },

  // Streak achievements
  { id: 'streak_3', name: 'Khởi động', nameJa: 'ウォームアップ', description: 'Luyện tập 3 ngày liên tiếp', icon: '🔥', requirement: 3 },
  { id: 'streak_7', name: 'Tuần lễ cố gắng', nameJa: '一週間', description: 'Luyện tập 7 ngày liên tiếp', icon: '⚡', requirement: 7 },
  { id: 'streak_30', name: 'Tháng hoàn hảo', nameJa: '一ヶ月', description: 'Luyện tập 30 ngày liên tiếp', icon: '🌟', requirement: 30 },

  // Score achievements
  { id: 'perfect_10', name: 'Hoàn hảo', nameJa: '完璧', description: 'Đạt điểm 10/10 trong đánh giá', icon: '💯', requirement: 10 },
  { id: 'consistent_8', name: 'Ổn định', nameJa: '安定', description: 'Đạt điểm 8+ trong 5 sessions liên tiếp', icon: '📈', requirement: 5 },

  // Level achievements
  { id: 'all_levels', name: 'Đa năng', nameJa: '万能', description: 'Luyện tập tất cả các cấp độ', icon: '🌈', requirement: 5 },
  { id: 'n1_master', name: 'N1 Master', nameJa: 'N1マスター', description: 'Đạt điểm 8+ ở N1', icon: '👑', requirement: 8 },

  // Topic achievements
  { id: 'all_topics', name: 'Toàn diện', nameJa: '全方位', description: 'Luyện tập tất cả các chủ đề', icon: '🎯', requirement: 10 },

  // Pronunciation achievements
  { id: 'pronunciation_90', name: 'Phát âm chuẩn', nameJa: '発音上手', description: 'Đạt độ chính xác 90%+ trong phát âm', icon: '🎤', requirement: 90 },

  // Time achievements
  { id: 'hour_total', name: '1 giờ đầu tiên', nameJa: '一時間', description: 'Tổng cộng 1 giờ luyện tập', icon: '⏰', requirement: 60 },
  { id: 'hours_10', name: '10 giờ cống hiến', nameJa: '十時間', description: 'Tổng cộng 10 giờ luyện tập', icon: '🕐', requirement: 600 },
];

// Default empty stats
export const DEFAULT_KAIWA_STATS: KaiwaStats = {
  totalSessions: 0,
  totalMinutes: 0,
  totalExchanges: 0,
  avgScore: 0,
  currentStreak: 0,
  longestStreak: 0,
  levelProgress: {
    N5: { sessions: 0, avgScore: 0 },
    N4: { sessions: 0, avgScore: 0 },
    N3: { sessions: 0, avgScore: 0 },
    N2: { sessions: 0, avgScore: 0 },
    N1: { sessions: 0, avgScore: 0 },
  },
  topicProgress: {
    free: { sessions: 0, avgScore: 0 },
    greetings: { sessions: 0, avgScore: 0 },
    self_intro: { sessions: 0, avgScore: 0 },
    shopping: { sessions: 0, avgScore: 0 },
    restaurant: { sessions: 0, avgScore: 0 },
    travel: { sessions: 0, avgScore: 0 },
    work: { sessions: 0, avgScore: 0 },
    hobbies: { sessions: 0, avgScore: 0 },
    weather: { sessions: 0, avgScore: 0 },
    directions: { sessions: 0, avgScore: 0 },
  },
  pronunciationStats: {
    totalAttempts: 0,
    avgAccuracy: 0,
    bestAccuracy: 0,
  },
  achievements: [],
};
