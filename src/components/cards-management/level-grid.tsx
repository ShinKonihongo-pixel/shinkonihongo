// Shared JLPT level selection grid used across management tabs
// Layout: N5, N4, N3 on first row | N2, N1 on second row
// Styled to match the Reading tab's premium card design

import { ChevronRight } from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import './level-grid.css';

const DEFAULT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const LEVEL_THEMES: Record<JLPTLevel, { gradient: string; glow: string; icon: string; light: string }> = {
  BT: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', glow: 'rgba(139, 92, 246, 0.15)', icon: '部', light: '#f5f3ff' },
  N5: { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16, 185, 129, 0.15)', icon: '🌱', light: '#ecfdf5' },
  N4: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', glow: 'rgba(59, 130, 246, 0.15)', icon: '📘', light: '#eff6ff' },
  N3: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.15)', icon: '📖', light: '#f5f3ff' },
  N2: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.15)', icon: '📚', light: '#fffbeb' },
  N1: { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239, 68, 68, 0.15)', icon: '👑', light: '#fef2f2' },
};

interface LevelGridProps {
  onSelectLevel: (level: JLPTLevel) => void;
  getCount: (level: JLPTLevel) => number;
  countLabel?: string; // e.g. "từ", "mẫu", "bài đọc", "file", "bài"
  levels?: JLPTLevel[];
}

export function LevelGrid({ onSelectLevel, getCount, countLabel = 'mục', levels }: LevelGridProps) {
  const displayLevels = levels ?? DEFAULT_LEVELS;
  const is6Items = displayLevels.length === 6;
  return (
    <>
      <div className={`lg-grid ${is6Items ? 'lg-grid-6' : ''}`}>
        {displayLevels.map((level, idx) => {
          const theme = LEVEL_THEMES[level];
          const count = getCount(level);
          const label = level === 'BT' ? 'Bộ thủ' : level;
          return (
            <div
              key={level}
              className="lg-card"
              onClick={() => onSelectLevel(level)}
              style={{ '--lg-delay': `${idx * 0.08}s`, '--lg-gradient': theme.gradient, '--lg-glow': theme.glow, '--lg-light': theme.light } as React.CSSProperties}
            >
              <div className="lg-icon">{theme.icon}</div>
              <div className="lg-info">
                <h3>{label}</h3>
                <span>{count} {level === 'BT' ? 'bộ' : countLabel}</span>
              </div>
              <ChevronRight size={20} className="lg-arrow" />
              <div className="lg-shine" />
            </div>
          );
        })}
      </div>
    </>
  );
}
