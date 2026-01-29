// Level and lesson selection component for study pages
// Premium UI with Japanese-inspired design and glassmorphism effects

import { useState, useMemo } from 'react';
import { ChevronRight, Check, BookOpen, Layers, Play, Sparkles, Star, GraduationCap, Target } from 'lucide-react';
import type { JLPTLevel, Lesson, Flashcard, GrammarCard } from '../../types/flashcard';

interface LevelLessonSelectorProps {
  type: 'vocabulary' | 'grammar';
  cards: Flashcard[] | GrammarCard[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
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
  icon: string;
}> = {
  N5: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    glow: 'rgba(16, 185, 129, 0.5)',
    accent: '#10b981',
    light: '#d1fae5',
    icon: '🌱'
  },
  N4: {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
    glow: 'rgba(59, 130, 246, 0.5)',
    accent: '#3b82f6',
    light: '#dbeafe',
    icon: '🌿'
  },
  N3: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
    glow: 'rgba(245, 158, 11, 0.5)',
    accent: '#f59e0b',
    light: '#fef3c7',
    icon: '🌸'
  },
  N2: {
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)',
    glow: 'rgba(236, 72, 153, 0.5)',
    accent: '#ec4899',
    light: '#fce7f3',
    icon: '🔥'
  },
  N1: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
    glow: 'rgba(239, 68, 68, 0.5)',
    accent: '#ef4444',
    light: '#fee2e2',
    icon: '👑'
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

  // Total cards
  const totalCards = useMemo(() => {
    return Object.values(countByLevel).reduce((sum, count) => sum + count, 0);
  }, [countByLevel]);

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
            <div className="header-stats">
              <div className="stat-item">
                <Target size={14} />
                <span>{totalCards} {type === 'vocabulary' ? 'từ vựng' : 'mẫu câu'}</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <Star size={14} />
                <span>5 cấp độ</span>
              </div>
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
                    <span className="card-icon">{theme.icon}</span>
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
          {/* Lesson Header - Redesigned */}
          <header className="lesson-header" style={{
            '--header-gradient': LEVEL_THEMES[selectedLevel].gradient,
            '--header-glow': LEVEL_THEMES[selectedLevel].glow,
          } as React.CSSProperties}>
            <div className="lesson-header-top">
              <button className="back-btn" onClick={backToLevelSelect}>
                <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                <span>Quay lại</span>
              </button>
              <div className="level-badge-container">
                <span className="level-badge-icon">{LEVEL_THEMES[selectedLevel].icon}</span>
                <span className="level-badge-text">{selectedLevel}</span>
              </div>
            </div>
            <div className="lesson-header-content">
              <h2 className="lesson-title">Chọn bài học</h2>
              <p className="lesson-subtitle">
                {selectedLessons.length > 0
                  ? `Đã chọn ${selectedLessons.length} bài • ${totalSelectedCards} ${type === 'vocabulary' ? 'từ' : 'mẫu'}`
                  : `${levelLessons.length} bài học có sẵn`}
              </p>
            </div>
          </header>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button className="action-btn" onClick={selectAllLessons}>
              <Star size={14} />
              Chọn tất cả
            </button>
            <button
              className="action-btn"
              onClick={deselectAllLessons}
              disabled={selectedLessons.length === 0}
            >
              Bỏ chọn
            </button>
          </div>

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
          height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, #0c0a1d 0%, #1a1333 50%, #0f172a 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 2rem;
        }

        /* ========== Premium Header ========== */
        .premium-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
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
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
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
          font-size: 2.25rem;
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

        .header-stats {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }

        .stat-divider {
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
        }

        /* ========== Level Cards Grid ========== */
        .levels-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          max-width: 850px;
          width: 100%;
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

        .level-card .card-icon {
          font-size: 2rem;
          margin-bottom: 0.25rem;
        }

        .level-card .card-level {
          font-size: 1.75rem;
          font-weight: 900;
          background: var(--card-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
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
          height: 100vh;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ========== Lesson Header - Redesigned ========== */
        .lesson-header {
          position: relative;
          padding: 1rem 1.5rem 1.25rem;
          background: var(--header-gradient);
          overflow: hidden;
        }

        .lesson-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 0% 0%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(0,0,0,0.1) 0%, transparent 50%);
        }

        .lesson-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          position: relative;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.9rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          color: white;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateX(-4px);
        }

        .level-badge-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50px;
        }

        .level-badge-icon {
          font-size: 1.1rem;
        }

        .level-badge-text {
          font-weight: 800;
          color: white;
          font-size: 0.9rem;
        }

        .lesson-header-content {
          text-align: center;
          position: relative;
        }

        .lesson-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin: 0 0 0.25rem;
        }

        .lesson-subtitle {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
        }

        /* ========== Quick Actions ========== */
        .quick-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.9rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }

        .action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ========== Lessons Grid ========== */
        .lessons-grid {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 0.65rem;
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

        /* ========== Lesson Card ========== */
        .lesson-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem 1rem;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          animation: lessonAppear 0.3s ease-out var(--delay) both;
        }

        @keyframes lessonAppear {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .lesson-card:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }

        .lesson-card.selected {
          background: rgba(var(--accent-rgb, 16, 185, 129), 0.15);
          border-color: var(--accent);
          box-shadow: 0 0 20px -5px var(--glow);
        }

        .lesson-card:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .check-box {
          width: 22px;
          height: 22px;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .check-box.checked {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
          box-shadow: 0 2px 8px var(--glow);
        }

        .lesson-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .lesson-name {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          font-size: 0.9rem;
        }

        .lesson-count {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* ========== Footer ========== */
        .lesson-footer {
          padding: 1rem 1.25rem;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .start-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 1rem 1.5rem;
          background: var(--btn-gradient);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 1rem;
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
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-count {
          background: rgba(255, 255, 255, 0.25);
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        /* ========== Responsive ========== */
        @media (max-width: 768px) {
          .selector-container {
            padding: 1.5rem 1rem;
            gap: 1.5rem;
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
            gap: 0.5rem;
          }

          .level-card {
            padding: 1rem 0.5rem;
            border-radius: 14px;
          }

          .level-card .card-icon {
            font-size: 1.5rem;
          }

          .level-card .card-level {
            font-size: 1.25rem;
          }

          .level-card .card-count {
            font-size: 0.65rem;
          }

          .lessons-grid {
            grid-template-columns: 1fr;
            padding: 0.75rem;
          }
        }

        @media (max-width: 480px) {
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

          .header-stats {
            gap: 0.75rem;
          }

          .stat-item {
            font-size: 0.75rem;
          }

          .levels-grid {
            gap: 0.35rem;
          }

          .level-card {
            padding: 0.85rem 0.35rem;
            border-radius: 12px;
          }

          .level-card .card-icon {
            font-size: 1.25rem;
            margin-bottom: 0.1rem;
          }

          .level-card .card-level {
            font-size: 1.1rem;
          }

          .level-card .card-count {
            font-size: 0.6rem;
          }

          .lesson-header {
            padding: 0.85rem 1rem 1rem;
          }

          .lesson-title {
            font-size: 1.25rem;
          }

          .lesson-footer {
            padding: 0.85rem;
          }

          .start-btn {
            padding: 0.85rem 1.25rem;
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  );
}
