import { Pin, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { FuriganaText } from '../../ui/furigana-text';
import type { ReadingPassage, ReadingQuestion } from '../../../types/reading';

interface QuestionPanelProps {
  selectedPassage: ReadingPassage;
  currentQuestion: ReadingQuestion;
  currentQuestionIndex: number;
  selectedAnswer: number | undefined;
  selectedAnswers: Record<number, number>;
  showResults: boolean;
  isMobile: boolean;
  isPinned: boolean;
  theme: { gradient: string };
  settings: { fontSize: number; textColor?: string };
  onSetCurrentQuestion: (index: number) => void;
  onSetShowResults: (show: boolean) => void;
  onSetPinned: (pinned: boolean) => void;
  onSelectAnswer: (index: number) => void;
  onShowResult: () => void;
  onNext: () => void;
}

export function QuestionPanel({
  selectedPassage,
  currentQuestion,
  currentQuestionIndex,
  selectedAnswer,
  selectedAnswers,
  showResults,
  isMobile,
  isPinned,
  theme,
  settings,
  onSetCurrentQuestion,
  onSetShowResults,
  onSetPinned,
  onSelectAnswer,
  onShowResult,
  onNext,
}: QuestionPanelProps) {
  return (
    <div className="question-panel">
      <div className="question-card-simple">
        <div className="question-simple-header">
          <div className="question-info">
            <span className="question-current" style={{ background: theme.gradient }}>
              {currentQuestionIndex + 1}/{selectedPassage.questions.length}
            </span>
            <div className="question-dots">
              {selectedPassage.questions.map((_, idx) => {
                const answered = selectedAnswers[idx] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                const answerLetter = answered ? String.fromCharCode(65 + selectedAnswers[idx]) : '';
                return (
                  <button
                    key={idx}
                    className={`q-dot ${isCurrent ? 'current' : ''} ${answered ? 'answered' : ''}`}
                    onClick={() => { onSetCurrentQuestion(idx); onSetShowResults(false); }}
                    title={`Câu ${idx + 1}${answered ? ` - ${answerLetter}` : ''}`}
                  >
                    {answered ? answerLetter : ''}
                  </button>
                );
              })}
            </div>
          </div>
          {isMobile && !isPinned && (
            <button className="btn-pin-simple" onClick={() => onSetPinned(true)}>
              <Pin size={14} />
            </button>
          )}
        </div>

        <div className="question-body-simple">
          <div className="question-content-simple">
            <p className="question-text-simple" style={{ fontSize: `${settings.fontSize}rem`, color: settings.textColor || 'white' }}>
              <FuriganaText text={currentQuestion.question} />
            </p>
          </div>

          <div className="answers-simple">
            {currentQuestion.answers.map((answer, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = answer.isCorrect;
              let cls = 'answer-simple';
              if (showResults) {
                if (isCorrect) cls += ' correct';
                else if (isSelected && !isCorrect) cls += ' incorrect';
              } else if (isSelected) {
                cls += ' selected';
              }

              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => onSelectAnswer(idx)}
                  disabled={showResults}
                >
                  <span className="answer-letter-simple">{String.fromCharCode(65 + idx)}</span>
                  <span className="answer-text-simple" style={{ fontSize: `${settings.fontSize * 0.9}rem` }}>
                    <FuriganaText text={answer.text} />
                  </span>
                  {showResults && isCorrect && <CheckCircle size={16} className="icon-ok" />}
                  {showResults && isSelected && !isCorrect && <XCircle size={16} className="icon-no" />}
                </button>
              );
            })}
          </div>

          {showResults && currentQuestion.explanation && (
            <div className="explanation-simple">
              <Sparkles size={14} />
              <span>{currentQuestion.explanation}</span>
            </div>
          )}
        </div>

        <div className="actions-simple">
          {!showResults ? (
            <button
              className="btn-simple btn-check-simple"
              onClick={onShowResult}
              disabled={selectedAnswer === undefined}
              style={{ background: theme.gradient }}
            >
              Kiểm tra
            </button>
          ) : (
            <>
              {currentQuestionIndex < selectedPassage.questions.length - 1 ? (
                <button
                  className="btn-simple btn-next-simple"
                  onClick={onNext}
                  style={{ background: theme.gradient }}
                >
                  Tiếp
                </button>
              ) : (
                Object.keys(selectedAnswers).length === selectedPassage.questions.length && (
                  <button
                    className="btn-simple btn-next-simple"
                    onClick={onNext}
                    style={{ background: theme.gradient }}
                  >
                    Kết quả
                  </button>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
