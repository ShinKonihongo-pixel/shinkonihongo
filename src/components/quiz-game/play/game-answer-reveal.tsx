// Answer reveal — premium animated result with answer distribution & score changes
import { useState } from 'react';
import { Crown, ArrowLeft, Flame, CheckCircle, XCircle, Trophy, Clock } from 'lucide-react';
import type { GamePlayer, GameQuestion } from '../../../types/quiz-game';
import { ANSWER_OPTIONS } from '../../../constants/answer-options';
import { ConfirmModal } from '../../ui/confirm-modal';

const ANSWER_SHAPES = ['▲', '◆', '●', '■'];

interface GameAnswerRevealProps {
  currentPlayer: GamePlayer | null;
  currentQuestion: GameQuestion;
  sortedPlayers: GamePlayer[];
  prevScores: Record<string, number>;
  revealTimer: number;
  isSpectator?: boolean;
  onLeaveGame: () => Promise<void>;
}

export function GameAnswerReveal({
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  prevScores,
  revealTimer,
  isSpectator = false,
  onLeaveGame,
}: GameAnswerRevealProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const playersWithChanges = sortedPlayers.map(player => {
    const prevScore = prevScores[player.id] || 0;
    return {
      ...player,
      scoreChange: player.score - prevScore,
      answeredCorrectly: player.currentAnswer === currentQuestion.correctIndex,
    };
  }).sort((a, b) => b.scoreChange - a.scoreChange);

  const correctCount = playersWithChanges.filter(p => p.answeredCorrectly).length;
  const myResult = playersWithChanges.find(p => p.id === currentPlayer?.id);
  const isCorrect = myResult?.answeredCorrectly;
  const correctIdx = currentQuestion.correctIndex;

  // Answer distribution — how many picked each option
  const distribution = currentQuestion.options.map((_, i) => {
    const count = sortedPlayers.filter(p => p.currentAnswer === i).length;
    return { count, pct: sortedPlayers.length > 0 ? (count / sortedPlayers.length) * 100 : 0 };
  });

  // Player's wrong answer (if applicable)
  const myAnswerIdx = myResult?.currentAnswer;
  const showMyWrongAnswer = !isSpectator && !isCorrect && myAnswerIdx !== null && myAnswerIdx !== undefined;

  return (
    <div className={`game-fullscreen gr-screen ${isCorrect ? 'gr-correct' : 'gr-wrong'}`}>
      {/* Nav */}
      <div className="gr-nav">
        <button className="gq-nav-btn" onClick={() => setShowLeaveConfirm(true)}>
          <ArrowLeft size={18} />
        </button>
        <div className="gr-timer-pill">{revealTimer}s</div>
      </div>

      {/* Hero result */}
      <div className="gr-hero">
        {isSpectator ? (
          <div className="gr-hero-content">
            <span className="gr-hero-icon">👁️</span>
            <span className="gr-hero-label">Đang theo dõi</span>
          </div>
        ) : (
          <div className="gr-hero-content">
            {isCorrect
              ? <CheckCircle size={52} className="gr-icon-correct" />
              : <XCircle size={52} className="gr-icon-wrong" />
            }
            <span className="gr-hero-label">{isCorrect ? 'Chính xác!' : 'Sai rồi!'}</span>
            {isCorrect && myResult!.scoreChange > 0 && (
              <span className="gr-points">+{myResult!.scoreChange}</span>
            )}
            {isCorrect && myResult!.answerTime && (
              <span className="gr-answer-time"><Clock size={12} /> {(myResult!.answerTime / 1000).toFixed(1)}s</span>
            )}
            {isCorrect && (myResult?.streak || 0) >= 3 && (
              <span className="gr-streak"><Flame size={14} /> {myResult?.streak} liên tiếp</span>
            )}
          </div>
        )}
      </div>

      {/* Correct answer card */}
      <div className="gr-answer-card">
        <div className="gr-answer-label">Đáp án đúng</div>
        <div className="gr-answer-box" style={{ background: ANSWER_OPTIONS[correctIdx].bg }}>
          <span className="gr-answer-shape">{ANSWER_SHAPES[correctIdx]}</span>
          <span>{currentQuestion.options[correctIdx]}</span>
        </div>

        {/* Show player's wrong answer */}
        {showMyWrongAnswer && (
          <div className="gr-my-wrong">
            <span className="gr-my-wrong-label">Bạn chọn</span>
            <div className="gr-my-wrong-box">
              <span className="gr-answer-shape">{ANSWER_SHAPES[myAnswerIdx]}</span>
              <span>{currentQuestion.options[myAnswerIdx]}</span>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="gr-stats-bar">
          <div className="gr-stats-fill" style={{ width: `${sortedPlayers.length > 0 ? (correctCount / sortedPlayers.length) * 100 : 0}%` }} />
          <span className="gr-stats-text">{correctCount}/{sortedPlayers.length} đúng</span>
        </div>
      </div>

      {/* Answer distribution */}
      <div className="gr-distribution">
        <div className="gr-dist-label">Phân bố câu trả lời</div>
        <div className="gr-dist-bars">
          {currentQuestion.options.map((_opt, i) => {
            const isCorrectOpt = i === correctIdx;
            return (
              <div key={i} className={`gr-dist-row ${isCorrectOpt ? 'correct' : ''}`}>
                <span className="gr-dist-shape" style={{ color: ANSWER_OPTIONS[i].color }}>{ANSWER_SHAPES[i]}</span>
                <div className="gr-dist-track">
                  <div
                    className="gr-dist-fill"
                    style={{
                      width: `${Math.max(distribution[i].pct, 2)}%`,
                      background: isCorrectOpt ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.12)',
                    }}
                  />
                </div>
                <span className="gr-dist-count">{distribution[i].count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rankings */}
      <div className="gr-ranks">
        {playersWithChanges.slice(0, 6).map((p, i) => {
          const isMe = p.id === currentPlayer?.id;
          return (
            <div key={p.id} className={`gr-rank-row ${isMe ? 'me' : ''} ${p.answeredCorrectly ? 'ok' : 'fail'}`}
              style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="gr-rank-pos">
                {i === 0 && p.scoreChange > 0 ? <Crown size={14} /> : `${i + 1}`}
              </span>
              <span className="gr-rank-avatar">{p.name.charAt(0).toUpperCase()}</span>
              <span className="gr-rank-name">
                {p.name}{isMe && <em>Bạn</em>}
              </span>
              <span className="gr-rank-check">{p.answeredCorrectly ? '✓' : p.currentAnswer !== null ? '✗' : '—'}</span>
              <span className="gr-rank-score">
                <Trophy size={12} />{p.score}
                {p.scoreChange > 0 && <b>+{p.scoreChange}</b>}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="gr-progress">
        <div className="gr-progress-fill" style={{ width: `${(revealTimer / 5) * 100}%` }} />
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
