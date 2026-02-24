// Lesson Select View - Choose lesson number within a JLPT level
// Scoped classes: ap-ls-* (audio player lesson select)

import { ArrowLeft, Headphones, Music } from 'lucide-react';
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
    <div className="ap-ls">
      {/* Header */}
      <header className="ap-ls-header" style={{
        '--ap-gradient': theme.gradient,
        '--ap-glow': theme.glow,
      } as React.CSSProperties}>
        <div className="ap-ls-header-inner">
          <button className="ap-ls-back" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <div className="ap-ls-badge" style={{ background: theme.gradient }}>
            {selectedLevel}
          </div>
          <div className="ap-ls-title">
            <h1>Chọn bài học</h1>
            <p>{lessonNumbers.length} bài • Luyện nghe hiểu</p>
          </div>
        </div>
        <div className="ap-ls-header-glow" />
      </header>

      {/* Grid */}
      {lessonNumbers.length === 0 ? (
        <div className="ap-ls-empty">
          <Music size={48} />
          <h3>Chưa có bài học cho cấp độ này</h3>
          <p>N3, N2, N1 sẽ được thêm sau</p>
        </div>
      ) : (
        <div className="ap-ls-grid">
          {lessonNumbers.map((num, idx) => {
            const count = getCountByLesson(selectedLevel, num);
            const hasContent = count > 0;
            return (
              <button
                key={num}
                className={`ap-ls-card ${hasContent ? 'has-content' : ''}`}
                onClick={() => onSelectLesson(num)}
                style={{
                  '--card-delay': `${Math.min(idx * 0.03, 0.5)}s`,
                  '--ap-gradient': theme.gradient,
                  '--ap-glow': theme.glow,
                } as React.CSSProperties}
              >
                {hasContent && <div className="ap-ls-accent" />}
                <div className="ap-ls-num">{num}</div>
                <div className="ap-ls-info">
                  <span className="ap-ls-name">Bài {num}</span>
                  <span className={`ap-ls-count ${hasContent ? 'active' : ''}`}>
                    {hasContent ? (
                      <><Headphones size={11} /> {count} file</>
                    ) : 'Trống'}
                  </span>
                </div>
                <div className="ap-ls-shine" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
