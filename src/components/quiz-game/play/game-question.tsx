// Question and answers — clean modern game screen
// Two-step answer: select (changeable) → press Submit to lock in
import { useState } from 'react';
import { Send, ArrowLeft, Menu } from 'lucide-react';
import type { QuizGame, GamePlayer, GameQuestion as GameQuestionType } from '../../../types/quiz-game';
import { ConfirmModal } from '../../ui/confirm-modal';

const ANSWER_COLORS = [
  { bg: '#e74c3c', light: 'rgba(231,76,60,0.15)', border: 'rgba(231,76,60,0.4)' },
  { bg: '#3498db', light: 'rgba(52,152,219,0.15)', border: 'rgba(52,152,219,0.4)' },
  { bg: '#f39c12', light: 'rgba(243,156,18,0.15)', border: 'rgba(243,156,18,0.4)' },
  { bg: '#2ecc71', light: 'rgba(46,204,113,0.15)', border: 'rgba(46,204,113,0.4)' },
];

interface GameQuestionProps {
  game: QuizGame;
  currentPlayer: GamePlayer | null;
  currentQuestion: GameQuestionType;
  sortedPlayers: GamePlayer[];
  timeLeft: number;
  isSpectator?: boolean;
  onSubmitAnswer: (answerIndex: number) => Promise<void>;
  onLeaveGame: () => Promise<void>;
  gameQuestionFontSize?: number;
  gameAnswerFontSize?: number;
}

export function GameQuestion({
  game,
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  timeLeft,
  isSpectator = false,
  onSubmitAnswer,
  onLeaveGame,
  gameQuestionFontSize = 1.15,
  gameAnswerFontSize = 0.95,
}: GameQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const hasAnswered = isSpectator || currentPlayer?.currentAnswer !== null;
  const isBlocked = currentPlayer?.isBlocked;
  const answeredCount = sortedPlayers.filter(p => p.currentAnswer !== null).length;
  const timerProgress = (timeLeft / currentQuestion.timeLimit) * 100;

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || hasAnswered || submitting) return;
    setSubmitting(true);
    await onSubmitAnswer(selectedAnswer);
    setSubmitting(false);
  };

  return (
    <div className="game-fullscreen game-question-screen">
      {/* Minimal header: back + round info */}
      <div className="gq-header">
        <button className="gq-back-btn" onClick={() => setShowLeaveConfirm(true)} title="Rời game">
          <ArrowLeft size={20} />
        </button>
        <div className="gq-round-info">
          <span className="gq-round">{game.currentRound + 1} / {game.totalRounds}</span>
          <span className="gq-answered">{answeredCount}/{sortedPlayers.length} đã trả lời</span>
        </div>
        <button className="gq-menu-btn" title="Menu">
          <Menu size={20} />
        </button>
      </div>

      {/* Timer bar */}
      <div className="gq-timer-bar">
        <div
          className={`gq-timer-fill ${timeLeft <= 5 ? 'warning' : ''}`}
          style={{ width: `${timerProgress}%` }}
        />
        <span className="gq-timer-text">{timeLeft}s</span>
      </div>

      {/* Question card */}
      <div className="gq-question-area">
        <div className="gq-question-card" key={game.currentRound}>
          <p className="gq-question-text" style={{ fontSize: `${gameQuestionFontSize}rem` }}>
            {currentQuestion.question}
          </p>
        </div>
      </div>

      {/* Answer grid */}
      {isBlocked ? (
        <div className="gq-blocked">
          <p>Bạn bị phong tỏa câu này!</p>
        </div>
      ) : (
        <div className="gq-answers">
          {currentQuestion.options.map((option, index) => {
            const color = ANSWER_COLORS[index];
            const isSelected = hasAnswered
              ? currentPlayer?.currentAnswer === index
              : selectedAnswer === index;
            return (
              <button
                key={index}
                className={`gq-answer ${isSelected ? 'selected' : ''} ${hasAnswered ? 'locked' : ''}`}
                onClick={() => !hasAnswered && !isSpectator && setSelectedAnswer(index)}
                disabled={hasAnswered || isSpectator}
                style={{
                  '--ans-color': color.bg,
                  '--ans-light': color.light,
                  '--ans-border': color.border,
                  fontSize: `${gameAnswerFontSize}rem`,
                } as React.CSSProperties}
              >
                <span className="gq-answer-indicator" />
                <span className="gq-answer-text">{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom: submit or status */}
      <div className="gq-bottom">
        {isSpectator ? (
          <div className="gq-status">Đang theo dõi</div>
        ) : hasAnswered ? (
          <div className="gq-status gq-status-done">✓ Đã trả lời</div>
        ) : selectedAnswer !== null ? (
          <button className="gq-submit-btn" onClick={handleSubmitAnswer} disabled={submitting}>
            <Send size={18} />
            <span>{submitting ? 'Đang gửi...' : 'Xác nhận'}</span>
          </button>
        ) : (
          <div className="gq-status">Chọn đáp án</div>
        )}
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời khỏi game?"
        message="Bạn có chắc muốn rời khỏi game đang chơi?"
        confirmText="Rời game"
        cancelText="Ở lại"
        onConfirm={onLeaveGame}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
