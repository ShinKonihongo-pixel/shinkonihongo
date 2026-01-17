// Golden Bell Play - Main gameplay with questions and eliminations
// Shows questions, answer options, player status, and elimination results

import { useState, useEffect, useCallback } from 'react';
import { Clock, Users, Bell, ChevronRight, Skull, CheckCircle, XCircle, LogOut } from 'lucide-react';
import type { GoldenBellGame, GoldenBellPlayer, GoldenBellQuestion } from '../../types/golden-bell';
import { ANSWER_COLORS, ANSWER_LABELS, ANSWER_SHAPES, DIFFICULTY_INFO, CATEGORY_INFO } from '../../types/golden-bell';

interface GoldenBellPlayProps {
  game: GoldenBellGame;
  currentPlayer: GoldenBellPlayer | undefined;
  currentQuestion: GoldenBellQuestion | null;
  sortedPlayers: GoldenBellPlayer[];
  aliveCount: number;
  isHost: boolean;
  onSubmitAnswer: (index: number) => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
  onLeave?: () => void;
}

export function GoldenBellPlay({
  game,
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  aliveCount,
  isHost,
  onSubmitAnswer,
  onRevealAnswer,
  onNextQuestion,
  onLeave,
}: GoldenBellPlayProps) {
  const [timeLeft, setTimeLeft] = useState(currentQuestion?.timeLimit || 15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showEliminated, setShowEliminated] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (game.status !== 'answering' || !currentQuestion) {
      setTimeLeft(currentQuestion?.timeLimit || 15);
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
  }, [game.status, currentQuestion, game.currentQuestionIndex]);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowEliminated(false);
  }, [game.currentQuestionIndex]);

  // Show eliminated players when revealing
  useEffect(() => {
    if (game.status === 'revealing') {
      setTimeout(() => setShowEliminated(true), 1000);
    }
  }, [game.status]);

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null || game.status !== 'answering') return;
    if (!currentPlayer || currentPlayer.status !== 'alive') return;
    setSelectedAnswer(index);
    onSubmitAnswer(index);
  }, [selectedAnswer, game.status, currentPlayer, onSubmitAnswer]);

  // Check if player is eliminated
  const isEliminated = currentPlayer?.status === 'eliminated';

  // Render starting countdown
  if (game.status === 'starting') {
    return (
      <div className="golden-bell-play starting">
        {onLeave && (
          <button className="leave-game-btn floating" onClick={onLeave} title="Rời game">
            <LogOut size={18} /> Rời
          </button>
        )}
        <div className="countdown-display">
          <div className="countdown-icon bell-icon">
            <Bell size={64} />
          </div>
          <h2>Rung Chuông Vàng sắp bắt đầu!</h2>
          <div className="countdown-number">3</div>
          <p>{Object.keys(game.players).length} người chơi sẵn sàng</p>
        </div>
      </div>
    );
  }

  // If player is eliminated, show spectator view
  if (isEliminated) {
    return (
      <div className="golden-bell-play eliminated-view">
        {onLeave && (
          <button className="leave-game-btn floating" onClick={onLeave} title="Rời game">
            <LogOut size={18} /> Rời
          </button>
        )}
        <div className="eliminated-banner">
          <Skull size={48} />
          <h2>Bạn đã bị loại!</h2>
          <p>Bạn trả lời đúng {currentPlayer?.correctAnswers} câu</p>
        </div>

        {/* Still show the game progress */}
        <div className="spectator-info">
          <div className="spectator-stat">
            <Users size={20} />
            <span>{aliveCount} người còn lại</span>
          </div>
          <div className="spectator-stat">
            <span>Câu {game.currentQuestionIndex + 1}/{game.questions.length}</span>
          </div>
        </div>

        {/* Show current question for spectators */}
        {currentQuestion && game.status !== 'finished' && (
          <div className="spectator-question">
            <h3>{currentQuestion.questionText}</h3>
            <div className="spectator-options">
              {currentQuestion.options.map((option, idx) => (
                <div
                  key={idx}
                  className={`spectator-option ${game.status === 'revealing' && idx === currentQuestion.correctIndex ? 'correct' : ''}`}
                >
                  <span className="option-label">{ANSWER_LABELS[idx]}</span>
                  <span>{option}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="golden-bell-play">
      {onLeave && (
        <button className="leave-game-btn floating" onClick={onLeave} title="Rời game">
          <LogOut size={18} /> Rời
        </button>
      )}
      {/* Game Status Bar */}
      <div className="game-status-bar">
        <div className="status-item">
          <Users size={18} />
          <span className="alive-count">{aliveCount} còn sống</span>
        </div>
        <div className="status-item question-count">
          <span>Câu {game.currentQuestionIndex + 1}/{game.questions.length}</span>
        </div>
        {currentQuestion && (
          <div className="status-item difficulty">
            <span style={{ color: DIFFICULTY_INFO[currentQuestion.difficulty].color }}>
              {DIFFICULTY_INFO[currentQuestion.difficulty].emoji}
            </span>
          </div>
        )}
      </div>

      {/* Question Section */}
      {(game.status === 'question' || game.status === 'answering' || game.status === 'revealing') && currentQuestion && (
        <div className="question-section golden-bell-question">
          {/* Timer */}
          <div className={`question-timer ${timeLeft <= 5 ? 'warning' : ''} ${timeLeft <= 3 ? 'danger' : ''}`}>
            <Clock size={24} />
            <span className="timer-value">{timeLeft}</span>
            <div className="timer-bar" style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }} />
          </div>

          {/* Category Badge */}
          <div className="question-category" style={{ background: CATEGORY_INFO[currentQuestion.category].color }}>
            {CATEGORY_INFO[currentQuestion.category].emoji} {CATEGORY_INFO[currentQuestion.category].name}
          </div>

          {/* Question */}
          <div className="question-display">
            <h2 className="question-text">{currentQuestion.questionText}</h2>
          </div>

          {/* Answer Options */}
          <div className="answer-options golden-bell-options">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = game.status === 'revealing' && index === currentQuestion.correctIndex;
              const isWrong = game.status === 'revealing' && isSelected && index !== currentQuestion.correctIndex;

              return (
                <button
                  key={index}
                  className={`answer-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  style={{ background: ANSWER_COLORS[index] }}
                  onClick={() => handleAnswer(index)}
                  disabled={game.status !== 'answering' || selectedAnswer !== null}
                >
                  <span className="option-shape">{ANSWER_SHAPES[index]}</span>
                  <span className="option-label">{ANSWER_LABELS[index]}</span>
                  <span className="option-text">{option}</span>
                  {isCorrect && <CheckCircle className="result-icon" size={24} />}
                  {isWrong && <XCircle className="result-icon" size={24} />}
                </button>
              );
            })}
          </div>

          {/* Explanation after reveal */}
          {game.status === 'revealing' && currentQuestion.explanation && (
            <div className="answer-explanation">
              <span>{currentQuestion.explanation}</span>
            </div>
          )}

          {/* Elimination Results */}
          {game.status === 'revealing' && showEliminated && game.eliminatedThisRound.length > 0 && (
            <div className="elimination-results">
              <div className="elimination-header">
                <Skull size={24} />
                <span>{game.eliminatedThisRound.length} người bị loại</span>
              </div>
              <div className="eliminated-list">
                {game.eliminatedThisRound.slice(0, 5).map(id => {
                  const player = game.players[id];
                  return player ? (
                    <div key={id} className="eliminated-player">
                      <span className="avatar">{player.avatar}</span>
                      <span className="name">{player.displayName}</span>
                    </div>
                  ) : null;
                })}
                {game.eliminatedThisRound.length > 5 && (
                  <span className="more-eliminated">+{game.eliminatedThisRound.length - 5} người khác</span>
                )}
              </div>
            </div>
          )}

          {/* Host Controls */}
          {isHost && (
            <div className="host-controls">
              {game.status === 'answering' && (
                <button className="reveal-btn" onClick={onRevealAnswer}>
                  Hiện Đáp Án
                </button>
              )}
              {game.status === 'revealing' && (
                <button className="next-btn" onClick={onNextQuestion}>
                  {aliveCount <= 1 || game.currentQuestionIndex >= game.questions.length - 1
                    ? 'Kết Thúc'
                    : 'Câu Tiếp'}
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Player Stats Bar */}
      {currentPlayer && currentPlayer.status === 'alive' && (
        <div className="player-stats-bar golden-bell-stats">
          <div className="stat-item correct">
            <CheckCircle size={16} />
            <span>{currentPlayer.correctAnswers} đúng</span>
          </div>
          <div className="stat-item streak">
            <span>Streak: {currentPlayer.streak}</span>
          </div>
          <div className="stat-item status alive">
            <span>Còn sống</span>
          </div>
        </div>
      )}

      {/* Players Sidebar - Show alive/eliminated status */}
      <div className="players-sidebar">
        <div className="sidebar-header">
          <Users size={16} />
          <span>Người chơi</span>
        </div>
        <div className="players-list">
          {sortedPlayers.slice(0, 10).map(player => (
            <div
              key={player.odinhId}
              className={`player-item ${player.status} ${player.odinhId === currentPlayer?.odinhId ? 'current' : ''}`}
            >
              <span className="player-avatar">{player.avatar}</span>
              <span className="player-name">{player.displayName}</span>
              <span className="player-status-icon">
                {player.status === 'alive' ? '✓' : '✗'}
              </span>
            </div>
          ))}
          {sortedPlayers.length > 10 && (
            <div className="more-players">+{sortedPlayers.length - 10} người khác</div>
          )}
        </div>
      </div>
    </div>
  );
}
