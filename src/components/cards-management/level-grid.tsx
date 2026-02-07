// Shared JLPT level selection grid used across management tabs
// Layout: N5, N4, N3 on first row | N2, N1 on second row
// Styled to match the Reading tab's premium card design

import { ChevronRight } from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';

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

      <style>{levelGridStyles}</style>
    </>
  );
}

const levelGridStyles = `
  .lg-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  /* Default 5-item layout: N2, N1 row centered */
  .lg-grid:not(.lg-grid-6) .lg-card:nth-child(4),
  .lg-grid:not(.lg-grid-6) .lg-card:nth-child(5) {
    grid-column: span 1;
  }
  .lg-grid:not(.lg-grid-6) .lg-card:nth-child(4) {
    grid-column-start: 1;
  }

  @supports (grid-template-columns: subgrid) {
    .lg-grid:not(.lg-grid-6) {
      grid-template-columns: repeat(6, 1fr);
    }
    .lg-grid:not(.lg-grid-6) .lg-card:nth-child(1),
    .lg-grid:not(.lg-grid-6) .lg-card:nth-child(2),
    .lg-grid:not(.lg-grid-6) .lg-card:nth-child(3) {
      grid-column: span 2;
    }
    .lg-grid:not(.lg-grid-6) .lg-card:nth-child(4) {
      grid-column: 1 / span 3;
    }
    .lg-grid:not(.lg-grid-6) .lg-card:nth-child(5) {
      grid-column: 4 / span 3;
    }
  }

  @supports not (grid-template-columns: subgrid) {
    .lg-grid:not(.lg-grid-6) {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .lg-grid:not(.lg-grid-6) .lg-card {
      flex: 1 1 calc(33.333% - 0.5rem);
      min-width: 0;
    }
    .lg-grid:not(.lg-grid-6) .lg-card:nth-child(4),
    .lg-grid:not(.lg-grid-6) .lg-card:nth-child(5) {
      flex: 1 1 calc(50% - 0.375rem);
    }
  }

  /* 6-item layout: simple 3x2 grid */
  .lg-grid-6 {
    grid-template-columns: repeat(3, 1fr);
  }

  .lg-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: white;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: lgAppear 0.4s ease backwards;
    animation-delay: var(--lg-delay);
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  @keyframes lgAppear {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .lg-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px var(--lg-glow);
  }

  .lg-card:hover .lg-shine {
    transform: translateX(100%);
  }

  .lg-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: transform 0.5s ease;
    pointer-events: none;
  }

  .lg-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
  }

  .lg-info {
    flex: 1;
    min-width: 0;
  }

  .lg-info h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
  }

  .lg-info span {
    font-size: 0.8rem;
    color: #64748b;
  }

  .lg-arrow {
    color: #94a3b8;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .lg-card:hover .lg-arrow {
    color: #6366f1;
    transform: translateX(4px);
  }

  @media (max-width: 480px) {
    .lg-card {
      padding: 0.875rem 1rem;
      gap: 0.625rem;
    }
    .lg-icon {
      font-size: 1.5rem;
    }
    .lg-info h3 {
      font-size: 1rem;
    }
    .lg-info span {
      font-size: 0.75rem;
    }
  }
`;
