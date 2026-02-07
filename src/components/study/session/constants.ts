// Constants for study session
import type { MemorizationStatus, DifficultyLevel, JLPTLevel } from '../../../types/flashcard';

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

export const LEVEL_COLORS: Record<JLPTLevel, { bg: string; text: string }> = {
  BT: { bg: '#ede9fe', text: '#6d28d9' },
  N5: { bg: '#ecfdf5', text: '#059669' },
  N4: { bg: '#eff6ff', text: '#2563eb' },
  N3: { bg: '#fef3c7', text: '#d97706' },
  N2: { bg: '#fce7f3', text: '#db2777' },
  N1: { bg: '#fef2f2', text: '#dc2626' },
};

export const FONT_OPTIONS = [
  { value: 'Noto Serif JP', label: 'Noto Serif JP' },
  { value: 'Noto Sans JP', label: 'Noto Sans JP' },
  { value: 'Zen Maru Gothic', label: 'Zen Maru Gothic' },
  { value: 'Kosugi Maru', label: 'Kosugi Maru' },
  { value: 'M PLUS Rounded 1c', label: 'M PLUS Rounded' },
];
