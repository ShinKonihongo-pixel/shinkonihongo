// Shared JLPT level theme definitions
// Single source of truth for level colors across all pages

import type { JLPTLevel } from '../types/flashcard';

export interface LevelTheme {
  gradient: string;
  glow: string;
  accent: string;
  light: string;
  border: string;
}

/** Simple level accent colors - derived from LEVEL_THEMES.accent */
export const LEVEL_COLORS: Record<JLPTLevel, string> = {
  BT: '#8b5cf6',
  N5: '#22c55e',
  N4: '#3b82f6',
  N3: '#f59e0b',
  N2: '#ec4899',
  N1: '#ef4444',
};

/** Extended level colors with bg/text/border for cards & badges */
export const LEVEL_COLORS_EXTENDED: Record<JLPTLevel, { bg: string; text: string; border: string }> = {
  BT: { bg: '#ede9fe', text: '#6d28d9', border: '#a78bfa' },
  N5: { bg: '#ecfdf5', text: '#059669', border: '#10b981' },
  N4: { bg: '#eff6ff', text: '#2563eb', border: '#3b82f6' },
  N3: { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
  N2: { bg: '#fce7f3', text: '#db2777', border: '#ec4899' },
  N1: { bg: '#fef2f2', text: '#dc2626', border: '#ef4444' },
};

export const LEVEL_THEMES: Record<JLPTLevel, LevelTheme> = {
  BT: {
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #5b21b6 100%)',
    glow: 'rgba(139, 92, 246, 0.5)',
    accent: '#8b5cf6',
    light: '#ede9fe',
    border: 'rgba(139, 92, 246, 0.3)',
  },
  N5: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    glow: 'rgba(16, 185, 129, 0.5)',
    accent: '#10b981',
    light: '#d1fae5',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  N4: {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
    glow: 'rgba(59, 130, 246, 0.5)',
    accent: '#3b82f6',
    light: '#dbeafe',
    border: 'rgba(59, 130, 246, 0.3)',
  },
  N3: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
    glow: 'rgba(245, 158, 11, 0.5)',
    accent: '#f59e0b',
    light: '#fef3c7',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  N2: {
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)',
    glow: 'rgba(236, 72, 153, 0.5)',
    accent: '#ec4899',
    light: '#fce7f3',
    border: 'rgba(236, 72, 153, 0.3)',
  },
  N1: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
    glow: 'rgba(239, 68, 68, 0.5)',
    accent: '#ef4444',
    light: '#fee2e2',
    border: 'rgba(239, 68, 68, 0.3)',
  },
};
