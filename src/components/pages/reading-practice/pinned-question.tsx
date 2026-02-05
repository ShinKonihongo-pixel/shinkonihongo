import { Pin, PinOff, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import type { ReadingQuestion } from '../../../types/reading';

interface PinnedQuestionProps {
  currentQuestion: ReadingQuestion;
  currentQuestionIndex: number;
  selectedAnswer: number | undefined;
  showResults: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUnpin: () => void;
  onSelectAnswer: (index: number) => void;
  onShowResult: () => void;
  onNext: () => void;
  isLastQuestion: boolean;
}

export function PinnedQuestion({
  currentQuestion,
  currentQuestionIndex,
  selectedAnswer,
  showResults,
  isCollapsed,
  onToggleCollapse,
  onUnpin,
  onSelectAnswer,
  onShowResult,
  onNext,
  isLastQuestion,
}: PinnedQuestionProps) {
  return (
    <div className={`pinned-question ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="pinned-header" onClick={onToggleCollapse}>
        <span className="pinned-label">
          <Pin size={14} /> Câu {currentQuestionIndex + 1}
        </span>
        <div className="pinned-actions">
          <button className="btn-unpin" onClick={(e) => { e.stopPropagation(); onUnpin(); }}>
            <PinOff size={14} />
          </button>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>
      {!isCollapsed && (
        <div className="pinned-content">
          <p className="pinned-text">{currentQuestion.question}</p>
          <div className="pinned-answers">
            {currentQuestion.answers.map((answer, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = answer.isCorrect;
              let cls = 'pinned-answer';
              if (showResults) {
                if (isCorrect) cls += ' correct';
                else if (isSelected && !isCorrect) cls += ' incorrect';
              } else if (isSelected) {
                cls += ' selected';
              }
              return (
                <button key={idx} className={cls} onClick={() => onSelectAnswer(idx)} disabled={showResults}>
                  <span className="ans-letter">{String.fromCharCode(65 + idx)}</span>
                  <span className="ans-text">{answer.text}</span>
                  {showResults && isCorrect && <CheckCircle size={14} className="icon-correct" />}
                  {showResults && isSelected && !isCorrect && <XCircle size={14} className="icon-incorrect" />}
                </button>
              );
            })}
          </div>
          <div className="pinned-btns">
            {!showResults ? (
              <button className="btn-check-pin" onClick={onShowResult} disabled={selectedAnswer === undefined}>
                Kiểm tra
              </button>
            ) : (
              <button className="btn-next-pin" onClick={onNext}>
                {isLastQuestion ? 'Kết quả' : 'Tiếp'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
