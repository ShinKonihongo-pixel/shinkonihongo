// JLPT Level Selector - Shared component for practice pages
// Premium UI with glassmorphism and aurora background
// Used by: Reading Practice, Listening Practice, Exercise pages

import { useState, type ReactNode } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import { LEVEL_THEMES } from '../../constants/themes';
import { JLPT_LEVELS } from '../../constants/jlpt';
import './jlpt-level-selector.css';

export { LEVEL_THEMES, JLPT_LEVELS };

/** Map of display names for non-standard levels */
const LEVEL_DISPLAY: Partial<Record<JLPTLevel, string>> = { BT: 'Bộ thủ' };

interface JLPTLevelSelectorProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  countByLevel: Record<JLPTLevel, number>;
  countLabel: string | ((level: JLPTLevel) => string);
  onSelectLevel: (level: JLPTLevel) => void;
  levels?: JLPTLevel[];
}

export function JLPTLevelSelector({
  title,
  subtitle,
  icon,
  countByLevel,
  countLabel,
  onSelectLevel,
  levels,
}: JLPTLevelSelectorProps) {
  const [hoveredLevel, setHoveredLevel] = useState<JLPTLevel | null>(null);
  const displayLevels = levels ?? JLPT_LEVELS;
  const is6Items = displayLevels.length === 6;

  return (
    <div className="jlpt-level-selector">
      {/* Animated Background */}
      <div className="bg-aurora" />
      <div className="bg-grid" />

      <div className="selector-container">
        {/* Premium Header */}
        <header className="premium-header">
          <div className="header-main">
            <div className="header-icon-wrapper">
              <div className="header-icon">
                {icon}
              </div>
              <Sparkles className="sparkle-effect sparkle-1" size={16} />
              <Sparkles className="sparkle-effect sparkle-2" size={12} />
            </div>
            <h1 className="header-title">{title}</h1>
            <p className="header-subtitle">{subtitle}</p>
          </div>
        </header>

        {/* Level Cards Grid */}
        <div className={`levels-grid ${is6Items ? 'levels-grid-6' : ''}`}>
          {displayLevels.map((level, index) => {
            const theme = LEVEL_THEMES[level];
            const count = countByLevel[level] || 0;
            const disabled = count === 0;
            const isHovered = hoveredLevel === level;
            const label = typeof countLabel === 'function' ? countLabel(level) : countLabel;

            return (
              <button
                key={level}
                className={`level-card ${disabled ? 'disabled' : ''} ${isHovered ? 'hovered' : ''}`}
                style={{
                  '--card-gradient': theme.gradient,
                  '--card-glow': theme.glow,
                  '--card-accent': theme.accent,
                  '--card-light': theme.light,
                  '--delay': `${index * 0.1}s`,
                } as React.CSSProperties}
                onClick={() => !disabled && onSelectLevel(level)}
                onMouseEnter={() => setHoveredLevel(level)}
                onMouseLeave={() => setHoveredLevel(null)}
                disabled={disabled}
              >
                <div className="card-glow" />
                <div className="card-content">
                  <span className="card-level">{LEVEL_DISPLAY[level] ?? level}</span>
                  <span className="card-count">
                    {count} {label}
                  </span>
                  {!disabled && (
                    <div className="card-arrow">
                      <ChevronRight size={18} />
                    </div>
                  )}
                </div>
                {!disabled && <div className="card-shine" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
