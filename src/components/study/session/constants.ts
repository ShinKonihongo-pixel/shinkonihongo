// Constants for study session
import type { MemorizationStatus, DifficultyLevel } from '../../../types/flashcard';

export const MEMORIZATION_OPTIONS: { value: MemorizationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unset', label: 'Chưa đánh giá' },
  { value: 'memorized', label: 'Đã thuộc' },
  { value: 'not_memorized', label: 'Chưa thuộc' },
];

export const DIFFICULTY_OPTIONS: { value: DifficultyLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unset', label: 'Chưa đánh giá' },
  { value: 'super_hard', label: 'Siêu khó' },
  { value: 'hard', label: 'Khó nhớ' },
  { value: 'medium', label: 'Vừa' },
  { value: 'easy', label: 'Dễ nhớ' },
];

export { LEVEL_COLORS_EXTENDED as LEVEL_COLORS } from '../../../constants/themes';

export const FONT_OPTIONS = [
  { value: 'Noto Serif JP', label: 'Noto Serif JP' },
  { value: 'Noto Sans JP', label: 'Noto Sans JP' },
  { value: 'Zen Maru Gothic', label: 'Zen Maru Gothic' },
  { value: 'Kosugi Maru', label: 'Kosugi Maru' },
  { value: 'M PLUS Rounded 1c', label: 'M PLUS Rounded' },
];
