// Game play component - handles all gameplay states
// Professional Kahoot-like game interface

import { useState, useEffect } from 'react';
import type { QuizGame, GamePlayer, GameQuestion, PowerUpType } from '../../types/quiz-game';
import { POWER_UPS } from '../../types/quiz-game';
import { Trophy, Zap, Users, ChevronRight, Shield, Snowflake, Target, Crown, Medal, Award } from 'lucide-react';

interface GamePlayProps {
  game: QuizGame;
  currentPlayer: GamePlayer | null;
  currentQuestion: GameQuestion;
  sortedPlayers: GamePlayer[];
  isHost: boolean;
  onSubmitAnswer: (answerIndex: number) => Promise<void>;
  onRevealAnswer: () => Promise<void>;
  onNextRound: () => Promise<void>;
  onContinueFromPowerUp: () => Promise<void>;
  onContinueFromLeaderboard: () => Promise<void>;
  onUsePowerUp: (type: PowerUpType, targetId?: string) => Promise<boolean>;
  onLeaveGame: () => Promise<void>;
  gameQuestionFontSize?: number;
  gameAnswerFontSize?: number;
}

// Answer option colors - vibrant gradient pairs
const ANSWER_COLORS = [
  { bg: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', icon: '▲' },
  { bg: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', icon: '◆' },
  { bg: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)', icon: '●' },
  { bg: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)', icon: '■' },
];

export function GamePlay({
  game,
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  isHost,
  onSubmitAnswer,
  onRevealAnswer,
  onNextRound,
  onContinueFromPowerUp,
  onContinueFromLeaderboard,
  onUsePowerUp,
  onLeaveGame,
  gameQuestionFontSize = 2,
  gameAnswerFontSize = 1.1,
}: GamePlayProps) {
  const [timeLeft, setTimeLeft] = useState(currentQuestion.timeLimit);
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [revealTimer, setRevealTimer] = useState(5);
  const [powerUpTimer, setPowerUpTimer] = useState(10);
  const [prevScores, setPrevScores] = useState<Record<string, number>>({});
  const [powerUpConfirmed, setPowerUpConfirmed] = useState(false);

  // Countdown for starting state
  useEffect(() => {
    if (game.status === 'starting') {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game.status]);

  // Timer for questions
  useEffect(() => {
    if (game.status === 'question' && game.roundStartTime) {
      const updateTimer = () => {
        const elapsed = (Date.now() - game.roundStartTime!) / 1000;
        const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
        setTimeLeft(Math.ceil(remaining));

        if (remaining <= 0 && isHost) {
          onRevealAnswer();
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 100);
      return () => clearInterval(timer);
    }
  }, [game.status, game.roundStartTime, currentQuestion.timeLimit, isHost, onRevealAnswer]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(currentQuestion.timeLimit);
  }, [game.currentRound, currentQuestion.timeLimit]);

  // Save previous scores when entering question phase
  useEffect(() => {
    if (game.status === 'question') {
      const scores: Record<string, number> = {};
      Object.values(game.players).forEach(player => {
        scores[player.id] = player.score;
      });
      setPrevScores(scores);
    }
  }, [game.status, game.currentRound]);

  // Auto-advance timer for answer reveal (5s)
  useEffect(() => {
    if (game.status === 'answer_reveal') {
      setRevealTimer(5);
      const timer = setInterval(() => {
        setRevealTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isHost) {
              onNextRound();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game.status, isHost, onNextRound]);

  // Auto-advance timer for power-up selection (10s)
  useEffect(() => {
    if (game.status === 'power_up') {
      setPowerUpTimer(10);
      setPowerUpConfirmed(false);
      setSelectedPowerUp(null);
      setSelectedTarget(null);
      const timer = setInterval(() => {
        setPowerUpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isHost) {
              onContinueFromPowerUp();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game.status, isHost, onContinueFromPowerUp]);

  // Auto-advance timer for leaderboard (5s)
  useEffect(() => {
    if (game.status === 'leaderboard') {
      setRevealTimer(5);
      const timer = setInterval(() => {
        setRevealTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isHost) {
              onContinueFromLeaderboard();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game.status, isHost, onContinueFromLeaderboard]);

  // Calculate timer progress percentage
  const timerProgress = (timeLeft / currentQuestion.timeLimit) * 100;

  // Starting countdown
  if (game.status === 'starting') {
    return (
      <div className="game-fullscreen game-starting-screen">
        <div className="starting-content">
          <div className="starting-icon">
            <Zap size={64} />
          </div>
          <h1 className="starting-title">Chuẩn bị!</h1>
          <div className="starting-countdown">
            <span className="countdown-number">{countdown}</span>
          </div>
          <p className="starting-hint">Game sắp bắt đầu...</p>
        </div>
      </div>
    );
  }

  // Question state
  if (game.status === 'question') {
    const hasAnswered = currentPlayer?.currentAnswer !== null;
    const isBlocked = currentPlayer?.isBlocked;
    const hasTimeFreeze = currentPlayer?.hasTimeFreeze;
    const effectiveTime = hasTimeFreeze ? timeLeft + 5 : timeLeft;
    const answeredCount = sortedPlayers.filter(p => p.currentAnswer !== null).length;

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
                  background: ANSWER_COLORS[index].bg,
                  fontSize: `${gameAnswerFontSize}rem`
                }}
                disabled={hasAnswered}
              >
                <span className="answer-icon">{ANSWER_COLORS[index].icon}</span>
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

  // Answer reveal state
  if (game.status === 'answer_reveal') {
    const playersWithChanges = sortedPlayers.map(player => {
      const prevScore = prevScores[player.id] || 0;
      const scoreChange = player.score - prevScore;
      const answeredCorrectly = player.currentAnswer === currentQuestion.correctIndex;
      return { ...player, scoreChange, answeredCorrectly, prevScore };
    }).sort((a, b) => b.scoreChange - a.scoreChange);

    const correctCount = playersWithChanges.filter(p => p.answeredCorrectly).length;
    const myResult = playersWithChanges.find(p => p.id === currentPlayer?.id);

    return (
      <div className="game-fullscreen game-reveal-screen">
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
            style={{ background: ANSWER_COLORS[currentQuestion.correctIndex].bg }}
          >
            {ANSWER_COLORS[currentQuestion.correctIndex].icon} {currentQuestion.options[currentQuestion.correctIndex]}
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

  // Power-up selection state
  if (game.status === 'power_up') {
    const otherPlayers = sortedPlayers.filter(p => p.id !== currentPlayer?.id);
    const needsTarget = selectedPowerUp === 'steal_points' || selectedPowerUp === 'block_player';
    const answeredCorrectly = currentPlayer?.currentAnswer === currentQuestion.correctIndex;

    const handleUsePowerUp = async () => {
      if (powerUpConfirmed) return;
      if (!selectedPowerUp) return;
      if (needsTarget && !selectedTarget) return;

      const success = await onUsePowerUp(selectedPowerUp, selectedTarget || undefined);
      if (success) {
        setPowerUpConfirmed(true);
      }
    };

    // Player did not answer correctly
    if (!answeredCorrectly) {
      return (
        <div className="game-fullscreen game-powerup-screen ineligible">
          <div className="powerup-header">
            <Zap size={32} className="powerup-icon-large" />
            <h2>Round Đặc Biệt!</h2>
            <div className="powerup-timer">{powerUpTimer}s</div>
          </div>
          <div className="powerup-ineligible-content">
            <div className="ineligible-icon">😔</div>
            <p className="ineligible-text">Bạn không trả lời đúng</p>
            <p className="ineligible-hint">Trả lời đúng để nhận power-up!</p>
          </div>
        </div>
      );
    }

    // Power-up confirmed
    if (powerUpConfirmed) {
      const confirmedPowerUp = POWER_UPS.find(p => p.type === selectedPowerUp);
      return (
        <div className="game-fullscreen game-powerup-screen confirmed">
          <div className="powerup-header">
            <Zap size={32} className="powerup-icon-large" />
            <h2>Round Đặc Biệt!</h2>
            <div className="powerup-timer">{powerUpTimer}s</div>
          </div>
          <div className="powerup-confirmed-content">
            <div className="confirmed-check">✓</div>
            <p>Đã chọn power-up!</p>
            {confirmedPowerUp && (
              <div className="confirmed-powerup-display">
                <span className="powerup-emoji">{confirmedPowerUp.icon}</span>
                <span className="powerup-name">{confirmedPowerUp.name}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Power-up selection
    return (
      <div className="game-fullscreen game-powerup-screen">
        <div className="powerup-header">
          <Zap size={32} className="powerup-icon-large" />
          <h2>Chọn Power-up!</h2>
          <div className="powerup-timer">{powerUpTimer}s</div>
        </div>

        <div className="powerup-grid">
          {POWER_UPS.map(powerUp => (
            <button
              key={powerUp.type}
              className={`powerup-card ${selectedPowerUp === powerUp.type ? 'selected' : ''}`}
              onClick={() => {
                setSelectedPowerUp(powerUp.type);
                setSelectedTarget(null);
              }}
            >
              <span className="powerup-emoji">{powerUp.icon}</span>
              <span className="powerup-name">{powerUp.name}</span>
              <span className="powerup-desc">{powerUp.description}</span>
            </button>
          ))}
        </div>

        {needsTarget && selectedPowerUp && (
          <div className="target-section">
            <h3><Target size={16} /> Chọn mục tiêu</h3>
            <div className="target-grid">
              {otherPlayers.map(player => (
                <button
                  key={player.id}
                  className={`target-card ${selectedTarget === player.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget(player.id)}
                >
                  <span className="target-name">{player.name}</span>
                  <span className="target-score">{player.score} điểm</span>
                  {player.hasShield && <Shield size={14} className="shield-indicator" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="confirm-powerup-btn"
          onClick={handleUsePowerUp}
          disabled={!selectedPowerUp || (needsTarget && !selectedTarget)}
        >
          Xác nhận <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  // Leaderboard state
  if (game.status === 'leaderboard') {
    const top3 = sortedPlayers.slice(0, 3);
    const rest = sortedPlayers.slice(3);

    return (
      <div className="game-fullscreen game-leaderboard-screen">
        <div className="leaderboard-header">
          <Trophy size={32} className="trophy-icon" />
          <h2>Bảng Xếp Hạng</h2>
          <p className="round-progress">Sau câu {game.currentRound + 1}/{game.totalRounds}</p>
        </div>

        {/* Podium for top 3 */}
        <div className="podium">
          {top3[1] && (
            <div className="podium-place second">
              <div className="podium-player">
                <Medal size={24} className="medal silver" />
                <span className="podium-name">{top3[1].name}</span>
                <span className="podium-score">{top3[1].score}</span>
              </div>
              <div className="podium-stand">2</div>
            </div>
          )}
          {top3[0] && (
            <div className="podium-place first">
              <div className="podium-player">
                <Crown size={28} className="crown" />
                <span className="podium-name">{top3[0].name}</span>
                <span className="podium-score">{top3[0].score}</span>
                {top3[0].streak >= 3 && <span className="streak-fire">🔥 {top3[0].streak}</span>}
              </div>
              <div className="podium-stand">1</div>
            </div>
          )}
          {top3[2] && (
            <div className="podium-place third">
              <div className="podium-player">
                <Award size={22} className="medal bronze" />
                <span className="podium-name">{top3[2].name}</span>
                <span className="podium-score">{top3[2].score}</span>
              </div>
              <div className="podium-stand">3</div>
            </div>
          )}
        </div>

        {/* Rest of players */}
        {rest.length > 0 && (
          <div className="leaderboard-rest">
            {rest.map((player, index) => (
              <div
                key={player.id}
                className={`leaderboard-row ${player.id === currentPlayer?.id ? 'is-me' : ''}`}
              >
                <span className="row-rank">#{index + 4}</span>
                <span className="row-name">{player.name}</span>
                <span className="row-score">{player.score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timer bar */}
        <div className="reveal-timer-bar">
          <div className="timer-fill" style={{ width: `${(revealTimer / 5) * 100}%` }} />
          <span className="timer-text">Câu tiếp theo sau {revealTimer}s</span>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="game-fullscreen game-loading-screen">
      <div className="loading-spinner" />
      <p>Đang tải...</p>
      <button className="leave-btn" onClick={onLeaveGame}>
        Rời game
      </button>
    </div>
  );
}
