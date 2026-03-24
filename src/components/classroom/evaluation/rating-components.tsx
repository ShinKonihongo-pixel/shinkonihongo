// Reusable rating and level components

import { Star } from 'lucide-react';
import type { EvaluationRating, EvaluationLevel } from '../../../types/classroom';
import { EVALUATION_RATING_LABELS, EVALUATION_LEVEL_INFO } from './evaluation-types';
import { getPointsLevel } from './evaluation-types';

// Rating star component
export function RatingStars({ rating, onChange, readonly = false }: {
  rating: EvaluationRating | 0;
  onChange?: (rating: EvaluationRating) => void;
  readonly?: boolean;
}) {
  return (
    <div className={`rating-stars ${readonly ? 'readonly' : ''}`}>
      {[1, 2, 3, 4, 5].map(value => (
        <button
          key={value}
          type="button"
          className={`star-btn ${value <= rating ? 'filled' : ''}`}
          onClick={() => !readonly && onChange?.(value as EvaluationRating)}
          disabled={readonly}
        >
          <Star size={18} fill={value <= rating ? '#f39c12' : 'none'} />
        </button>
      ))}
      {rating > 0 && (
        <span className="rating-label">{EVALUATION_RATING_LABELS[rating as EvaluationRating]}</span>
      )}
    </div>
  );
}

// Level selector buttons
export function LevelSelector({ onSelect, currentPoints, maxPoints }: {
  onSelect: (level: EvaluationLevel) => void;
  currentPoints: number;
  maxPoints: number;
}) {
  const currentLevel = getPointsLevel(currentPoints, maxPoints);

  return (
    <div className="level-selector">
      {(Object.entries(EVALUATION_LEVEL_INFO) as [EvaluationLevel, typeof EVALUATION_LEVEL_INFO[EvaluationLevel]][]).map(([level, info]) => (
        <button
          key={level}
          type="button"
          className={`level-btn-mini ${currentLevel === level ? 'active' : ''}`}
          style={{ '--level-color': info.color } as React.CSSProperties}
          onClick={() => onSelect(level)}
          title={`${info.pointRange[0]}-${info.pointRange[1]} điểm`}
        >
          {info.label}
        </button>
      ))}
    </div>
  );
}

// Suggestion chip component
export function SuggestionChip({ text, onClick, selected }: {
  text: string;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      className={`suggestion-chip ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

// Student stats display component
export function StudentStats({ grade, attendance }: {
  grade?: { averagePercent?: number; testsCompleted?: number; assignmentsCompleted?: number };
  attendance?: { attendanceRate?: number };
}) {
  return (
    <div className="student-stats-preview">
      <div className="stat-item">
        <span className="stat-label">Điểm TB:</span>
        <span className={`stat-value ${(grade?.averagePercent || 0) >= 50 ? 'good' : 'poor'}`}>
          {grade?.averagePercent?.toFixed(0) || 0}%
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Bài nộp:</span>
        <span className="stat-value">{(grade?.testsCompleted || 0) + (grade?.assignmentsCompleted || 0)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Chuyên cần:</span>
        <span className={`stat-value ${(attendance?.attendanceRate || 0) >= 80 ? 'good' : 'poor'}`}>
          {attendance?.attendanceRate?.toFixed(0) || 0}%
        </span>
      </div>
    </div>
  );
}
