import { Check } from 'lucide-react';
import type { BaseLesson, JLPTLevel } from './types';
import { LEVEL_THEMES } from './constants';

interface LessonCardProps {
  lesson: BaseLesson;
  type: 'vocabulary' | 'grammar' | 'kanji';
  selectedLevel: JLPTLevel;
  isSelected: boolean;
  cardCount: number;
  index: number;
  onToggle: (lessonId: string) => void;
}

export function LessonCard({
  lesson,
  type,
  selectedLevel,
  isSelected,
  cardCount,
  index,
  onToggle,
}: LessonCardProps) {
  const disabled = cardCount === 0;

  return (
    <button
      className={`lesson-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      style={{
        '--accent': LEVEL_THEMES[selectedLevel].accent,
        '--glow': LEVEL_THEMES[selectedLevel].glow,
        '--delay': `${index * 0.05}s`,
      } as React.CSSProperties}
      onClick={() => !disabled && onToggle(lesson.id)}
      disabled={disabled}
    >
      <div className={`check-box ${isSelected ? 'checked' : ''}`}>
        {isSelected && <Check size={14} strokeWidth={3} />}
      </div>
      <div className="lesson-info">
        <span className="lesson-name">{lesson.name}</span>
        <span className="lesson-count">
          {cardCount} {type === 'vocabulary' ? 'từ vựng' : type === 'grammar' ? 'mẫu câu' : 'chữ kanji'}
        </span>
      </div>
    </button>
  );
}
