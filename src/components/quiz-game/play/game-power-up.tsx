// Power-up selection screen component
import { useState } from 'react';
import { Zap, Target, Shield, ChevronRight, LogOut } from 'lucide-react';
import type { GamePlayer, GameQuestion, PowerUpType } from '../../../types/quiz-game';
import { POWER_UPS } from '../../../types/quiz-game';

interface GamePowerUpProps {
  currentPlayer: GamePlayer | null;
  currentQuestion: GameQuestion;
  sortedPlayers: GamePlayer[];
  powerUpTimer: number;
  onUsePowerUp: (type: PowerUpType, targetId?: string) => Promise<boolean>;
  onLeaveGame: () => Promise<void>;
}

export function GamePowerUp({
  currentPlayer,
  currentQuestion,
  sortedPlayers,
  powerUpTimer,
  onUsePowerUp,
  onLeaveGame,
}: GamePowerUpProps) {
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpType | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [powerUpConfirmed, setPowerUpConfirmed] = useState(false);

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
        <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
          <LogOut size={18} /> Rời
        </button>
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
        <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
          <LogOut size={18} /> Rời
        </button>
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
      <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
        <LogOut size={18} /> Rời
      </button>
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
