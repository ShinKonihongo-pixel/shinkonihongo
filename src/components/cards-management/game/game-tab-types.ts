// Game Tab - Shared Types and Constants

import type { GameType } from '../../../types/game-hub';

export type GameSection = 'dashboard' | 'quiz' | 'picture-guess' | 'bingo' | 'kanji-battle' | 'word-match' | 'image-word' | 'ai-challenge' | 'global-settings';

// Game configuration with management capabilities
export interface GameConfig {
  id: GameType;
  title: string;
  shortTitle: string;
  description: string;
  emoji: string;
  gradient: string;
  color: string;
  category: string;
  hasManager: boolean;
  isNew: boolean;
  stats: { questions: number | null; played: number; avgScore: number | null };
}

// Dashboard stats
export interface DashboardStats {
  totalGamesPlayed: number;
  activeRooms: number;
  playersOnline: number;
  avgSessionTime: string;
  popularGame: string;
  todayGames: number;
}

// All game configurations
export const ALL_GAMES: GameConfig[] = [
  {
    id: 'picture-guess',
    title: 'Đuổi Hình Bắt Chữ',
    shortTitle: 'Picture Guess',
    description: 'Đoán từ qua hình ảnh emoji gợi ý',
    emoji: '🖼️',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#667eea',
    category: 'puzzle',
    hasManager: true,
    isNew: false,
    stats: { questions: 24, played: 156, avgScore: 78 },
  },
  {
    id: 'bingo',
    title: 'Bingo',
    shortTitle: 'Bingo',
    description: 'Bốc số may mắn - 6 dãy, ai BINGO trước thắng',
    emoji: '🎱',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f093fb',
    category: 'luck',
    hasManager: true,
    isNew: false,
    stats: { questions: null, played: 89, avgScore: null },
  },
  {
    id: 'kanji-battle',
    title: 'Đại Chiến Kanji',
    shortTitle: 'Kanji Battle',
    description: 'Đọc hoặc viết kanji nhanh nhất để chiến thắng',
    emoji: '⚔️',
    gradient: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
    color: '#FF5722',
    category: 'quiz',
    hasManager: true,
    isNew: true,
    stats: { questions: 150, played: 234, avgScore: 82 },
  },
  {
    id: 'word-match',
    title: 'Nối Từ Thách Đấu',
    shortTitle: 'Word Match',
    description: 'Nối cặp từ nhanh và chính xác nhất',
    emoji: '🔗',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    color: '#11998e',
    category: 'matching',
    hasManager: true,
    isNew: false,
    stats: { questions: 80, played: 67, avgScore: 75 },
  },
  {
    id: 'image-word',
    title: 'Nối Hình - Từ',
    shortTitle: 'Image Match',
    description: 'Nối hình ảnh với từ vựng tương ứng',
    emoji: '🖼️',
    gradient: 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
    color: '#E91E63',
    category: 'matching',
    hasManager: true,
    isNew: true,
    stats: { questions: 0, played: 0, avgScore: null },
  },
  {
    id: 'ai-challenge',
    title: 'Thách Đấu AI',
    shortTitle: 'AI Battle',
    description: 'Đấu trí 1v1 với AI - 10 cấp độ thử thách',
    emoji: '🤖',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#6366f1',
    category: 'ai',
    hasManager: true,
    isNew: true,
    stats: { questions: null, played: 45, avgScore: 68 },
  },
  {
    id: 'quiz',
    title: 'Đại Chiến Tiếng Nhật',
    shortTitle: 'Đại Chiến',
    description: 'Đối kháng kiến thức tiếng Nhật với bạn bè',
    emoji: '🎯',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
    color: '#FF6B6B',
    category: 'quiz',
    hasManager: true,
    isNew: false,
    stats: { questions: null, played: 312, avgScore: 71 },
  },
  {
    id: 'golden-bell',
    title: 'Rung Chuông Vàng',
    shortTitle: 'Golden Bell',
    description: 'Loại trực tiếp - người cuối thắng',
    emoji: '🔔',
    gradient: 'linear-gradient(135deg, #FFD93D 0%, #FF9F43 100%)',
    color: '#FFD93D',
    category: 'elimination',
    hasManager: false,
    isNew: false,
    stats: { questions: null, played: 203, avgScore: 65 },
  },
];

// Quiz game difficulty labels
export const QUIZ_DIFFICULTY_LABELS: { key: 'super_hard' | 'hard' | 'medium' | 'easy'; label: string; color: string }[] = [
  { key: 'super_hard', label: 'Siêu khó', color: '#DC2626' },
  { key: 'hard', label: 'Khó', color: '#F59E0B' },
  { key: 'medium', label: 'Vừa', color: '#3B82F6' },
  { key: 'easy', label: 'Dễ', color: '#10B981' },
];

// JLPT category labels
export const JLPT_CATEGORY_LABELS: { key: 'vocabulary' | 'grammar' | 'reading' | 'listening'; label: string; icon: string }[] = [
  { key: 'vocabulary', label: 'Từ vựng', icon: '📝' },
  { key: 'grammar', label: 'Ngữ pháp', icon: '📖' },
  { key: 'reading', label: 'Đọc hiểu', icon: '📄' },
  { key: 'listening', label: 'Nghe', icon: '🎧' },
];

// Quiz difficulty mix types
export type DiffKey = 'super_hard' | 'hard' | 'medium' | 'easy';
export type DiffRow = { super_hard: number; hard: number; medium: number; easy: number };
