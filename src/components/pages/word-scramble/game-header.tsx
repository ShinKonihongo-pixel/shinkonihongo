import React from 'react';
import { X } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import { LEVEL_COLORS } from './word-scramble-constants';

interface GameHeaderProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  jlptLevel: JLPTLevel;
  onClose: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentQuestionIndex,
  totalQuestions,
  jlptLevel,
  onClose,
}) => {
  return (
    <div className="ws-game-topbar">
      <div className="ws-progress-info">
        <span className="ws-q-num">Câu {currentQuestionIndex + 1}/{totalQuestions}</span>
        <div
          className="ws-level-badge"
          style={{
            background: LEVEL_COLORS[jlptLevel]?.bg,
            color: LEVEL_COLORS[jlptLevel]?.text
          }}
        >
          {jlptLevel}
        </div>
      </div>
      <button className="ws-close-btn" onClick={onClose}>
        <X size={20} />
      </button>
    </div>
  );
};
