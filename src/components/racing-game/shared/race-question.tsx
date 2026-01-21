// Race Question - Professional question display with animated timer
// Themed answer options with visual feedback

import { useState, useEffect, useCallback } from 'react';
import { Clock, Zap, ChevronRight, Check, X } from 'lucide-react';
import type { RacingQuestion, VehicleType } from '../../../types/racing-game';

interface RaceQuestionProps {
  question: RacingQuestion;
  raceType: VehicleType;
  status: 'question' | 'answering' | 'revealing';
  isHost: boolean;
  hasAnswered: boolean;
  onSubmitAnswer: (index: number) => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
}

// Professional answer option colors with A, B, C, D labels
const OPTION_THEMES = [
  { bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)', label: 'A', color: '#ff6b6b' },
  { bg: 'linear-gradient(135deg, #4ecdc4 0%, #26a69a 100%)', label: 'B', color: '#4ecdc4' },
  { bg: 'linear-gradient(135deg, #ffd93d 0%, #f9a825 100%)', label: 'C', color: '#ffd93d' },
  { bg: 'linear-gradient(135deg, #8B5CF6 0%, #7c3aed 100%)', label: 'D', color: '#8B5CF6' },
];

export function RaceQuestion({
  question,
  raceType,
  status,
  isHost,
  hasAnswered,
  onSubmitAnswer,
  onRevealAnswer,
  onNextQuestion,
}: RaceQuestionProps) {
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (status !== 'answering') {
      setTimeLeft(question.timeLimit);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, question.timeLimit]);

  // Reset on question change
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(question.timeLimit);
  }, [question.id, question.timeLimit]);

  // Show result animation
  useEffect(() => {
    if (status === 'revealing') {
      setShowResult(true);
    }
  }, [status]);

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null || status !== 'answering' || hasAnswered) return;
    setSelectedAnswer(index);
    onSubmitAnswer(index);
  }, [selectedAnswer, status, hasAnswered, onSubmitAnswer]);

  const timerPercentage = (timeLeft / question.timeLimit) * 100;
  const isTimeWarning = timeLeft <= 5;
  const isTimeCritical = timeLeft <= 3;

  return (
    <div className={`pro-race-question ${raceType}`}>
      {/* Timer Section */}
      <div className={`question-timer ${isTimeWarning ? 'warning' : ''} ${isTimeCritical ? 'critical' : ''}`}>
        <div className="timer-circle">
          <svg viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isTimeCritical ? '#ff4757' : isTimeWarning ? '#ffd93d' : '#4ecdc4'}
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={283 * (1 - timerPercentage / 100)}
              strokeLinecap="round"
              className="timer-progress"
            />
          </svg>
          <div className="timer-content">
            <Clock size={20} />
            <span className="timer-value">{timeLeft}</span>
          </div>
        </div>
        <div className="timer-bar">
          <div
            className="timer-fill"
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      </div>

      {/* Question Display */}
      <div className="question-card">
        <div className="question-header">
          <div className="difficulty-badge">
            {question.difficulty === 'easy' && <span>⭐ Dễ</span>}
            {question.difficulty === 'medium' && <span>⭐⭐ Trung bình</span>}
            {question.difficulty === 'hard' && <span>⭐⭐⭐ Khó</span>}
          </div>
          <div className="speed-bonus">
            <Zap size={16} />
            <span>+{question.speedBonus} km/h</span>
          </div>
        </div>

        <h2 className="question-text">{question.questionText}</h2>
      </div>

      {/* Answer Options */}
      <div className="answer-grid">
        {question.options.map((option, index) => {
          const theme = OPTION_THEMES[index];
          const isSelected = selectedAnswer === index;
          const isCorrect = showResult && index === question.correctIndex;
          const isWrong = showResult && isSelected && index !== question.correctIndex;
          const isDisabled = status !== 'answering' || selectedAnswer !== null;

          return (
            <button
              key={index}
              className={`answer-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              style={{
                '--option-color': theme.color,
                background: isCorrect ? 'linear-gradient(135deg, #00c853 0%, #009624 100%)' :
                           isWrong ? 'linear-gradient(135deg, #ff4757 0%, #c62828 100%)' :
                           theme.bg,
              } as React.CSSProperties}
              onClick={() => handleAnswer(index)}
              disabled={isDisabled}
            >
              <span className="option-label">{theme.label}</span>
              <span className="option-text">{option}</span>
              {isCorrect && (
                <span className="result-icon correct">
                  <Check size={24} />
                </span>
              )}
              {isWrong && (
                <span className="result-icon wrong">
                  <X size={24} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Waiting indicator */}
      {selectedAnswer !== null && status === 'answering' && (
        <div className="waiting-result">
          <div className="waiting-spinner" />
          <span>Đang chờ kết quả...</span>
        </div>
      )}

      {/* Host Controls */}
      {isHost && (
        <div className="host-controls">
          {status === 'answering' && (
            <button className="control-btn reveal" onClick={onRevealAnswer}>
              Hiện Đáp Án
            </button>
          )}
          {status === 'revealing' && (
            <button className="control-btn next" onClick={onNextQuestion}>
              Câu Tiếp Theo
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
