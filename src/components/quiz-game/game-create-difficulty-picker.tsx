/**
 * DifficultyPicker — pill row for selecting game difficulty in flashcard modes.
 */

import { Layers } from 'lucide-react';
import type { GameDifficultyLevel } from '../../types/quiz-game';
import { DIFFICULTY_OPTIONS } from './game-create-types';

interface DifficultyPickerProps {
  selectedDifficulty: GameDifficultyLevel | null;
  canFulfillDifficulty: Record<GameDifficultyLevel, boolean>;
  onToggleDifficulty: (diff: GameDifficultyLevel) => void;
}

export function DifficultyPicker({
  selectedDifficulty,
  canFulfillDifficulty,
  onToggleDifficulty,
}: DifficultyPickerProps) {
  return (
    <div className="rm-field">
      <label className="rm-label">
        <Layers size={16} />
        <span>Mức độ</span>
      </label>
      <div className="rm-pills">
        {DIFFICULTY_OPTIONS.map(opt => {
          const canFulfill = canFulfillDifficulty[opt.value];
          const isSelected = selectedDifficulty === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`rm-pill ${isSelected ? 'active' : ''}`}
              disabled={!canFulfill}
              onClick={() => canFulfill && onToggleDifficulty(opt.value)}
              style={isSelected ? { background: opt.color, borderColor: opt.color } : undefined}
              title={canFulfill ? 'Đủ câu hỏi' : 'Chưa đủ câu hỏi cho mức độ này'}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <span className="rm-filter-hint">Không chọn = tất cả mức độ</span>
    </div>
  );
}
