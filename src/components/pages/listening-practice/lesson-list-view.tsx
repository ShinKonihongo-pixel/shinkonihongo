// Lesson List View - Shows lessons for selected JLPT level
import { ChevronLeft, Headphones, BookOpen, CheckCircle2 } from 'lucide-react';
import type { JLPTLevel, Lesson } from '../../../types/flashcard';
import { LEVEL_THEMES } from '../../ui/jlpt-level-selector';

interface LessonListViewProps {
  selectedLevel: JLPTLevel;
  lessons: Lesson[];
  totalCards: number;
  onBack: () => void;
  onSelectLesson: (lessonId: string) => void;
  getCardCountForLesson: (lessonId: string) => number;
  getLearnedCountForLesson: (lessonId: string) => number;
}

export function LessonListView({
  selectedLevel,
  lessons,
  totalCards,
  onBack,
  onSelectLesson,
  getCardCountForLesson,
  getLearnedCountForLesson,
}: LessonListViewProps) {
  return (
    <div className="lesson-list-mode">
      <header
        className="lesson-list-header"
        style={{
          '--header-gradient': LEVEL_THEMES[selectedLevel].gradient,
          '--header-glow': LEVEL_THEMES[selectedLevel].glow,
        } as React.CSSProperties}
      >
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>
            <ChevronLeft size={20} />
          </button>
          <div className="level-badge desktop-level">
            <span>{selectedLevel}</span>
          </div>
          <span className="mobile-lesson-info">
            <Headphones size={18} />
            <span className="mobile-lesson-name">Luyện nghe {selectedLevel}</span>
          </span>
          <div className="header-info">
            <h2>Chọn bài học</h2>
            <p>{lessons.length} bài học • {totalCards} từ vựng</p>
          </div>
        </div>
      </header>

      <div className="lessons-premium-grid">
        {lessons.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>Chưa có bài học nào cho cấp độ này</p>
          </div>
        ) : (
          lessons.map((lesson, idx) => {
            const totalCount = getCardCountForLesson(lesson.id);
            const learnedCount = getLearnedCountForLesson(lesson.id);
            const progress = totalCount > 0 ? (learnedCount / totalCount) * 100 : 0;
            const isComplete = learnedCount === totalCount && totalCount > 0;

            return (
              <button
                key={lesson.id}
                className={`lesson-premium-card ${isComplete ? 'complete' : ''}`}
                onClick={() => onSelectLesson(lesson.id)}
                style={{
                  '--card-delay': `${idx * 0.05}s`,
                  '--accent': LEVEL_THEMES[selectedLevel].accent,
                  '--glow': LEVEL_THEMES[selectedLevel].glow,
                } as React.CSSProperties}
                disabled={totalCount === 0}
              >
                <div className="card-header">
                  <div className="lesson-icon-wrapper">
                    <Headphones size={20} />
                  </div>
                  {isComplete && (
                    <div className="complete-badge">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <span className="lesson-name">{lesson.name}</span>
                  <span className="lesson-count">{totalCount} từ vựng</span>
                </div>
                <div className="card-footer">
                  <div className="progress-bar-mini">
                    <div className="progress-fill-mini" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="progress-label">{learnedCount}/{totalCount}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
