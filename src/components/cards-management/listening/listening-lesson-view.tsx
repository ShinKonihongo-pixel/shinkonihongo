// Lesson view showing lesson type selector
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LEVEL_THEMES } from '../../../constants/themes';
import { LESSON_TYPES, LESSON_TYPE_THEMES } from './listening-tab-types';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ListeningLessonType } from '../../../types/listening';

interface ListeningLessonViewProps {
  level: JLPTLevel;
  lessonNumber: number;
  onBack: () => void;
  onSelectLessonType: (lessonType: ListeningLessonType) => void;
  getCountByLessonType: (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => number;
  audioRef: React.RefObject<HTMLAudioElement>;
  onAudioEnded: () => void;
  sharedStyles: string;
}

export function ListeningLessonView({
  level,
  lessonNumber,
  onBack,
  onSelectLessonType,
  getCountByLessonType,
  audioRef,
  onAudioEnded,
  sharedStyles,
}: ListeningLessonViewProps) {
  const theme = LEVEL_THEMES[level];

  return (
    <div className="listening-tab">
      <div className="nav-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={18} /> {level}
        </button>
        <span className="current-level" style={{ background: theme.gradient }}>
          Bài {lessonNumber}
        </span>
        <h3>Chọn loại</h3>
      </div>

      <div className="lesson-type-grid">
        {LESSON_TYPES.map((type, idx) => {
          const typeTheme = LESSON_TYPE_THEMES[type.value];
          const count = getCountByLessonType(level, lessonNumber, type.value);
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              className="lesson-type-card"
              onClick={() => onSelectLessonType(type.value)}
              style={{
                '--card-delay': `${idx * 0.1}s`,
                '--type-gradient': typeTheme.gradient,
                '--type-glow': typeTheme.glow,
              } as React.CSSProperties}
            >
              <div className="type-icon">
                <Icon size={24} />
              </div>
              <span className="type-name">{type.label}</span>
              <span className="type-count">{count} file</span>
              <ChevronRight size={18} className="type-arrow" />
              <div className="card-shine" />
            </button>
          );
        })}
      </div>

      <audio ref={audioRef} onEnded={onAudioEnded} />
      <style>{sharedStyles}</style>
    </div>
  );
}
