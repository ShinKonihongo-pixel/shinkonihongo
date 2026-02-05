import { ChevronRight, Check, BookOpen, Play } from 'lucide-react';
import type { JLPTLevel, BaseLesson } from './types';
import { LEVEL_THEMES } from './constants';
import { LessonCard } from './lesson-card';

interface LessonSelectorProps {
  type: 'vocabulary' | 'grammar';
  selectedLevel: JLPTLevel;
  levelLessons: BaseLesson[];
  selectedLessons: string[];
  cardsPerLesson: Record<string, number>;
  totalSelectedCards: number;
  onBack: () => void;
  onToggleLesson: (lessonId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStart: () => void;
}

export function LessonSelector({
  type,
  selectedLevel,
  levelLessons,
  selectedLessons,
  cardsPerLesson,
  totalSelectedCards,
  onBack,
  onToggleLesson,
  onSelectAll,
  onDeselectAll,
  onStart,
}: LessonSelectorProps) {
  const availableLessons = levelLessons.filter(l => (cardsPerLesson[l.id] || 0) > 0);
  const allSelected = selectedLessons.length === availableLessons.length;

  return (
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
            <button className="back-btn" onClick={onBack}>
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
              className={`header-btn select-all ${allSelected ? 'active' : ''}`}
              onClick={onSelectAll}
            >
              <Check size={14} />
              <span>Chọn tất cả</span>
            </button>
            <button
              className="header-btn deselect"
              onClick={onDeselectAll}
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
          levelLessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              type={type}
              selectedLevel={selectedLevel}
              isSelected={selectedLessons.includes(lesson.id)}
              cardCount={cardsPerLesson[lesson.id] || 0}
              index={index}
              onToggle={onToggleLesson}
            />
          ))
        )}
      </div>

      {/* Footer - Only Start Button */}
      <footer className="lesson-footer">
        <button
          className="start-btn"
          onClick={onStart}
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
  );
}
