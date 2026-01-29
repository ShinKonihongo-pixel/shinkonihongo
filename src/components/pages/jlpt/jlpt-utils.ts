// JLPT page utility functions
// Extracted from jlpt-page.tsx for better maintainability

import type { QuestionHistory, WeakAreaData } from './jlpt-types';
import { HISTORY_STORAGE_KEY, WEAK_AREAS_STORAGE_KEY } from './jlpt-constants';

/**
 * Load question history from localStorage for anti-repetition
 */
export function loadQuestionHistory(): QuestionHistory[] {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save question history to localStorage
 */
export function saveQuestionHistory(history: QuestionHistory[]): void {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

/**
 * Load weak areas data from localStorage
 */
export function loadWeakAreas(): WeakAreaData[] {
  try {
    const saved = localStorage.getItem(WEAK_AREAS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save weak areas data to localStorage
 */
export function saveWeakAreas(areas: WeakAreaData[]): void {
  localStorage.setItem(WEAK_AREAS_STORAGE_KEY, JSON.stringify(areas));
}
