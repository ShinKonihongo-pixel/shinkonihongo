// Level and lesson selection component for study pages
// Shows level selection first, then lessons for selected level

import { useState, useMemo } from 'react';
import { ChevronRight, Check, BookOpen, Layers, Play, Home } from 'lucide-react';
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

const LEVEL_COLORS: Record<JLPTLevel, { bg: string; border: string; text: string }> = {
  N5: { bg: '#ecfdf5', border: '#10b981', text: '#059669' },
  N4: { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb' },
  N3: { bg: '#fef3c7', border: '#f59e0b', text: '#d97706' },
  N2: { bg: '#fce7f3', border: '#ec4899', text: '#db2777' },
  N1: { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' },
};

export function LevelLessonSelector({
  type,
  cards,
  getLessonsByLevel,
  getChildLessons,
  onStart,
  onGoHome,
}: LevelLessonSelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);

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
    // Only show parent lessons (no parentId or parentId is null)
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

  // Toggle lesson selection
  const toggleLesson = (lessonId: string) => {
    setSelectedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  // Select all lessons
  const selectAllLessons = () => {
    setSelectedLessons(levelLessons.map(l => l.id));
  };

  // Deselect all
  const deselectAllLessons = () => {
    setSelectedLessons([]);
  };

  // Handle start
  const handleStart = () => {
    if (selectedLevel && selectedLessons.length > 0) {
      onStart(selectedLessons, selectedLevel);
    }
  };

  // Back to level selection
  const backToLevelSelect = () => {
    setSelectedLevel(null);
    setSelectedLessons([]);
  };

  return (
    <div className="level-lesson-selector">
      {/* Level Selection Screen */}
      {!selectedLevel && (
        <div className="selector-screen">
          <div className="selector-card">
            <div className="selector-header">
              <div className="selector-icon">
                {type === 'vocabulary' ? <Layers size={32} /> : <BookOpen size={32} />}
              </div>
              <h1>{type === 'vocabulary' ? 'Học Từ Vựng' : 'Học Ngữ Pháp'}</h1>
              <p className="selector-subtitle">Chọn cấp độ JLPT để bắt đầu</p>
            </div>

            <div className="level-grid">
              {JLPT_LEVELS.map(level => {
                const colors = LEVEL_COLORS[level];
                const count = countByLevel[level];
                const disabled = count === 0;

                return (
                  <button
                    key={level}
                    className={`level-card ${disabled ? 'disabled' : ''}`}
                    style={{
                      '--level-bg': colors.bg,
                      '--level-border': colors.border,
                      '--level-text': colors.text,
                    } as React.CSSProperties}
                    onClick={() => !disabled && setSelectedLevel(level)}
                    disabled={disabled}
                  >
                    <span className="level-name">{level}</span>
                    <span className="level-count">{count} {type === 'vocabulary' ? 'từ' : 'mẫu'}</span>
                    <ChevronRight size={20} className="level-arrow" />
                  </button>
                );
              })}
            </div>

            <div className="selector-footer">
              <button className="selector-btn ghost" onClick={onGoHome}>
                <Home size={18} /> Trang chủ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Selection Screen */}
      {selectedLevel && (
        <div className="selector-screen">
          <div className="selector-card lesson-card">
            <div className="selector-header compact">
              <button className="back-btn" onClick={backToLevelSelect}>
                ← Chọn lại cấp độ
              </button>
              <div className="level-badge" style={{
                background: LEVEL_COLORS[selectedLevel].bg,
                color: LEVEL_COLORS[selectedLevel].text,
                borderColor: LEVEL_COLORS[selectedLevel].border,
              }}>
                {selectedLevel}
              </div>
              <h2>Chọn bài học</h2>
              <p className="selector-subtitle">
                {selectedLessons.length > 0
                  ? `Đã chọn ${selectedLessons.length} bài (${totalSelectedCards} ${type === 'vocabulary' ? 'từ' : 'mẫu'})`
                  : 'Chọn một hoặc nhiều bài để học'}
              </p>
            </div>

            {/* Quick actions */}
            <div className="quick-actions">
              <button className="quick-btn" onClick={selectAllLessons}>
                Chọn tất cả
              </button>
              <button className="quick-btn" onClick={deselectAllLessons} disabled={selectedLessons.length === 0}>
                Bỏ chọn
              </button>
            </div>

            {/* Lessons list */}
            <div className="lessons-list">
              {levelLessons.length === 0 ? (
                <div className="empty-lessons">
                  <p>Không có bài học nào cho cấp độ này</p>
                </div>
              ) : (
                levelLessons.map(lesson => {
                  const isSelected = selectedLessons.includes(lesson.id);
                  const cardCount = cardsPerLesson[lesson.id] || 0;

                  return (
                    <button
                      key={lesson.id}
                      className={`lesson-item ${isSelected ? 'selected' : ''} ${cardCount === 0 ? 'disabled' : ''}`}
                      onClick={() => cardCount > 0 && toggleLesson(lesson.id)}
                      disabled={cardCount === 0}
                    >
                      <div className="lesson-check">
                        {isSelected && <Check size={16} />}
                      </div>
                      <div className="lesson-info">
                        <span className="lesson-name">{lesson.name}</span>
                        <span className="lesson-count">{cardCount} {type === 'vocabulary' ? 'từ' : 'mẫu'}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="selector-footer">
              <button className="selector-btn ghost" onClick={onGoHome}>
                <Home size={18} /> Thoát
              </button>
              <button
                className="selector-btn primary"
                onClick={handleStart}
                disabled={selectedLessons.length === 0}
              >
                <Play size={18} /> Bắt đầu học ({totalSelectedCards} {type === 'vocabulary' ? 'từ' : 'mẫu'})
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .level-lesson-selector {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .selector-screen {
          width: 100%;
          max-width: 500px;
        }

        .selector-card {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }

        .selector-card.lesson-card {
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }

        .selector-header {
          padding: 2rem 2rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          text-align: center;
          color: white;
        }

        .selector-header.compact {
          padding: 1.5rem 2rem 1rem;
        }

        .selector-icon {
          width: 64px;
          height: 64px;
          background: rgba(255,255,255,0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .selector-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0;
        }

        .selector-header h2 {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 0.75rem 0 0;
        }

        .selector-subtitle {
          color: rgba(255,255,255,0.85);
          margin: 0.5rem 0 0;
          font-size: 0.95rem;
        }

        .back-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
          margin-bottom: 0.75rem;
        }

        .back-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .level-badge {
          display: inline-block;
          padding: 0.35rem 1rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 2px solid;
          margin-bottom: 0.5rem;
        }

        .level-grid {
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .level-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--level-bg);
          border: 2px solid var(--level-border);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .level-card:hover:not(:disabled) {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .level-card:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .level-name {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--level-text);
        }

        .level-count {
          flex: 1;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .level-arrow {
          color: var(--level-text);
        }

        .quick-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .quick-btn {
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #4b5563;
          cursor: pointer;
        }

        .quick-btn:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .quick-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lessons-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 350px;
        }

        .empty-lessons {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .lesson-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          background: #f9fafb;
          border: 2px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .lesson-item:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .lesson-item.selected {
          background: #ecfdf5;
          border-color: #10b981;
        }

        .lesson-item:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .lesson-check {
          width: 24px;
          height: 24px;
          border: 2px solid #d1d5db;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          flex-shrink: 0;
        }

        .lesson-item.selected .lesson-check {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .lesson-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .lesson-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.95rem;
        }

        .lesson-count {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .selector-footer {
          display: flex;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .selector-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 1.25rem;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .selector-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .selector-btn.ghost {
          background: transparent;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }

        .selector-btn.ghost:hover {
          background: #f3f4f6;
        }

        .selector-btn.primary {
          flex: 1;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(16,185,129,0.4);
        }

        .selector-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16,185,129,0.5);
        }

        @media (max-width: 640px) {
          .selector-header {
            padding: 1.5rem;
          }

          .level-grid {
            padding: 1rem 1.5rem;
          }

          .selector-footer {
            flex-direction: column;
          }

          .selector-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
