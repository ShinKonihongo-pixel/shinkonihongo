// Question and answers screen component
import { Trophy, Zap, Users, Shield, Snowflake, LogOut } from 'lucide-react';
import type { QuizGame, GamePlayer, GameQuestion } from '../../../types/quiz-game';
import { ANSWER_OPTIONS } from '../../../constants/answer-options';

interface GameQuestionProps {
  game: QuizGame;
  currentPlayer: GamePlayer | null;
  currentQuestion: GameQuestion;
  sortedPlayers: GamePlayer[];
  timeLeft: number;
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
  onSubmitAnswer,
  onLeaveGame,
  gameQuestionFontSize = 2,
  gameAnswerFontSize = 1.1,
}: GameQuestionProps) {
  const hasAnswered = currentPlayer?.currentAnswer !== null;
  const isBlocked = currentPlayer?.isBlocked;
  const hasTimeFreeze = currentPlayer?.hasTimeFreeze;
  const effectiveTime = hasTimeFreeze ? timeLeft + 5 : timeLeft;
  const answeredCount = sortedPlayers.filter(p => p.currentAnswer !== null).length;
  const timerProgress = (timeLeft / currentQuestion.timeLimit) * 100;

  return (
    <div className="game-fullscreen game-question-screen">
      {/* Top bar */}
      <div className="game-top-bar">
        <div className="top-bar-left">
          <span className="round-badge">
            {game.currentRound + 1}/{game.totalRounds}
          </span>
          {currentQuestion.isSpecialRound && (
            <span className="special-round-badge">
              <Zap size={14} /> Special
            </span>
          )}
        </div>
        <div className="top-bar-center">
          <div className={`timer-circle ${timeLeft <= 5 ? 'warning' : ''}`}>
            <svg viewBox="0 0 100 100">
              <circle
                className="timer-bg"
                cx="50" cy="50" r="45"
                fill="none"
                strokeWidth="8"
              />
              <circle
                className="timer-progress"
                cx="50" cy="50" r="45"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${timerProgress * 2.83} 283`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <span className="timer-value">
              {effectiveTime}
              {hasTimeFreeze && <Snowflake size={12} className="time-freeze-icon" />}
            </span>
          </div>
        </div>
        <div className="top-bar-right">
          <div className="score-display">
            <Trophy size={16} />
            <span>{currentPlayer?.score || 0}</span>
          </div>
          <button className="leave-game-btn" onClick={onLeaveGame} title="Rời game">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Question area */}
      <div className="question-area">
        <div className="question-card">
          <h2 className="question-text" style={{ fontSize: `${gameQuestionFontSize}rem` }}>
            {currentQuestion.question}
          </h2>
        </div>
      </div>

      {/* Answers area */}
      {isBlocked ? (
        <div className="blocked-overlay">
          <Shield size={48} />
          <p>Bạn bị phong tỏa câu này!</p>
        </div>
      ) : (
        <div className="answers-grid">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`answer-card ${currentPlayer?.currentAnswer === index ? 'selected' : ''} ${hasAnswered ? 'disabled' : ''}`}
              onClick={() => !hasAnswered && onSubmitAnswer(index)}
              style={{
                background: ANSWER_OPTIONS[index].bg,
                fontSize: `${gameAnswerFontSize}rem`
              }}
              disabled={hasAnswered}
            >
              <img src={ANSWER_OPTIONS[index].icon} alt={ANSWER_OPTIONS[index].label} className="answer-icon" />
              <span className="answer-text">{option}</span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom status bar */}
      <div className="game-bottom-bar">
        {hasAnswered ? (
          <div className="answered-status">
            <span className="status-check">✓</span>
            <span>Đã trả lời</span>
          </div>
        ) : (
          <div className="waiting-status">
            <Users size={16} />
            <span>{answeredCount}/{sortedPlayers.length} đã trả lời</span>
          </div>
        )}
      </div>
    </div>
  );
}
