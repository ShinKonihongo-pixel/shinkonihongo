// Word Scramble game constants
// Extracted from word-scramble-page.tsx for better maintainability

import type { PlayerRole } from './word-scramble-types';

// JLPT level options
export { JLPT_LEVELS } from '../../../constants/jlpt';

// Game defaults
export const DEFAULT_TIME = 30;
export const DEFAULT_QUESTIONS = 10;
export const MIN_WORD_LENGTH = 3;

// Auto-fill penalty percentages (20%, 40%, 60%)
export const AUTO_FILL_PENALTIES = [0.2, 0.4, 0.6];

// Level colors for visual distinction
export { LEVEL_COLORS_EXTENDED as LEVEL_COLORS } from '../../../constants/themes';

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
