// Answer reveal screen component
import { Crown, LogOut } from 'lucide-react';
import type { GamePlayer, GameQuestion } from '../../../types/quiz-game';
import { ANSWER_OPTIONS } from '../../../constants/answer-options';

interface GameAnswerRevealProps {
  currentPlayer: GamePlayer | null;
  currentQuestion: GameQuestion;
  sortedPlayers: GamePlayer[];
  prevScores: Record<string, number>;
  revealTimer: number;
  onLeaveGame: () => Promise<void>;
}

interface PlayerWithChanges extends GamePlayer {
  scoreChange: number;
  answeredCorrectly: boolean;
  prevScore: number;
}

export function GameAnswerReveal({
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  prevScores,
  revealTimer,
  onLeaveGame,
}: GameAnswerRevealProps) {
  const playersWithChanges: PlayerWithChanges[] = sortedPlayers.map(player => {
    const prevScore = prevScores[player.id] || 0;
    const scoreChange = player.score - prevScore;
    const answeredCorrectly = player.currentAnswer === currentQuestion.correctIndex;
    return { ...player, scoreChange, answeredCorrectly, prevScore };
  }).sort((a, b) => b.scoreChange - a.scoreChange);

  const correctCount = playersWithChanges.filter(p => p.answeredCorrectly).length;
  const myResult = playersWithChanges.find(p => p.id === currentPlayer?.id);

  return (
    <div className="game-fullscreen game-reveal-screen">
      <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
        <LogOut size={18} /> Rời
      </button>
      {/* Result header */}
      <div className="reveal-header">
        <div className={`result-banner ${myResult?.answeredCorrectly ? 'correct' : 'wrong'}`}>
          {myResult?.answeredCorrectly ? (
            <>
              <span className="result-icon">🎉</span>
              <span className="result-text">Chính xác!</span>
              {myResult.scoreChange > 0 && (
                <span className="score-gained">+{myResult.scoreChange}</span>
              )}
            </>
          ) : (
            <>
              <span className="result-icon">😔</span>
              <span className="result-text">Sai rồi!</span>
            </>
          )}
        </div>
      </div>

      {/* Correct answer display */}
      <div className="correct-answer-card">
        <span className="correct-label">Đáp án đúng</span>
        <span
          className="correct-answer"
          style={{ background: ANSWER_OPTIONS[currentQuestion.correctIndex].bg }}
        >
          <img src={ANSWER_OPTIONS[currentQuestion.correctIndex].icon} alt={ANSWER_OPTIONS[currentQuestion.correctIndex].label} className="correct-answer-icon" />
          {currentQuestion.options[currentQuestion.correctIndex]}
        </span>
        <span className="answer-stats">{correctCount}/{sortedPlayers.length} trả lời đúng</span>
      </div>

      {/* Players results */}
      <div className="reveal-players">
        <h3>Kết quả</h3>
        <div className="reveal-list">
          {playersWithChanges.slice(0, 8).map((player, index) => {
            const isMe = player.id === currentPlayer?.id;
            return (
              <div
                key={player.id}
                className={`reveal-item ${isMe ? 'is-me' : ''} ${player.answeredCorrectly ? 'correct' : 'wrong'}`}
              >
                <span className="reveal-rank">
                  {index === 0 && player.scoreChange > 0 ? <Crown size={16} /> : `#${index + 1}`}
                </span>
                <span className="reveal-name">
                  {player.name}
                  {isMe && <span className="me-tag">Bạn</span>}
                </span>
                <span className="reveal-status">
                  {player.answeredCorrectly ? '✓' : player.currentAnswer !== null ? '✗' : '—'}
                </span>
                <span className="reveal-score">
                  {player.score}
                  {player.scoreChange > 0 && <span className="change positive">+{player.scoreChange}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timer bar */}
      <div className="reveal-timer-bar">
        <div className="timer-fill" style={{ width: `${(revealTimer / 5) * 100}%` }} />
        <span className="timer-text">Tiếp tục sau {revealTimer}s</span>
      </div>
    </div>
  );
}
