import type { JLPTLevel } from './types';

export const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const LEVEL_THEMES: Record<JLPTLevel, {
  gradient: string;
  glow: string;
  accent: string;
  light: string;
}> = {
  BT: {
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #5b21b6 100%)',
    glow: 'rgba(139, 92, 246, 0.5)',
    accent: '#8b5cf6',
    light: '#ede9fe',
  },
  N5: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    glow: 'rgba(16, 185, 129, 0.5)',
    accent: '#10b981',
    light: '#d1fae5',
  },
  N4: {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
    glow: 'rgba(59, 130, 246, 0.5)',
    accent: '#3b82f6',
    light: '#dbeafe',
  },
  N3: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
    glow: 'rgba(245, 158, 11, 0.5)',
    accent: '#f59e0b',
    light: '#fef3c7',
  },
  N2: {
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)',
    glow: 'rgba(236, 72, 153, 0.5)',
    accent: '#ec4899',
    light: '#fce7f3',
  },
  N1: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
    glow: 'rgba(239, 68, 68, 0.5)',
    accent: '#ef4444',
    light: '#fee2e2',
  },
};
