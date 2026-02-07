import { ChevronRight } from 'lucide-react';
import type { JLPTLevel } from './types';
import { LEVEL_THEMES } from './constants';

interface LevelCardProps {
  level: JLPTLevel;
  count: number;
  type: 'vocabulary' | 'grammar' | 'kanji';
  index: number;
  isHovered: boolean;
  onHover: (level: JLPTLevel | null) => void;
  onSelect: (level: JLPTLevel) => void;
}

export function LevelCard({
  level,
  count,
  type,
  index,
  isHovered,
  onHover,
  onSelect,
}: LevelCardProps) {
  const theme = LEVEL_THEMES[level];
  const disabled = count === 0;

  return (
    <button
      className={`level-card ${disabled ? 'disabled' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        '--card-gradient': theme.gradient,
        '--card-glow': theme.glow,
        '--card-accent': theme.accent,
        '--card-light': theme.light,
        '--delay': `${index * 0.1}s`,
      } as React.CSSProperties}
      onClick={() => !disabled && onSelect(level)}
      onMouseEnter={() => onHover(level)}
      onMouseLeave={() => onHover(null)}
      disabled={disabled}
    >
      <div className="card-glow" />
      <div className="card-content">
        <span className="card-level">{level === 'BT' ? 'Bộ thủ' : level}</span>
        <span className="card-count">
          {count} {level === 'BT' ? 'bộ' : type === 'vocabulary' ? 'từ' : type === 'grammar' ? 'mẫu' : 'chữ'}
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
}
