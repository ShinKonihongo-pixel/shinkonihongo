// Question screen — premium Kahoot-style with color-block answers
import { useState } from 'react';
import { Send, ArrowLeft, Trophy, Flame, Users } from 'lucide-react';
import type { QuizGame, GamePlayer, GameQuestion as GameQuestionType } from '../../../types/quiz-game';
import { ConfirmModal } from '../../ui/confirm-modal';

const ANSWER_STYLES = [
  { bg: 'linear-gradient(135deg, #e74c3c, #c0392b)', emoji: '▲' },
  { bg: 'linear-gradient(135deg, #3498db, #2471a3)', emoji: '◆' },
  { bg: 'linear-gradient(135deg, #f39c12, #d68910)', emoji: '●' },
  { bg: 'linear-gradient(135deg, #27ae60, #1e8449)', emoji: '■' },
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
  gameQuestionFontSize = 1.2,
  gameAnswerFontSize = 1,
}: GameQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const hasAnswered = isSpectator || currentPlayer?.currentAnswer !== null;
  const isBlocked = currentPlayer?.isBlocked;
  const answeredCount = sortedPlayers.filter(p => p.currentAnswer !== null).length;
  const timerProgress = (timeLeft / currentQuestion.timeLimit) * 100;
  const streak = currentPlayer?.streak || 0;

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || hasAnswered || submitting) return;
    setSubmitting(true);
    await onSubmitAnswer(selectedAnswer);
    setSubmitting(false);
  };

  return (
    <div className="game-fullscreen gq-screen">
      {/* Top nav */}
      <div className="gq-nav">
        <button className="gq-nav-btn" onClick={() => setShowLeaveConfirm(true)}>
          <ArrowLeft size={18} />
        </button>
        <div className="gq-nav-center">
          <span className="gq-round-pill">Câu {game.currentRound + 1}/{game.totalRounds}</span>
        </div>
        <div className="gq-nav-right">
          {streak >= 2 && <span className="gq-streak"><Flame size={13} />{streak}</span>}
          <span className="gq-score"><Trophy size={13} />{currentPlayer?.score || 0}</span>
        </div>
      </div>

      {/* Timer */}
      <div className="gq-timer">
        <div className={`gq-timer-track ${timeLeft <= 5 ? 'danger' : ''}`}>
          <div className="gq-timer-bar" style={{ width: `${timerProgress}%` }} />
        </div>
        <span className={`gq-timer-num ${timeLeft <= 5 ? 'danger' : ''}`}>{timeLeft}</span>
      </div>

      {/* Question */}
      <div className="gq-question-wrap">
        <div className="gq-question" key={game.currentRound}>
          <p style={{ fontSize: `${gameQuestionFontSize}rem` }}>{currentQuestion.question}</p>
        </div>
        <div className="gq-players-status">
          <Users size={13} />
          <span>{answeredCount}/{sortedPlayers.length}</span>
        </div>
      </div>

      {/* Answers */}
      {isBlocked ? (
        <div className="gq-blocked"><p>Bạn bị phong tỏa câu này!</p></div>
      ) : (
        <div className="gq-grid">
          {currentQuestion.options.map((option, i) => {
            const style = ANSWER_STYLES[i];
            const isSelected = hasAnswered ? currentPlayer?.currentAnswer === i : selectedAnswer === i;
            return (
              <button
                key={i}
                className={`gq-opt ${isSelected ? 'sel' : ''} ${hasAnswered ? 'done' : ''}`}
                onClick={() => !hasAnswered && !isSpectator && setSelectedAnswer(i)}
                disabled={hasAnswered || isSpectator}
                style={{ '--opt-bg': style.bg, fontSize: `${gameAnswerFontSize}rem` } as React.CSSProperties}
              >
                <span className="gq-opt-shape">{style.emoji}</span>
                <span className="gq-opt-text">{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom action */}
      <div className="gq-action">
        {hasAnswered ? (
          <div className="gq-done-pill">✓ Đã trả lời</div>
        ) : selectedAnswer !== null ? (
          <button className="gq-send" onClick={handleSubmitAnswer} disabled={submitting}>
            <Send size={16} />
            {submitting ? 'Gửi...' : 'Xác nhận'}
          </button>
        ) : (
          <div className="gq-hint">Chọn một đáp án</div>
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
