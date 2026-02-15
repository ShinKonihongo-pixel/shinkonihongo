// Exercise Session View Component

import { useRef } from 'react';
import { ArrowLeft, Volume2, VolumeX, RefreshCw, CheckCircle2, XCircle, Clock, ChevronRight, Trophy } from 'lucide-react';
import type { Exercise, ExerciseSession } from '../../../types/exercise';
import { LEVEL_THEMES } from '../../ui/jlpt-level-selector';
import { ANSWER_OPTIONS } from '../../../constants/answer-options';
import { getExerciseLevels, getQuestionText, getQuestionTypeLabel } from './exercise-utils';

interface ExerciseSessionViewProps {
  session: ExerciseSession;
  currentExercise: Exercise;
  selectedAnswer: number | null;
  textAnswer: string;
  showResult: boolean;
  isListening: boolean;
  listenCount: number;
  isAnimating: boolean;
  timeLeft: number | null;
  onSetSelectedAnswer: (answer: number | null) => void;
  onSetTextAnswer: (text: string) => void;
  onHandleAnswer: (answer: number | string) => void;
  onHandleTextSubmit: () => void;
  onNextQuestion: () => void;
  onSpeakQuestion: (text: string) => void;
  onQuit: () => void;
}

export function ExerciseSessionView({
  session,
  currentExercise,
  selectedAnswer,
  textAnswer,
  showResult,
  isListening,
  listenCount,
  isAnimating,
  timeLeft,
  onSetSelectedAnswer,
  onSetTextAnswer,
  onHandleAnswer,
  onHandleTextSubmit,
  onNextQuestion,
  onSpeakQuestion,
  onQuit,
}: ExerciseSessionViewProps) {
  const textInputRef = useRef<HTMLInputElement>(null);
  const currentQ = session.questions[session.currentIndex];
  const isListeningType = currentQ.type === 'listening_write';
  const levels = getExerciseLevels(currentExercise);
  const primaryLevel = levels[0] || 'N5';
  const theme = LEVEL_THEMES[primaryLevel];

  let isCorrect = false;
  if (isListeningType) {
    isCorrect = typeof session.answers[session.currentIndex] === 'string' &&
      (session.answers[session.currentIndex] as string).toLowerCase().trim() === currentQ.correctAnswer?.toLowerCase().trim();
  } else {
    isCorrect = selectedAnswer === currentQ.correctIndex;
  }

  const progress = ((session.currentIndex + (showResult ? 1 : 0)) / session.questions.length) * 100;

  return (
    <div className="exercise-session-premium">
      {/* Session Header with Exercise Name */}
      <header className="session-header">
        <button className="quit-btn" onClick={onQuit}>
          <ArrowLeft size={20} />
        </button>
        <div className="session-info">
          <h2 className="session-title">{currentExercise.name}</h2>
          <div className="session-meta">
            <span className="session-level" style={{ background: theme.gradient }}>
              {primaryLevel}
            </span>
            <span className="session-type">{getQuestionTypeLabel(currentQ.type)}</span>
          </div>
        </div>
        {timeLeft !== null && !showResult && (
          <div className={`timer ${timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : ''}`}>
            <Clock size={18} />
            <span>{timeLeft}s</span>
          </div>
        )}
      </header>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: theme.gradient }} />
        </div>
        <span className="progress-text">Câu {session.currentIndex + 1} / {session.questions.length}</span>
      </div>

      {/* Question Card */}
      <main className="exp-session-content">
        <div className={`exp-question-card ${isAnimating ? (isCorrect ? 'exp-correct-shake' : 'exp-wrong-shake') : ''}`}>
          {/* Listening Write Type */}
          {isListeningType ? (
            <div className="exp-listening-section">
              <div className={`exp-sound-wave ${isListening ? 'active' : ''}`}>
                {isListening ? <Volume2 size={48} /> : <VolumeX size={48} />}
                <div className="exp-wave-rings"><span></span><span></span><span></span></div>
              </div>
              <p className="exp-listening-status">
                {isListening ? `Đang phát lần ${listenCount}/3...` : 'Nghe và viết từ vừa nghe'}
              </p>
              {!isListening && !showResult && (
                <button className="exp-replay-btn" onClick={() => onSpeakQuestion(currentQ.vocabulary)}>
                  <RefreshCw size={16} /> Nghe lại
                </button>
              )}

              {!showResult && (
                <input
                  ref={textInputRef}
                  type="text"
                  className="exp-text-input"
                  value={textAnswer}
                  onChange={e => onSetTextAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onHandleTextSubmit()}
                  placeholder="Gõ từ bạn nghe được..."
                  disabled={isListening}
                />
              )}

              {showResult && (
                <div className={`exp-listening-result ${isCorrect ? 'correct' : 'wrong'}`}>
                  <div className="exp-result-row">
                    <span className="exp-label">Bạn viết:</span>
                    <span className={`exp-answer ${isCorrect ? 'correct' : 'wrong'}`}>
                      {session.answers[session.currentIndex] as string || '(không trả lời)'}
                      {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </span>
                  </div>
                  <div className="exp-result-row">
                    <span className="exp-label">Đáp án:</span>
                    <span className="exp-answer correct">{currentQ.correctAnswer}</span>
                  </div>
                  <div className="exp-word-info">
                    <span className="exp-vocab">{currentQ.vocabulary}</span>
                    {currentQ.kanji && <span className="exp-kanji">({currentQ.kanji})</span>}
                    <span className="exp-meaning">= {currentQ.meaning}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Multiple Choice Types */
            <>
              <div className="exp-question-section">
                <h2 className="exp-question-text">{getQuestionText(currentQ)}</h2>
                <p className="exp-question-hint">Chọn đáp án đúng</p>
              </div>

              <div className="exp-options-grid">
                {currentQ.options?.map((option, idx) => {
                  let optionClass = 'exp-option-btn';
                  if (showResult) {
                    if (idx === currentQ.correctIndex) optionClass += ' correct';
                    else if (idx === selectedAnswer) optionClass += ' wrong';
                    if (selectedAnswer === -1 && idx === currentQ.correctIndex) optionClass += ' timeout-correct';
                  } else if (selectedAnswer === idx) {
                    optionClass += ' selected';
                  }

                  return (
                    <button
                      key={idx}
                      className={optionClass}
                      onClick={() => !showResult && onSetSelectedAnswer(idx)}
                      disabled={showResult}
                    >
                      <img src={ANSWER_OPTIONS[idx].icon} alt={ANSWER_OPTIONS[idx].label} className="exp-option-mascot" />
                      <span className="exp-option-text">{option}</span>
                      {showResult && idx === currentQ.correctIndex && <CheckCircle2 className="exp-result-icon correct" size={22} />}
                      {showResult && idx === selectedAnswer && idx !== currentQ.correctIndex && <XCircle className="exp-result-icon wrong" size={22} />}
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <div className={`exp-feedback ${isCorrect ? 'correct' : 'wrong'} ${selectedAnswer === -1 ? 'timeout' : ''}`}>
                  <div className="exp-feedback-icon">
                    {isCorrect ? <CheckCircle2 size={24} /> : selectedAnswer === -1 ? <Clock size={24} /> : <XCircle size={24} />}
                  </div>
                  <div className="exp-feedback-content">
                    <strong>{isCorrect ? 'Chính xác!' : selectedAnswer === -1 ? 'Hết giờ!' : 'Chưa đúng!'}</strong>
                    <p>
                      <span className="exp-word">{currentQ.vocabulary}</span>
                      {currentQ.kanji && <span className="exp-kanji">({currentQ.kanji})</span>}
                      <span className="exp-meaning">= {currentQ.meaning}</span>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="exp-action-buttons">
          {!isListeningType && !showResult && selectedAnswer !== null && (
            <button className="exp-submit-btn" style={{ background: theme.gradient }} onClick={() => onHandleAnswer(selectedAnswer)}>
              <CheckCircle2 size={20} /> Trả lời
            </button>
          )}

          {isListeningType && !showResult && !isListening && textAnswer.trim() && (
            <button className="exp-submit-btn" style={{ background: theme.gradient }} onClick={onHandleTextSubmit}>
              <CheckCircle2 size={20} /> Trả lời
            </button>
          )}

          {showResult && (
            <button className="exp-next-btn" style={{ background: theme.gradient }} onClick={onNextQuestion}>
              {session.currentIndex + 1 >= session.questions.length ? (
                <>Xem kết quả <Trophy size={18} /></>
              ) : (
                <>Câu tiếp theo <ChevronRight size={18} /></>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
