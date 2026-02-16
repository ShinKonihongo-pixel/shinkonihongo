// Listening Practice page constants
// Extracted from listening-practice-page.tsx for better maintainability

import type { DifficultyOption } from './listening-practice-types';

// JLPT levels
export { JLPT_LEVELS } from '../../../constants/jlpt';

// Difficulty filter options
export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'TB' },
  { value: 'hard', label: 'Khó' },
  { value: 'super_hard', label: 'Rất khó' },
];

// Default playback settings
export const DEFAULT_PLAYBACK_SPEED = 1;
export const DEFAULT_REPEAT_COUNT = 1;
export const DEFAULT_DELAY_BETWEEN_WORDS = 2;
