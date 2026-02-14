// Power-up selection — premium animated screen
import { useState } from 'react';
import { Zap, Target, Shield, ChevronRight, LogOut, Sparkles, Eye } from 'lucide-react';
import type { GamePlayer, GameQuestion, PowerUpType } from '../../../types/quiz-game';
import { POWER_UPS } from '../../../types/quiz-game';

interface GamePowerUpProps {
  currentPlayer: GamePlayer | null;
  currentQuestion: GameQuestion;
  sortedPlayers: GamePlayer[];
  powerUpTimer: number;
  isSpectator?: boolean;
  onUsePowerUp: (type: PowerUpType, targetId?: string) => Promise<boolean>;
  onLeaveGame: () => Promise<void>;
}

export function GamePowerUp({
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  powerUpTimer,
  isSpectator = false,
  onUsePowerUp,
  onLeaveGame,
}: GamePowerUpProps) {
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [powerUpConfirmed, setPowerUpConfirmed] = useState(false);

  const otherPlayers = sortedPlayers.filter(p => p.id !== currentPlayer?.id && !p.isSpectator);
  const needsTarget = selectedPowerUp === 'steal_points' || selectedPowerUp === 'block_player';
  const answeredCorrectly = !isSpectator && currentPlayer?.currentAnswer === currentQuestion.correctIndex;

  const handleUsePowerUp = async () => {
    if (powerUpConfirmed || !selectedPowerUp) return;
    if (needsTarget && !selectedTarget) return;

    const success = await onUsePowerUp(selectedPowerUp, selectedTarget || undefined);
    if (success) {
      setPowerUpConfirmed(true);
    }
  };

  // Timer display shared between states
  const timerBadge = (
    <div className="powerup-timer-badge">
      <span className="powerup-timer-value">{powerUpTimer}</span>
      <span className="powerup-timer-label">giây</span>
    </div>
  );

  // Spectator view — just observe the power-up phase
  if (isSpectator) {
    return (
      <div className="game-fullscreen game-powerup-screen ineligible">
        <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
          <LogOut size={18} /> Rời
        </button>
        <div className="powerup-header">
          <div className="powerup-icon-glow">
            <Zap size={32} className="powerup-icon-large" />
          </div>
          <h2>Round Đặc Biệt!</h2>
          {timerBadge}
        </div>
        <div className="powerup-ineligible-content">
          <div className="ineligible-icon"><Eye size={48} /></div>
          <p className="ineligible-text">Đang theo dõi</p>
          <p className="ineligible-hint">Người chơi đang chọn power-up...</p>
        </div>
      </div>
    );
  }

  // Not eligible state
  if (!answeredCorrectly) {
    return (
      <div className="game-fullscreen game-powerup-screen ineligible">
        <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
          <LogOut size={18} /> Rời
        </button>
        <div className="powerup-header">
          <div className="powerup-icon-glow">
            <Zap size={32} className="powerup-icon-large" />
          </div>
          <h2>Round Đặc Biệt!</h2>
          {timerBadge}
        </div>
        <div className="powerup-ineligible-content">
          <div className="ineligible-icon">😔</div>
          <p className="ineligible-text">Bạn không trả lời đúng</p>
          <p className="ineligible-hint">Trả lời đúng để nhận power-up!</p>
        </div>
      </div>
    );
  }

  // Confirmed state
  if (powerUpConfirmed) {
    const confirmedPowerUp = POWER_UPS.find(p => p.type === selectedPowerUp);
    return (
      <div className="game-fullscreen game-powerup-screen confirmed">
        <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
          <LogOut size={18} /> Rời
        </button>
        <div className="powerup-header">
          <div className="powerup-icon-glow">
            <Sparkles size={32} className="powerup-icon-large" />
          </div>
          <h2>Power-up Đã Kích Hoạt!</h2>
          {timerBadge}
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

  // Selection state
  return (
    <div className="game-fullscreen game-powerup-screen">
      <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
        <LogOut size={18} /> Rời
      </button>
      <div className="powerup-header">
        <div className="powerup-icon-glow">
          <Zap size={32} className="powerup-icon-large" />
        </div>
        <h2>Chọn Power-up!</h2>
        {timerBadge}
      </div>

      <div className="powerup-grid">
        {POWER_UPS.map((powerUp, i) => (
          <button
            key={powerUp.type}
            className={`powerup-card ${selectedPowerUp === powerUp.type ? 'selected' : ''}`}
            onClick={() => {
              setSelectedPowerUp(powerUp.type);
              setSelectedTarget(null);
            }}
            style={{ animationDelay: `${i * 0.08}s` }}
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
