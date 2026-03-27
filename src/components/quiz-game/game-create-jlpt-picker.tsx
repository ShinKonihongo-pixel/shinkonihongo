/**
 * JLPTPicker — level filter pills for JLPT question source mode.
 */

import { Layers } from 'lucide-react';
import type { JLPTQuestion } from '../../types/jlpt-question';
import { JLPT_QUESTION_LEVELS } from './game-create-types';

interface JLPTPickerProps {
  jlptQuestions: JLPTQuestion[];
  selectedJLPTLevels: string[];
  availableJLPTQuestions: number;
  onToggleLevel: (level: string) => void;
}

export function JLPTPicker({
  jlptQuestions,
  selectedJLPTLevels,
  availableJLPTQuestions,
  onToggleLevel,
}: JLPTPickerProps) {
  return (
    <div className="rm-field">
      <label className="rm-label">
        <Layers size={16} />
        <span>Chọn phạm vi câu hỏi</span>
      </label>
      <div className="rm-pills">
        {JLPT_QUESTION_LEVELS.map(level => {
          const count = jlptQuestions.filter(q => q.level === level).length;
          return (
            <button
              key={level}
              type="button"
              className={`rm-pill ${selectedJLPTLevels.includes(level) ? 'active' : ''}`}
              onClick={() => onToggleLevel(level)}
              data-level={level}
            >
              {level}
              <span className="rm-pill-count">{count}</span>
            </button>
          );
        })}
      </div>
      <span className="rm-filter-hint">Không chọn = tất cả cấp độ</span>

      {availableJLPTQuestions < 4 && (
        <div className="rm-error" style={{ marginTop: 'var(--rm-space-sm)' }}>
          <span>⚠️</span>
          <span>Cần ít nhất 4 câu hỏi JLPT để tạo game</span>
        </div>
      )}
    </div>
  );
}
