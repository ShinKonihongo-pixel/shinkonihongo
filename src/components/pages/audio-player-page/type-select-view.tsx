// Type Select View - Choose lesson type (practice, conversation, etc.)

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LEVEL_THEMES } from '../../../constants/themes';
import { LISTENING_LESSON_TYPES } from '../../../hooks/use-listening';
import { TYPE_ICONS, TYPE_THEMES } from './audio-player-types';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ListeningLessonType } from '../../../types/listening';

interface TypeSelectViewProps {
  selectedLevel: JLPTLevel;
  selectedLesson: number;
  getCountByLessonType: (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => number;
  onSelectType: (lessonType: ListeningLessonType) => void;
  onBack: () => void;
}

export function TypeSelectView({
  selectedLevel,
  selectedLesson,
  getCountByLessonType,
  onSelectType,
  onBack,
}: TypeSelectViewProps) {
  const theme = LEVEL_THEMES[selectedLevel];

  return (
    <div className="practice-content">
      <div className="practice-header">
        <button className="btn-back" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <span className="current-level" style={{ background: theme.gradient }}>
          {selectedLevel} - Bài {selectedLesson}
        </span>
        <h2 className="page-title">Chọn loại</h2>
      </div>

      <div className="type-grid">
        {LISTENING_LESSON_TYPES.map((type, idx) => {
          const typeTheme = TYPE_THEMES[type.value];
          const Icon = TYPE_ICONS[type.value];
          const count = getCountByLessonType(selectedLevel, selectedLesson, type.value);
          return (
            <button
              key={type.value}
              className="type-card"
              onClick={() => onSelectType(type.value)}
              style={{
                '--card-delay': `${idx * 0.1}s`,
                '--type-gradient': typeTheme.gradient,
                '--type-glow': typeTheme.glow,
              } as React.CSSProperties}
            >
              <div className="type-icon-box">
                <Icon size={24} />
              </div>
              <span className="type-name">{type.label}</span>
              <span className="type-count">{count} file</span>
              <ChevronRight size={18} className="type-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
