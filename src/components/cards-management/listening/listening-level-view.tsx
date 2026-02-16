// Level view showing lesson number grid
import { ChevronLeft, Music } from 'lucide-react';
import { LEVEL_THEMES } from '../../../constants/themes';
import { LISTENING_LESSONS } from '../../../hooks/use-listening';
import type { JLPTLevel } from '../../../types/flashcard';
import './listening-shared.css';

interface ListeningLevelViewProps {
  level: JLPTLevel;
  onBack: () => void;
  onSelectLesson: (lessonNumber: number) => void;
  getCountByLesson: (level: JLPTLevel, lessonNumber: number) => number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onAudioEnded: () => void;
}

export function ListeningLevelView({
  level,
  onBack,
  onSelectLesson,
  getCountByLesson,
  audioRef,
  onAudioEnded,
}: ListeningLevelViewProps) {
  const theme = LEVEL_THEMES[level];
  
  // Get lesson numbers for current level
  const getLessonNumbers = (lvl: JLPTLevel): number[] => {
    const config = LISTENING_LESSONS[lvl];
    if (!config) return [];
    const numbers: number[] = [];
    for (let i = config.start; i <= config.end; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  const lessonNumbers = getLessonNumbers(level);

  return (
    <div className="listening-tab">
      <div className="nav-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={18} /> Quay lại
        </button>
        <span className="current-level" style={{ background: theme.gradient }}>
          {level}
        </span>
        <h3>Chọn bài học</h3>
      </div>

      {lessonNumbers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Music size={48} strokeWidth={1} />
          </div>
          <p>Chưa có bài học cho cấp độ này</p>
          <span className="empty-hint">N3, N2, N1 sẽ được thêm sau</span>
        </div>
      ) : (
        <div className="lesson-grid">
          {lessonNumbers.map((num, idx) => {
            const count = getCountByLesson(level, num);
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
                <div className="card-shine" />
              </button>
            );
          })}
        </div>
      )}

      <audio ref={audioRef} onEnded={onAudioEnded} />
    </div>
  );
}
