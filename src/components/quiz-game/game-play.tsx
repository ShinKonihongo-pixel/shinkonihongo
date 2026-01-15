// Game play component - handles all gameplay states

import { useState, useEffect } from 'react';
import type { QuizGame, GamePlayer, GameQuestion, PowerUpType } from '../../types/quiz-game';
import { POWER_UPS } from '../../types/quiz-game';

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
  gameQuestionFontSize = 8,
  gameAnswerFontSize = 1.1,
}: GamePlayProps) {
  const [timeLeft, setTimeLeft] = useState(currentQuestion.timeLimit);
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [revealTimer, setRevealTimer] = useState(5);
  const [powerUpTimer, setPowerUpTimer] = useState(10);
  // Store previous scores to calculate score changes
  const [prevScores, setPrevScores] = useState<Record<string, number>>({});
  // Track if power-up has been confirmed (no changes allowed after)
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
      setPowerUpConfirmed(false); // Reset confirmed state
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

  // Starting countdown
  if (game.status === 'starting') {
    return (
      <div className="quiz-game-page">
        <div className="game-starting">
          <h2>Game sắp bắt đầu!</h2>
          <div className="countdown">{countdown}</div>
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

    return (
      <div className="quiz-game-page">
        {/* Timer centered at top */}
        <div className={`game-timer-center ${timeLeft <= 5 ? 'timer-warning' : ''}`}>
          {effectiveTime}
          {hasTimeFreeze && <span className="time-bonus">+5s</span>}
        </div>

        <div className="game-question">
          <div className="question-header-combined">
            <span className="round-info">
              Câu {game.currentRound + 1}/{game.totalRounds}
              {currentQuestion.isSpecialRound && <span className="special-badge">Special!</span>}
            </span>
            <span className="score-info">Điểm: {currentPlayer?.score || 0}</span>
          </div>

          <div className="question-content">
            <h2 className="question-text" style={{ fontSize: `${gameQuestionFontSize}rem` }}>
              {currentQuestion.question}
            </h2>
          </div>

          {isBlocked ? (
            <div className="blocked-message">
              Bạn bị phong tỏa câu này!
            </div>
          ) : (
            <div className="answer-options">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`answer-btn answer-${index} ${
                    currentPlayer?.currentAnswer === index ? 'selected' : ''
                  } ${hasAnswered ? 'disabled' : ''}`}
                  onClick={() => !hasAnswered && onSubmitAnswer(index)}
                  style={{ fontSize: `${gameAnswerFontSize}rem` }}
                  disabled={hasAnswered}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {hasAnswered && (
            <p className="answered-message">Đã trả lời! Đang chờ người khác...</p>
          )}

          <div className="player-status">
            {sortedPlayers.slice(0, 5).map(player => (
              <span
                key={player.id}
                className={`player-dot ${player.currentAnswer !== null ? 'answered' : ''}`}
                title={player.name}
              >
                {player.name.charAt(0)}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Answer reveal state
  if (game.status === 'answer_reveal') {
    // Calculate score changes and sort players by score change (descending)
    const playersWithChanges = sortedPlayers.map(player => {
      const prevScore = prevScores[player.id] || 0;
      const scoreChange = player.score - prevScore;
      const answeredCorrectly = player.currentAnswer === currentQuestion.correctIndex;
      return {
        ...player,
        scoreChange,
        answeredCorrectly,
        prevScore,
      };
    }).sort((a, b) => b.scoreChange - a.scoreChange);

    // Count correct answers
    const correctCount = playersWithChanges.filter(p => p.answeredCorrectly).length;

    return (
      <div className="quiz-game-page">
        <div className="game-reveal">
          <div className="question-header">
            <span className="round-info">Câu {game.currentRound + 1}/{game.totalRounds}</span>
            <div className="timer">{revealTimer}s</div>
            <span className="score-info">Điểm: {currentPlayer?.score || 0}</span>
          </div>

          <div className="reveal-answer-section">
            <div className="correct-answer-display">
              <span className="correct-label">Đáp án đúng:</span>
              <span className="correct-text">{currentQuestion.options[currentQuestion.correctIndex]}</span>
            </div>
            <div className="answer-stats">
              <span className="correct-count">{correctCount}/{sortedPlayers.length} trả lời đúng</span>
            </div>
          </div>

          <div className="reveal-players-section">
            <h3>Kết quả người chơi</h3>
            <div className="reveal-players-list">
              {playersWithChanges.map((player, index) => {
                const isMe = player.id === currentPlayer?.id;
                return (
                  <div
                    key={player.id}
                    className={`reveal-player-item ${isMe ? 'is-me' : ''} ${player.answeredCorrectly ? 'correct' : 'wrong'}`}
                  >
                    <div className="reveal-player-rank">
                      {index === 0 && player.scoreChange > 0 ? '🏆' : `#${index + 1}`}
                    </div>
                    <div className="reveal-player-info">
                      <span className="reveal-player-name">
                        {player.name}
                        {isMe && <span className="me-badge">(Bạn)</span>}
                      </span>
                      <div className="reveal-player-status">
                        {player.answeredCorrectly ? (
                          <span className="status-correct">✓ Đúng</span>
                        ) : player.currentAnswer !== null ? (
                          <span className="status-wrong">✗ Sai</span>
                        ) : player.isBlocked ? (
                          <span className="status-blocked">🚫 Bị phong tỏa</span>
                        ) : (
                          <span className="status-no-answer">— Không trả lời</span>
                        )}
                        {player.streak >= 2 && (
                          <span className="streak-badge">{player.streak} streak 🔥</span>
                        )}
                      </div>
                    </div>
                    <div className="reveal-player-score">
                      <span className="score-total">{player.score}</span>
                      {player.scoreChange > 0 && (
                        <span className="score-change positive">+{player.scoreChange}</span>
                      )}
                      {player.scoreChange < 0 && (
                        <span className="score-change negative">{player.scoreChange}</span>
                      )}
                    </div>
                    <div className="reveal-player-bonuses">
                      {player.hasDoublePoints && <span className="bonus-badge" title="Nhân đôi điểm">✨x2</span>}
                      {player.hasShield && <span className="bonus-badge" title="Có lá chắn">🛡️</span>}
                      {player.hasTimeFreeze && <span className="bonus-badge" title="Đóng băng thời gian">❄️</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isHost && (
            <button className="btn btn-primary btn-next" onClick={onNextRound}>
              Tiếp tục ({revealTimer}s)
            </button>
          )}
          {!isHost && (
            <p className="auto-advance-hint">Tự động tiếp tục sau {revealTimer}s...</p>
          )}
        </div>
      </div>
    );
  }

  // Power-up selection state
  if (game.status === 'power_up') {
    const otherPlayers = sortedPlayers.filter(p => p.id !== currentPlayer?.id);
    const needsTarget = selectedPowerUp === 'steal_points' || selectedPowerUp === 'block_player';
    // Check if current player answered correctly (only they can select power-up)
    const answeredCorrectly = currentPlayer?.currentAnswer === currentQuestion.correctIndex;

    const handleUsePowerUp = async () => {
      if (powerUpConfirmed) return; // Already confirmed
      if (!selectedPowerUp) return;
      if (needsTarget && !selectedTarget) return;

      const success = await onUsePowerUp(selectedPowerUp, selectedTarget || undefined);
      if (success) {
        setPowerUpConfirmed(true); // Lock selection after successful use
      }
    };

    // Player did not answer correctly - show message only
    if (!answeredCorrectly) {
      return (
        <div className="quiz-game-page">
          <div className="game-powerup">
            <div className="powerup-header">
              <h2>Round đặc biệt!</h2>
              <div className={`timer ${powerUpTimer <= 3 ? 'timer-warning' : ''}`}>{powerUpTimer}s</div>
            </div>
            <div className="powerup-ineligible">
              <p className="ineligible-icon">😔</p>
              <p className="ineligible-message">Bạn không trả lời đúng nên không được chọn power-up!</p>
              <p className="ineligible-hint">Trả lời đúng ở round đặc biệt để nhận power-up.</p>
            </div>
            <p className="auto-advance-hint">Tự động tiếp tục sau {powerUpTimer}s...</p>
          </div>
        </div>
      );
    }

    // Player already confirmed their selection
    if (powerUpConfirmed) {
      const confirmedPowerUp = POWER_UPS.find(p => p.type === selectedPowerUp);
      return (
        <div className="quiz-game-page">
          <div className="game-powerup">
            <div className="powerup-header">
              <h2>Round đặc biệt!</h2>
              <div className={`timer ${powerUpTimer <= 3 ? 'timer-warning' : ''}`}>{powerUpTimer}s</div>
            </div>
            <div className="powerup-confirmed">
              <p className="confirmed-icon">✅</p>
              <p className="confirmed-message">Bạn đã chọn power-up!</p>
              {confirmedPowerUp && (
                <div className="confirmed-powerup">
                  <span className="powerup-icon">{confirmedPowerUp.icon}</span>
                  <span className="powerup-name">{confirmedPowerUp.name}</span>
                </div>
              )}
            </div>
            <p className="auto-advance-hint">Đang chờ người chơi khác... ({powerUpTimer}s)</p>
          </div>
        </div>
      );
    }

    // Player can select power-up
    return (
      <div className="quiz-game-page">
        <div className="game-powerup">
          <div className="powerup-header">
            <h2>Round đặc biệt!</h2>
            <div className={`timer ${powerUpTimer <= 3 ? 'timer-warning' : ''}`}>{powerUpTimer}s</div>
          </div>
          <p>🎉 Bạn trả lời đúng! Chọn một power-up (còn {powerUpTimer}s):</p>

          <div className="powerup-list">
            {POWER_UPS.map(powerUp => (
              <button
                key={powerUp.type}
                className={`powerup-btn ${selectedPowerUp === powerUp.type ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedPowerUp(powerUp.type);
                  setSelectedTarget(null);
                }}
              >
                <span className="powerup-icon">{powerUp.icon}</span>
                <span className="powerup-name">{powerUp.name}</span>
                <span className="powerup-desc">{powerUp.description}</span>
              </button>
            ))}
          </div>

          {needsTarget && selectedPowerUp && (
            <div className="target-selection">
              <h3>Chọn mục tiêu:</h3>
              <div className="target-list">
                {otherPlayers.map(player => (
                  <button
                    key={player.id}
                    className={`target-btn ${selectedTarget === player.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTarget(player.id)}
                  >
                    <span className="target-name">{player.name}</span>
                    <span className="target-score">{player.score} điểm</span>
                    {player.hasShield && <span className="shield-icon">🛡️</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="powerup-actions">
            <button
              className="btn btn-primary"
              onClick={handleUsePowerUp}
              disabled={!selectedPowerUp || (needsTarget && !selectedTarget)}
            >
              Xác nhận
            </button>
          </div>

          <p className="auto-advance-hint">Sau {powerUpTimer}s nếu không chọn sẽ mất quyền lợi!</p>
        </div>
      </div>
    );
  }

  // Leaderboard state
  if (game.status === 'leaderboard') {
    return (
      <div className="quiz-game-page">
        <div className="game-leaderboard">
          <div className="leaderboard-header">
            <h2>Bảng xếp hạng</h2>
            <div className="timer">{revealTimer}s</div>
          </div>
          <p>Sau {game.currentRound + 1} câu hỏi</p>

          <div className="leaderboard-list">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`leaderboard-item ${
                  index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''
                } ${player.id === currentPlayer?.id ? 'is-me' : ''}`}
              >
                <span className="rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <span className="name">{player.name}</span>
                <span className="score">{player.score}</span>
                {player.streak >= 3 && (
                  <span className="streak-badge">{player.streak} streak</span>
                )}
              </div>
            ))}
          </div>

          <p className="auto-advance-hint">Câu tiếp theo sau {revealTimer}s...</p>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="quiz-game-page">
      <div className="loading-state">
        <p>Đang tải...</p>
        <button className="btn btn-outline" onClick={onLeaveGame}>
          Rời game
        </button>
      </div>
    </div>
  );
}
