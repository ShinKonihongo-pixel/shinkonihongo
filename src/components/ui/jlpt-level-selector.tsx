// JLPT Level Selector - Shared component for practice pages
// Premium UI with glassmorphism and aurora background
// Used by: Reading Practice, Listening Practice, Exercise pages

import { useState, useMemo, type ReactNode } from 'react';
import { ChevronRight, Sparkles, GraduationCap } from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// Premium color palette with gradients
const LEVEL_THEMES: Record<JLPTLevel, {
  gradient: string;
  glow: string;
  accent: string;
  light: string;
}> = {
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

export { LEVEL_THEMES, JLPT_LEVELS };

interface JLPTLevelSelectorProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  countByLevel: Record<JLPTLevel, number>;
  countLabel: string; // e.g., "bài", "từ", "mẫu"
  onSelectLevel: (level: JLPTLevel) => void;
  showFrame?: boolean; // Show frame around header (default: false)
}

export function JLPTLevelSelector({
  title,
  subtitle,
  icon,
  countByLevel,
  countLabel,
  onSelectLevel,
  showFrame = false,
}: JLPTLevelSelectorProps) {
  const [hoveredLevel, setHoveredLevel] = useState<JLPTLevel | null>(null);

  return (
    <div className="jlpt-level-selector">
      {/* Animated Background */}
      <div className="bg-aurora" />
      <div className="bg-grid" />

      <div className="selector-container">
        {/* Premium Header */}
        {showFrame ? (
          <div className="header-frame">
            <header className="premium-header">
              <div className="header-badge">
                <GraduationCap size={14} />
                <span>JLPT Learning</span>
              </div>
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
          </div>
        ) : (
          <header className="premium-header">
            <div className="header-badge">
              <GraduationCap size={14} />
              <span>JLPT Learning</span>
            </div>
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
        )}

        {/* Level Cards Grid */}
        <div className="levels-grid">
          {JLPT_LEVELS.map((level, index) => {
            const theme = LEVEL_THEMES[level];
            const count = countByLevel[level] || 0;
            const disabled = count === 0;
            const isHovered = hoveredLevel === level;

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
                  <span className="card-level">{level}</span>
                  <span className="card-count">
                    {count} {countLabel}
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

      <style>{`
        /* ========== JLPT Level Selector Base ========== */
        .jlpt-level-selector {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: calc(100vh - 60px);
          max-height: calc(100vh - 60px);
          overflow: hidden;
          background: linear-gradient(135deg, #0c0a1d 0%, #1a1333 50%, #0f172a 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ========== Animated Background ========== */
        .jlpt-level-selector .bg-aurora {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(236, 72, 153, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 50%);
          animation: aurora 15s ease-in-out infinite alternate;
        }

        @keyframes aurora {
          0% { opacity: 0.8; transform: scale(1) rotate(0deg); }
          100% { opacity: 1; transform: scale(1.1) rotate(3deg); }
        }

        .jlpt-level-selector .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        /* ========== Container ========== */
        .jlpt-level-selector .selector-container {
          position: relative;
          z-index: 10;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 2rem 2rem 1rem;
          gap: 1rem;
        }

        /* ========== Header Frame (optional) ========== */
        .jlpt-level-selector .header-frame {
          position: relative;
          padding: 2.5rem 3rem 3rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 24px;
          backdrop-filter: blur(8px);
          animation: fadeInDown 0.6s ease-out;
        }

        .jlpt-level-selector .header-frame::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 25px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(236, 72, 153, 0.1) 50%, rgba(99, 102, 241, 0.2) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        /* ========== Premium Header ========== */
        .jlpt-level-selector .premium-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .jlpt-level-selector .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 50px;
          color: #a5b4fc;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .jlpt-level-selector .header-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .jlpt-level-selector .header-icon-wrapper {
          position: relative;
        }

        .jlpt-level-selector .header-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow:
            0 8px 32px rgba(99, 102, 241, 0.3),
            inset 0 0 32px rgba(255,255,255,0.05);
        }

        .jlpt-level-selector .sparkle-effect {
          position: absolute;
          color: #fbbf24;
          animation: sparkle 2s ease-in-out infinite;
        }

        .jlpt-level-selector .sparkle-1 {
          top: -8px;
          right: -8px;
        }

        .jlpt-level-selector .sparkle-2 {
          bottom: -4px;
          left: -6px;
          animation-delay: 0.5s;
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.3) rotate(15deg); opacity: 0.7; }
        }

        .jlpt-level-selector .header-title {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.85) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .jlpt-level-selector .header-subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 1rem;
          margin: 0;
        }

        /* ========== Level Cards Grid ========== */
        .jlpt-level-selector .levels-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.25rem;
          max-width: 1000px;
          width: 100%;
          margin-top: 6rem;
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ========== Level Card ========== */
        .jlpt-level-selector .level-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          animation: cardAppear 0.5s ease-out var(--delay) both;
        }

        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(30px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .jlpt-level-selector .level-card .card-glow {
          position: absolute;
          inset: -2px;
          background: var(--card-gradient);
          border-radius: 22px;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: -1;
        }

        .jlpt-level-selector .level-card:hover:not(:disabled) .card-glow {
          opacity: 0.4;
        }

        .jlpt-level-selector .level-card:hover:not(:disabled) {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow:
            0 20px 40px -10px var(--card-glow),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .jlpt-level-selector .level-card:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .jlpt-level-selector .level-card .card-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .jlpt-level-selector .level-card .card-level {
          font-size: 2.5rem;
          font-weight: 900;
          background: var(--card-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          text-align: center;
        }

        .jlpt-level-selector .level-card .card-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          text-align: center;
        }

        .jlpt-level-selector .level-card .card-arrow {
          position: absolute;
          bottom: -30px;
          opacity: 0;
          color: var(--card-accent);
          transition: all 0.3s ease;
        }

        .jlpt-level-selector .level-card:hover:not(:disabled) .card-arrow {
          bottom: -20px;
          opacity: 1;
        }

        .jlpt-level-selector .level-card .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.6s ease;
        }

        .jlpt-level-selector .level-card:hover:not(:disabled) .card-shine {
          left: 100%;
        }

        /* ========== Responsive ========== */
        @media (max-width: 768px) {
          .jlpt-level-selector .selector-container {
            padding: 1.5rem 1rem 1rem;
            gap: 0.75rem;
          }

          .jlpt-level-selector .header-title {
            font-size: 1.5rem;
          }

          .jlpt-level-selector .header-icon {
            width: 50px;
            height: 50px;
          }

          .jlpt-level-selector .levels-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 0.75rem;
            margin-top: 3rem;
          }

          .jlpt-level-selector .level-card {
            padding: 1.25rem 0.5rem;
            border-radius: 16px;
          }

          .jlpt-level-selector .level-card .card-level {
            font-size: 2rem;
          }

          .jlpt-level-selector .level-card .card-count {
            font-size: 0.65rem;
          }
        }

        @media (max-width: 480px) {
          .jlpt-level-selector .selector-container {
            padding: 1rem 0.75rem 0.5rem;
            gap: 0.5rem;
          }

          .jlpt-level-selector .header-badge {
            font-size: 0.65rem;
            padding: 0.3rem 0.75rem;
          }

          .jlpt-level-selector .header-title {
            font-size: 1.35rem;
          }

          .jlpt-level-selector .header-subtitle {
            font-size: 0.85rem;
          }

          .jlpt-level-selector .levels-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 2rem;
          }

          .jlpt-level-selector .level-card {
            width: calc(33.33% - 0.35rem);
            padding: 1rem 0.35rem;
            border-radius: 14px;
          }

          .jlpt-level-selector .level-card .card-level {
            font-size: 1.75rem;
          }

          .jlpt-level-selector .level-card .card-count {
            font-size: 0.55rem;
          }
        }
      `}</style>
    </div>
  );
}
