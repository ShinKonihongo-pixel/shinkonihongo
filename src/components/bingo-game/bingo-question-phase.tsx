// Bingo Question Phase — full-screen overlay for answering quiz questions

import { useState, useEffect, useRef, useMemo } from 'react';
import type { BingoQuestion } from '../../types/bingo-game';

interface BingoQuestionPhaseProps {
  question: BingoQuestion;
  currentQuestionAnswers: Record<string, { selectedIndex: number; correct: boolean; answeredAt: number }>;
  currentPlayerId: string;
  totalPlayers: number;
  onSubmitAnswer: (selectedIndex: number) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function BingoQuestionPhase({
  question,
  currentQuestionAnswers,
  currentPlayerId,
  totalPlayers,
  onSubmitAnswer,
}: BingoQuestionPhaseProps) {
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);
  const hasAnswered = !!currentQuestionAnswers[currentPlayerId];
  const myAnswer = currentQuestionAnswers[currentPlayerId];
  const startTimeRef = useRef(Date.now());
  const answeredCount = Object.keys(currentQuestionAnswers).length;

  // Countdown timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    setTimeLeft(question.timeLimit);

    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, question.timeLimit - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 100);

    return () => clearInterval(timer);
  }, [question.id, question.timeLimit]);

  const timerPercent = useMemo(() => (timeLeft / question.timeLimit) * 100, [timeLeft, question.timeLimit]);

  return (
    <div className="bingo-question-phase">
      <div className="bqp-card">
        {/* Timer bar */}
        <div className="bqp-timer-track">
          <div
            className={`bqp-timer-bar ${timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : ''}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Question */}
        <div className="bqp-question">
          <span className="bqp-question-text">{question.questionText}</span>
          {question.questionHint && (
            <span className="bqp-hint">{question.questionHint}</span>
          )}
        </div>

        {/* Options */}
        <div className="bqp-options">
          {question.options.map((option, idx) => {
            let optionClass = 'bqp-option';
            if (hasAnswered) {
              if (myAnswer.selectedIndex === idx) {
                optionClass += myAnswer.correct ? ' correct' : ' wrong';
              }
            }

            return (
              <button
                key={idx}
                className={optionClass}
                onClick={() => !hasAnswered && timeLeft > 0 && onSubmitAnswer(idx)}
                disabled={hasAnswered || timeLeft <= 0}
              >
                <span className="bqp-option-label">{OPTION_LABELS[idx]}</span>
                <span className="bqp-option-text">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Answer count badge */}
        <div className="bqp-status">
          <span className="bqp-answered-badge">
            {answeredCount}/{totalPlayers} đã trả lời
          </span>
          {hasAnswered && (
            <span className={`bqp-result-badge ${myAnswer.correct ? 'correct' : 'wrong'}`}>
              {myAnswer.correct ? '✓ Đúng!' : '✗ Sai'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
