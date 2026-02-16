// JLPT page constants
// Extracted from jlpt-page.tsx for better maintainability

import type { JLPTLevel } from '../../../types/jlpt-question';
import type { AssessmentLevel, CategoryConfig } from './jlpt-types';

// JLPT levels (typed to jlpt-question.JLPTLevel which excludes BT)
export const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// Question category configurations
export const QUESTION_CATEGORIES: CategoryConfig[] = [
  { value: 'vocabulary', label: 'Từ vựng', icon: '文', description: 'Kiểm tra vốn từ vựng' },
  { value: 'grammar', label: 'Ngữ pháp', icon: '法', description: 'Cấu trúc ngữ pháp' },
  { value: 'reading', label: 'Đọc hiểu', icon: '読', description: 'Đọc và hiểu văn bản' },
  { value: 'listening', label: 'Nghe', icon: '聴', description: 'Nghe và hiểu' },
];

// Storage keys for localStorage persistence
export const HISTORY_STORAGE_KEY = 'jlpt_question_history';
export const WEAK_AREAS_STORAGE_KEY = 'jlpt_weak_areas';

// Level assessment thresholds and messages
export const ASSESSMENT_LEVELS: Record<string, AssessmentLevel> = {
  excellent: { min: 90, label: '優秀', color: '#10b981', emoji: '🌟' },
  good: { min: 75, label: '良好', color: '#3b82f6', emoji: '👍' },
  pass: { min: 60, label: '合格', color: '#f59e0b', emoji: '✓' },
  needsWork: { min: 0, label: '頑張れ', color: '#ef4444', emoji: '📚' },
};

// Get assessment level based on score percentage
export function getAssessmentLevel(percentage: number): AssessmentLevel {
  if (percentage >= ASSESSMENT_LEVELS.excellent.min) return ASSESSMENT_LEVELS.excellent;
  if (percentage >= ASSESSMENT_LEVELS.good.min) return ASSESSMENT_LEVELS.good;
  if (percentage >= ASSESSMENT_LEVELS.pass.min) return ASSESSMENT_LEVELS.pass;
  return ASSESSMENT_LEVELS.needsWork;
}
