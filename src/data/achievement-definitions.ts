// Static achievement catalog — ~20 achievements across 6 categories

import {
  BookOpen,
  Layers,
  GraduationCap,
  Clock,
  Flame,
  Gamepad2,
  Trophy,
  Medal,
  Swords,
  Users,
  Gift,
  Heart,
  Award,
  Compass,
} from 'lucide-react';
import type { AchievementDef } from '../types/achievements';

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  // === Learning ===
  {
    id: 'words_learned',
    category: 'learning',
    nameVi: 'Nhà Từ Vựng',
    nameJp: '語彙マスター',
    description: 'Học từ vựng mới',
    icon: BookOpen,
    tiers: [
      { tier: 'bronze', threshold: 50, xpReward: 30 },
      { tier: 'silver', threshold: 200, xpReward: 80 },
      { tier: 'gold', threshold: 1000, xpReward: 200 },
    ],
  },
  {
    id: 'cards_studied',
    category: 'learning',
    nameVi: 'Học Sinh Chăm Chỉ',
    nameJp: '勤勉な学生',
    description: 'Ôn tập flashcard',
    icon: Layers,
    tiers: [
      { tier: 'bronze', threshold: 100, xpReward: 30 },
      { tier: 'silver', threshold: 500, xpReward: 80 },
      { tier: 'gold', threshold: 2000, xpReward: 200 },
    ],
  },
  {
    id: 'study_sessions',
    category: 'learning',
    nameVi: 'Người Học Kiên Trì',
    nameJp: '粘り強い学習者',
    description: 'Hoàn thành buổi học',
    icon: GraduationCap,
    tiers: [
      { tier: 'bronze', threshold: 10, xpReward: 30 },
      { tier: 'silver', threshold: 50, xpReward: 80 },
      { tier: 'gold', threshold: 200, xpReward: 200 },
    ],
  },
  {
    id: 'study_time_hours',
    category: 'learning',
    nameVi: 'Ông Thầy Thời Gian',
    nameJp: '時間の達人',
    description: 'Tổng thời gian học (giờ)',
    icon: Clock,
    tiers: [
      { tier: 'bronze', threshold: 5, xpReward: 50 },
      { tier: 'silver', threshold: 25, xpReward: 120 },
      { tier: 'gold', threshold: 100, xpReward: 300 },
    ],
  },
  {
    id: 'kanji_learned',
    category: 'learning',
    nameVi: 'Nhà Hán Tự',
    nameJp: '漢字マスター',
    description: 'Học chữ Kanji',
    icon: BookOpen,
    tiers: [
      { tier: 'bronze', threshold: 20, xpReward: 30 },
      { tier: 'silver', threshold: 100, xpReward: 80 },
      { tier: 'gold', threshold: 500, xpReward: 200 },
    ],
  },
  {
    id: 'jlpt_questions',
    category: 'learning',
    nameVi: 'Luyện Thi JLPT',
    nameJp: 'JLPT対策',
    description: 'Làm câu hỏi JLPT',
    icon: Award,
    tiers: [
      { tier: 'bronze', threshold: 50, xpReward: 30 },
      { tier: 'silver', threshold: 200, xpReward: 80 },
      { tier: 'gold', threshold: 1000, xpReward: 200 },
    ],
  },
  // === Streak ===
  {
    id: 'streak_days',
    category: 'streak',
    nameVi: 'Ngọn Lửa Bất Diệt',
    nameJp: '不滅の炎',
    description: 'Streak liên tiếp',
    icon: Flame,
    tiers: [
      { tier: 'bronze', threshold: 7, xpReward: 50 },
      { tier: 'silver', threshold: 30, xpReward: 150 },
      { tier: 'gold', threshold: 100, xpReward: 500 },
    ],
  },
  // === Games ===
  {
    id: 'games_played',
    category: 'games',
    nameVi: 'Game Thủ',
    nameJp: 'ゲーマー',
    description: 'Chơi trò chơi',
    icon: Gamepad2,
    tiers: [
      { tier: 'bronze', threshold: 10, xpReward: 30 },
      { tier: 'silver', threshold: 50, xpReward: 80 },
      { tier: 'gold', threshold: 200, xpReward: 200 },
    ],
  },
  {
    id: 'games_won',
    category: 'games',
    nameVi: 'Nhà Vô Địch',
    nameJp: 'チャンピオン',
    description: 'Thắng trò chơi',
    icon: Trophy,
    tiers: [
      { tier: 'bronze', threshold: 5, xpReward: 30 },
      { tier: 'silver', threshold: 25, xpReward: 80 },
      { tier: 'gold', threshold: 100, xpReward: 200 },
    ],
  },
  {
    id: 'gold_medals',
    category: 'games',
    nameVi: 'Huy Chương Vàng',
    nameJp: '金メダル',
    description: 'Đạt hạng nhất',
    icon: Medal,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 30 },
      { tier: 'silver', threshold: 15, xpReward: 80 },
      { tier: 'gold', threshold: 50, xpReward: 200 },
    ],
  },
  {
    id: 'elo_reached',
    category: 'games',
    nameVi: 'Kiếm Sĩ ELO',
    nameJp: 'ELO剣士',
    description: 'Đạt ELO cao nhất',
    icon: Swords,
    tiers: [
      { tier: 'bronze', threshold: 1200, xpReward: 50 },
      { tier: 'silver', threshold: 1500, xpReward: 150 },
      { tier: 'gold', threshold: 1800, xpReward: 400 },
    ],
  },
  // === Social ===
  {
    id: 'friends_added',
    category: 'social',
    nameVi: 'Người Giao Tiếp',
    nameJp: '社交家',
    description: 'Kết bạn',
    icon: Users,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 20 },
      { tier: 'silver', threshold: 10, xpReward: 50 },
      { tier: 'gold', threshold: 25, xpReward: 100 },
    ],
  },
  {
    id: 'badges_sent',
    category: 'social',
    nameVi: 'Người Truyền Cảm Hứng',
    nameJp: 'インスピレーション',
    description: 'Tặng huy hiệu cho bạn bè',
    icon: Gift,
    tiers: [
      { tier: 'bronze', threshold: 5, xpReward: 20 },
      { tier: 'silver', threshold: 20, xpReward: 50 },
      { tier: 'gold', threshold: 50, xpReward: 100 },
    ],
  },
  {
    id: 'badges_received',
    category: 'social',
    nameVi: 'Được Yêu Mến',
    nameJp: '愛される人',
    description: 'Nhận huy hiệu từ bạn bè',
    icon: Heart,
    tiers: [
      { tier: 'bronze', threshold: 5, xpReward: 20 },
      { tier: 'silver', threshold: 20, xpReward: 50 },
      { tier: 'gold', threshold: 50, xpReward: 100 },
    ],
  },
  // === Mastery ===
  {
    id: 'jlpt_n5_mastery',
    category: 'mastery',
    nameVi: 'N5 Master',
    nameJp: 'N5マスター',
    description: 'Hoàn thành N5',
    icon: Award,
    tiers: [
      { tier: 'bronze', threshold: 50, xpReward: 50 },
      { tier: 'silver', threshold: 75, xpReward: 100 },
      { tier: 'gold', threshold: 95, xpReward: 300 },
    ],
  },
  {
    id: 'jlpt_n4_mastery',
    category: 'mastery',
    nameVi: 'N4 Master',
    nameJp: 'N4マスター',
    description: 'Hoàn thành N4',
    icon: Award,
    tiers: [
      { tier: 'bronze', threshold: 50, xpReward: 60 },
      { tier: 'silver', threshold: 75, xpReward: 120 },
      { tier: 'gold', threshold: 95, xpReward: 350 },
    ],
  },
  {
    id: 'jlpt_n3_mastery',
    category: 'mastery',
    nameVi: 'N3 Master',
    nameJp: 'N3マスター',
    description: 'Hoàn thành N3',
    icon: Award,
    tiers: [
      { tier: 'bronze', threshold: 50, xpReward: 80 },
      { tier: 'silver', threshold: 75, xpReward: 150 },
      { tier: 'gold', threshold: 95, xpReward: 400 },
    ],
  },
  {
    id: 'jlpt_n2_mastery',
    category: 'mastery',
    nameVi: 'N2 Master',
    nameJp: 'N2マスター',
    description: 'Hoàn thành N2',
    icon: Award,
    tiers: [
      { tier: 'bronze', threshold: 50, xpReward: 100 },
      { tier: 'silver', threshold: 75, xpReward: 200 },
      { tier: 'gold', threshold: 95, xpReward: 500 },
    ],
  },
  {
    id: 'jlpt_n1_mastery',
    category: 'mastery',
    nameVi: 'N1 Master',
    nameJp: 'N1マスター',
    description: 'Hoàn thành N1',
    icon: Award,
    tiers: [
      { tier: 'bronze', threshold: 50, xpReward: 150 },
      { tier: 'silver', threshold: 75, xpReward: 300 },
      { tier: 'gold', threshold: 95, xpReward: 700 },
    ],
  },
  // === Special ===
  {
    id: 'all_modes_tried',
    category: 'special',
    nameVi: 'Người Khám Phá',
    nameJp: '探検家',
    description: 'Thử các chế độ học khác nhau',
    icon: Compass,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 30 },
      { tier: 'silver', threshold: 5, xpReward: 60 },
      { tier: 'gold', threshold: 7, xpReward: 150 },
    ],
  },
];

// Helper: get achievement by ID
export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.id === id);
}

// Helper: get achievements by category
export function getAchievementsByCategory(category: AchievementDef['category']): AchievementDef[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category);
}

// Tier display info
export const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
};

export const TIER_LABELS: Record<string, string> = {
  bronze: 'Đồng',
  silver: 'Bạc',
  gold: 'Vàng',
};
