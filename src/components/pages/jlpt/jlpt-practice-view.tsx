// JLPT Practice View - Active quiz session with question display and answer selection
import { CheckCircle, XCircle } from 'lucide-react';
import type { JLPTQuestion, QuestionCategory } from '../../../types/jlpt-question';
import { ANSWER_OPTIONS } from '../../../constants/answer-options';
import { QUESTION_CATEGORIES } from './jlpt-constants';

export interface JLPTPracticeViewProps {
  // Current question state
  practiceQuestions: JLPTQuestion[];
  currentIndex: number;
  selectedAnswer: number | null;
  showResult: boolean;

  // Results tracking
  correctCount: number;
  totalAnswered: number;

  // Settings
  showExplanation: boolean;

  // Actions
  onSelectAnswer: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function JLPTPracticeView({
  practiceQuestions,
  currentIndex,
  selectedAnswer,
  showResult,
  correctCount,
  totalAnswered,
  showExplanation,
  onSelectAnswer,
  onSubmit,
  onNext,
  onReset,
}: JLPTPracticeViewProps) {
  const currentQuestion = practiceQuestions[currentIndex];

  const getCategoryLabel = (category: QuestionCategory) =>
    QUESTION_CATEGORIES.find(c => c.value === category)?.label || category;

  return (
    <div className="jlpt-page">
      <div className="jlpt-container">
        <div className="jlpt-practice">
          <div className="practice-header">
            <span className="practice-progress">
              Câu {currentIndex + 1} / {practiceQuestions.length}
            </span>
            <div className="practice-score">
              <span className="score-correct">✓ {correctCount}</span>
              <span className="score-wrong">✗ {totalAnswered - correctCount}</span>
            </div>
          </div>

          <div className="practice-question-card">
            <div className="question-meta">
              <span className="question-level">{currentQuestion.level}</span>
              <span className="question-category">{getCategoryLabel(currentQuestion.category)}</span>
            </div>

            <p className="question-text">{currentQuestion.question}</p>

            <div className="practice-answers">
              {currentQuestion.answers.map((answer, index) => (
                <button
                  key={index}
                  className={`practice-answer-btn ${selectedAnswer === index ? 'selected' : ''} ${
                    showResult
                      ? answer.isCorrect
                        ? 'correct'
                        : selectedAnswer === index
                          ? 'wrong'
                          : ''
                      : ''
                  }`}
                  onClick={() => onSelectAnswer(index)}
                  disabled={showResult}
                >
                  <span className="option-label-badge" style={{ background: ANSWER_OPTIONS[index].color }}>{ANSWER_OPTIONS[index].label}</span>
                  <span className="answer-text">{answer.text}</span>
                  {showResult && answer.isCorrect && <CheckCircle size={20} className="correct-icon" />}
                  {showResult && selectedAnswer === index && !answer.isCorrect && <XCircle size={20} className="wrong-icon" />}
                </button>
              ))}
            </div>

            {showResult && showExplanation && currentQuestion.explanation && (
              <div className="practice-explanation">
                <strong>Giải thích:</strong> {currentQuestion.explanation}
              </div>
            )}
          </div>

          <div className="practice-actions">
            {!showResult ? (
              <button
                className="btn btn-primary btn-large"
                onClick={onSubmit}
                disabled={selectedAnswer === null}
              >
                Xác nhận
              </button>
            ) : (
              <button className="btn btn-primary btn-large" onClick={onNext}>
                {currentIndex < practiceQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
              </button>
            )}
            <button className="btn btn-secondary" onClick={onReset}>
              Dừng lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
