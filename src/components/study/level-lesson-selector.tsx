// Level and lesson selection component for study pages
// Premium UI with Japanese-inspired design and glassmorphism effects

import { useState, useMemo } from 'react';
import { ChevronRight, Check, BookOpen, Layers, Play, Sparkles, GraduationCap } from 'lucide-react';
import type { JLPTLevel, Lesson, Flashcard, GrammarCard, GrammarLesson } from '../../types/flashcard';

// Base lesson type - both Lesson and GrammarLesson share these properties
type BaseLesson = {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  parentId: string | null;
  order: number;
};

interface LevelLessonSelectorProps {
  type: 'vocabulary' | 'grammar';
  cards: Flashcard[] | GrammarCard[];
  getLessonsByLevel: (level: JLPTLevel) => BaseLesson[];
  getChildLessons: (parentId: string) => BaseLesson[];
  onStart: (selectedLessons: string[], level: JLPTLevel) => void;
  onGoHome: () => void;
}

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

export function LevelLessonSelector({
  type,
  cards,
  getLessonsByLevel,
  getChildLessons,
  onStart,
}: LevelLessonSelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [hoveredLevel, setHoveredLevel] = useState<JLPTLevel | null>(null);

  // Count cards by level
  const countByLevel = useMemo(() => {
    const counts: Record<string, number> = {};
    JLPT_LEVELS.forEach(level => {
      if (type === 'vocabulary') {
        counts[level] = (cards as Flashcard[]).filter(c => c.jlptLevel === level).length;
      } else {
        counts[level] = (cards as GrammarCard[]).filter(c => c.jlptLevel === level).length;
      }
    });
    return counts;
  }, [cards, type]);

  // Get lessons for selected level (only parent lessons)
  const levelLessons = useMemo(() => {
    if (!selectedLevel) return [];
    const allLessons = getLessonsByLevel(selectedLevel);
    return allLessons.filter(l => !l.parentId);
  }, [selectedLevel, getLessonsByLevel]);

  // Count cards per lesson
  const cardsPerLesson = useMemo(() => {
    const counts: Record<string, number> = {};
    levelLessons.forEach(lesson => {
      const childLessons = getChildLessons(lesson.id);
      const lessonIds = [lesson.id, ...childLessons.map(l => l.id)];
      if (type === 'vocabulary') {
        counts[lesson.id] = (cards as Flashcard[]).filter(c => lessonIds.includes(c.lessonId)).length;
      } else {
        counts[lesson.id] = (cards as GrammarCard[]).filter(c => lessonIds.includes(c.lessonId)).length;
      }
    });
    return counts;
  }, [levelLessons, cards, getChildLessons, type]);

  // Total selected cards count
  const totalSelectedCards = useMemo(() => {
    if (selectedLessons.length === 0) return 0;
    let total = 0;
    selectedLessons.forEach(lessonId => {
      total += cardsPerLesson[lessonId] || 0;
    });
    return total;
  }, [selectedLessons, cardsPerLesson]);

  const toggleLesson = (lessonId: string) => {
    setSelectedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const selectAllLessons = () => {
    const availableLessons = levelLessons.filter(l => (cardsPerLesson[l.id] || 0) > 0);
    setSelectedLessons(availableLessons.map(l => l.id));
  };

  const deselectAllLessons = () => {
    setSelectedLessons([]);
  };

  const handleStart = () => {
    if (selectedLevel && selectedLessons.length > 0) {
      onStart(selectedLessons, selectedLevel);
    }
  };

  const backToLevelSelect = () => {
    setSelectedLevel(null);
    setSelectedLessons([]);
  };

  return (
    <div className="premium-selector">
      {/* Animated Background */}
      <div className="bg-aurora" />
      <div className="bg-grid" />

      {/* Level Selection Screen */}
      {!selectedLevel && (
        <div className="selector-container">
          {/* Premium Header */}
          <header className="premium-header">
            <div className="header-badge">
              <GraduationCap size={14} />
              <span>JLPT Learning</span>
            </div>
            <div className="header-main">
              <div className="header-icon-wrapper">
                <div className="header-icon">
                  {type === 'vocabulary' ? <Layers size={32} /> : <BookOpen size={32} />}
                </div>
                <Sparkles className="sparkle-effect sparkle-1" size={16} />
                <Sparkles className="sparkle-effect sparkle-2" size={12} />
              </div>
              <h1 className="header-title">
                {type === 'vocabulary' ? 'Học Từ Vựng' : 'Học Ngữ Pháp'}
              </h1>
              <p className="header-subtitle">Chọn cấp độ JLPT để bắt đầu</p>
            </div>
          </header>

          {/* Level Cards Grid */}
          <div className="levels-grid">
            {JLPT_LEVELS.map((level, index) => {
              const theme = LEVEL_THEMES[level];
              const count = countByLevel[level];
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
                  onClick={() => !disabled && setSelectedLevel(level)}
                  onMouseEnter={() => setHoveredLevel(level)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  disabled={disabled}
                >
                  <div className="card-glow" />
                  <div className="card-content">
                    <span className="card-level">{level}</span>
                    <span className="card-count">
                      {count} {type === 'vocabulary' ? 'từ' : 'mẫu'}
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
      )}

      {/* Lesson Selection Screen */}
      {selectedLevel && (
        <div className="lesson-container">
          {/* Premium Lesson Header */}
          <header className="lesson-header" style={{
            '--header-gradient': LEVEL_THEMES[selectedLevel].gradient,
            '--header-glow': LEVEL_THEMES[selectedLevel].glow,
            '--header-accent': LEVEL_THEMES[selectedLevel].accent,
          } as React.CSSProperties}>
            <div className="lesson-header-content">
              {/* Left Section: Back + Level Info */}
              <div className="header-left">
                <button className="back-btn" onClick={backToLevelSelect}>
                  <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <div className="level-badge">
                  <span className="level-text">{selectedLevel}</span>
                </div>
                <div className="header-info">
                  <h2 className="header-title">
                    {type === 'vocabulary' ? 'Từ Vựng' : 'Ngữ Pháp'}
                  </h2>
                  <p className="header-subtitle">
                    {selectedLessons.length > 0
                      ? `${selectedLessons.length} bài đã chọn • ${totalSelectedCards} ${type === 'vocabulary' ? 'từ' : 'mẫu'}`
                      : `${levelLessons.length} bài học`}
                  </p>
                </div>
              </div>

              {/* Right Section: Actions */}
              <div className="header-actions">
                <button
                  className={`header-btn select-all ${selectedLessons.length === levelLessons.filter(l => (cardsPerLesson[l.id] || 0) > 0).length ? 'active' : ''}`}
                  onClick={selectAllLessons}
                >
                  <Check size={14} />
                  <span>Chọn tất cả</span>
                </button>
                <button
                  className="header-btn deselect"
                  onClick={deselectAllLessons}
                  disabled={selectedLessons.length === 0}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          </header>

          {/* Lessons Grid */}
          <div className="lessons-grid">
            {levelLessons.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} strokeWidth={1} />
                <p>Chưa có bài học nào</p>
              </div>
            ) : (
              levelLessons.map((lesson, index) => {
                const isSelected = selectedLessons.includes(lesson.id);
                const cardCount = cardsPerLesson[lesson.id] || 0;
                const disabled = cardCount === 0;

                return (
                  <button
                    key={lesson.id}
                    className={`lesson-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    style={{
                      '--accent': LEVEL_THEMES[selectedLevel].accent,
                      '--glow': LEVEL_THEMES[selectedLevel].glow,
                      '--delay': `${index * 0.05}s`,
                    } as React.CSSProperties}
                    onClick={() => !disabled && toggleLesson(lesson.id)}
                    disabled={disabled}
                  >
                    <div className={`check-box ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div className="lesson-info">
                      <span className="lesson-name">{lesson.name}</span>
                      <span className="lesson-count">
                        {cardCount} {type === 'vocabulary' ? 'từ vựng' : 'mẫu câu'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer - Only Start Button */}
          <footer className="lesson-footer">
            <button
              className="start-btn"
              onClick={handleStart}
              disabled={selectedLessons.length === 0}
              style={{
                '--btn-gradient': LEVEL_THEMES[selectedLevel].gradient,
                '--btn-glow': LEVEL_THEMES[selectedLevel].glow,
              } as React.CSSProperties}
            >
              <Play size={18} />
              <span>Bắt đầu học</span>
              {totalSelectedCards > 0 && (
                <span className="btn-count">{totalSelectedCards}</span>
              )}
            </button>
          </footer>
        </div>
      )}

      <style>{`
        /* ========== Premium Selector Base ========== */
        .premium-selector {
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
        .bg-aurora {
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

        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        /* ========== Level Selection Container ========== */
        .selector-container {
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

        /* ========== Premium Header ========== */
        .premium-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3rem;
          animation: fadeInDown 0.6s ease-out;
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .header-badge {
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

        .header-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .header-icon-wrapper {
          position: relative;
        }

        .header-icon {
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

        .sparkle-effect {
          position: absolute;
          color: #fbbf24;
          animation: sparkle 2s ease-in-out infinite;
        }

        .sparkle-1 {
          top: -8px;
          right: -8px;
        }

        .sparkle-2 {
          bottom: -4px;
          left: -6px;
          animation-delay: 0.5s;
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.3) rotate(15deg); opacity: 0.7; }
        }

        .header-title {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.85) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .header-subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 1rem;
          margin: 0;
        }

        /* ========== Level Cards Grid ========== */
        .levels-grid {
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
        .level-card {
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

        .level-card .card-glow {
          position: absolute;
          inset: -2px;
          background: var(--card-gradient);
          border-radius: 22px;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: -1;
        }

        .level-card:hover:not(:disabled) .card-glow {
          opacity: 0.4;
        }

        .level-card:hover:not(:disabled) {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow:
            0 20px 40px -10px var(--card-glow),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .level-card:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .level-card .card-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .level-card .card-level {
          font-size: 2.5rem;
          font-weight: 900;
          background: var(--card-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          text-align: center;
        }

        .level-card .card-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          text-align: center;
        }

        .level-card .card-arrow {
          position: absolute;
          bottom: -30px;
          opacity: 0;
          color: var(--card-accent);
          transition: all 0.3s ease;
        }

        .level-card:hover:not(:disabled) .card-arrow {
          bottom: -20px;
          opacity: 1;
        }

        .level-card .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.6s ease;
        }

        .level-card:hover:not(:disabled) .card-shine {
          left: 100%;
        }

        /* ========== Lesson Container ========== */
        .lesson-container {
          position: relative;
          z-index: 10;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.4s ease-out;
          background: linear-gradient(135deg, #0c0a1d 0%, #1a1333 50%, #0f172a 100%);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ========== Premium Lesson Header ========== */
        .lesson-header {
          position: relative;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
        }

        .lesson-header::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--header-gradient);
          box-shadow: 0 0 20px var(--header-glow);
        }

        .lesson-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateX(-2px);
        }

        .level-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 44px;
          padding: 0 0.75rem;
          background: var(--header-gradient);
          border-radius: 12px;
          box-shadow:
            0 4px 15px -3px var(--header-glow),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .level-text {
          font-weight: 900;
          font-size: 1rem;
          color: white;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .header-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .header-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: white;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .header-subtitle {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .header-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.5rem 0.875rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .header-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .header-btn.select-all {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
          border-color: rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }

        .header-btn.select-all:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.2) 100%);
          border-color: rgba(16, 185, 129, 0.5);
          color: #a7f3d0;
        }

        .header-btn.select-all.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: transparent;
          color: white;
          box-shadow: 0 2px 12px rgba(16, 185, 129, 0.4);
        }

        .header-btn.deselect {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
        }

        .header-btn.deselect:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.25);
          color: #fca5a5;
        }

        .header-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* ========== Lessons Grid - Premium ========== */
        .lessons-grid {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 1.25rem;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.75rem;
          align-content: start;
        }

        .lessons-grid::-webkit-scrollbar {
          width: 6px;
        }

        .lessons-grid::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }

        .lessons-grid::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.4);
          gap: 1rem;
        }

        /* ========== Lesson Card - Premium ========== */
        .lesson-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1.25rem 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          animation: lessonAppear 0.3s ease-out var(--delay) both;
          overflow: hidden;
        }

        .lesson-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        @keyframes lessonAppear {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .lesson-card:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px -10px rgba(0,0,0,0.5);
        }

        .lesson-card:hover:not(:disabled)::before {
          opacity: 1;
        }

        .lesson-card.selected {
          background: linear-gradient(135deg, rgba(var(--accent-rgb, 16, 185, 129), 0.15) 0%, rgba(var(--accent-rgb, 16, 185, 129), 0.08) 100%);
          border-color: var(--accent);
          box-shadow:
            0 0 0 1px var(--accent),
            0 4px 20px -5px var(--glow);
        }

        .lesson-card.selected::before {
          opacity: 1;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
        }

        .lesson-card:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .check-box {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.03);
        }

        .check-box.checked {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
          box-shadow: 0 3px 12px var(--glow);
          transform: scale(1.05);
        }

        .lesson-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
        }

        .lesson-name {
          font-weight: 700;
          color: white;
          font-size: 0.95rem;
          letter-spacing: -0.01em;
        }

        .lesson-count {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* ========== Footer ========== */
        .lesson-footer {
          padding: 0.75rem 1.25rem;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .start-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.85rem 1.5rem;
          background: var(--btn-gradient);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px -5px var(--btn-glow);
        }

        .start-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px -5px var(--btn-glow);
        }

        .start-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: none;
        }

        .btn-count {
          background: rgba(255, 255, 255, 0.25);
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        /* ========== Responsive ========== */
        @media (max-width: 768px) {
          .selector-container {
            padding: 1.5rem 1rem 1rem;
            gap: 0.75rem;
          }

          .header-title {
            font-size: 1.75rem;
          }

          .header-icon {
            width: 60px;
            height: 60px;
          }

          .levels-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 0.75rem;
            margin-top: 1.5rem;
          }

          .level-card {
            padding: 1.5rem 0.75rem;
            border-radius: 16px;
          }

          .level-card .card-level {
            font-size: 2.5rem;
          }

          .level-card .card-count {
            font-size: 0.65rem;
          }

          .lessons-grid {
            grid-template-columns: repeat(3, 1fr);
            padding: 0.75rem;
            gap: 0.5rem;
          }

          .lesson-card {
            padding: 1rem 0.5rem;
          }

          .lesson-name {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .selector-container {
            padding: 1rem 0.75rem 0.5rem;
            gap: 0.5rem;
          }

          .header-badge {
            font-size: 0.65rem;
            padding: 0.3rem 0.75rem;
          }

          .header-title {
            font-size: 1.5rem;
          }

          .header-subtitle {
            font-size: 0.85rem;
          }

          .levels-grid {
            gap: 0.5rem;
            margin-top: 1rem;
          }

          .level-card {
            padding: 1.25rem 0.5rem;
            border-radius: 14px;
          }

          .level-card .card-level {
            font-size: 2.2rem;
          }

          .level-card .card-count {
            font-size: 0.6rem;
          }

          .lesson-header {
            padding: 0.6rem 0.75rem;
          }

          .header-left {
            gap: 0.4rem;
          }

          .back-btn {
            width: 30px;
            height: 30px;
          }

          .level-badge {
            min-width: 34px;
            height: 34px;
            padding: 0 0.4rem;
            border-radius: 8px;
          }

          .level-text {
            font-size: 0.8rem;
          }

          .header-info {
            display: none;
          }

          .header-actions {
            gap: 0.3rem;
          }

          .header-btn {
            padding: 0.35rem 0.5rem;
            font-size: 0.65rem;
            gap: 0.2rem;
          }

          .header-btn.select-all svg {
            display: none;
          }

          .lessons-grid {
            grid-template-columns: repeat(3, 1fr);
            padding: 0.5rem;
            gap: 0.35rem;
          }

          .lesson-card {
            padding: 0.7rem 0.4rem;
            border-radius: 10px;
          }

          .check-box {
            width: 18px;
            height: 18px;
          }

          .lesson-name {
            font-size: 0.75rem;
          }

          .lesson-count {
            font-size: 0.6rem;
          }

          .lesson-footer {
            padding: 0.5rem 0.75rem;
          }

          .start-btn {
            padding: 0.65rem 1rem;
            font-size: 0.85rem;
            border-radius: 10px;
          }
        }
      `}</style>
    </div>
  );
}
