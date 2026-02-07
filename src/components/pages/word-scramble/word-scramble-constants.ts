// Word Scramble game constants
// Extracted from word-scramble-page.tsx for better maintainability

import type { JLPTLevel } from '../../../types/flashcard';
import type { PlayerRole } from './word-scramble-types';

// JLPT level options
export const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// Game defaults
export const DEFAULT_TIME = 30;
export const DEFAULT_QUESTIONS = 10;
export const MIN_WORD_LENGTH = 3;

// Auto-fill penalty percentages (20%, 40%, 60%)
export const AUTO_FILL_PENALTIES = [0.2, 0.4, 0.6];

// Level colors for visual distinction
export const LEVEL_COLORS: Record<JLPTLevel, { bg: string; border: string; text: string }> = {
  BT: { bg: '#ede9fe', border: '#8b5cf6', text: '#6d28d9' },
  N5: { bg: '#ecfdf5', border: '#10b981', text: '#059669' },
  N4: { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb' },
  N3: { bg: '#fef3c7', border: '#f59e0b', text: '#d97706' },
  N2: { bg: '#fce7f3', border: '#ec4899', text: '#db2777' },
  N1: { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' },
};

// Role colors for player names
export const ROLE_COLORS: Record<PlayerRole, string> = {
  user: '#ffffff',
  vip: '#fbbf24',
  admin: '#60a5fa',
  super_admin: '#f472b6',
};

// Bot names for multiplayer simulation
export const BOT_NAMES = [
  'Sakura', 'Yuki', 'Hana', 'Ryu', 'Kenji',
  'Akira', 'Mei', 'Kaito', 'Sora', 'Rin'
];

// Bot avatars
export const BOT_AVATARS = [
  '🎭', '🦊', '🐱', '🐼', '🎨',
  '🌸', '⭐', '🔥', '💫', '🌙'
];
