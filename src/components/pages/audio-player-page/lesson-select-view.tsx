// Lesson Select View - Choose lesson number within a JLPT level

import { ChevronLeft, Music } from 'lucide-react';
import { LEVEL_THEMES } from '../../../constants/themes';
import type { JLPTLevel } from '../../../types/flashcard';

interface LessonSelectViewProps {
  selectedLevel: JLPTLevel;
  lessonNumbers: number[];
  getCountByLesson: (level: JLPTLevel, lessonNumber: number) => number;
  onSelectLesson: (lessonNumber: number) => void;
  onBack: () => void;
}

export function LessonSelectView({
  selectedLevel,
  lessonNumbers,
  getCountByLesson,
  onSelectLesson,
  onBack,
}: LessonSelectViewProps) {
  const theme = LEVEL_THEMES[selectedLevel];

  return (
    <div className="practice-content">
      <div className="practice-header">
        <button className="btn-back" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <span className="current-level" style={{ background: theme.gradient }}>
          {selectedLevel}
        </span>
        <h2 className="page-title">Chọn bài học</h2>
      </div>

      {lessonNumbers.length === 0 ? (
        <div className="empty-state">
          <Music size={48} />
          <p>Chưa có bài học cho cấp độ này</p>
          <p className="hint">N3, N2, N1 sẽ được thêm sau</p>
        </div>
      ) : (
        <div className="lesson-grid">
          {lessonNumbers.map((num, idx) => {
            const count = getCountByLesson(selectedLevel, num);
            return (
              <button
                key={num}
                className="lesson-card"
                onClick={() => onSelectLesson(num)}
                style={{
                  '--card-delay': `${Math.min(idx * 0.03, 0.5)}s`,
                  '--level-gradient': theme.gradient,
                  '--level-glow': theme.glow,
                } as React.CSSProperties}
              >
                <span className="lesson-number">{num}</span>
                <span className="lesson-label">Bài</span>
                {count > 0 && <span className="lesson-count">{count} file</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
