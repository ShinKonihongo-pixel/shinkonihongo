// Race Player Stats - Bottom bar showing current player statistics
// Shows speed, streak, accuracy, and active power-ups

import { Zap, Target, Flame, Shield } from 'lucide-react';
import type { RacingPlayer, VehicleType } from '../../../types/racing-game';
import { SPECIAL_FEATURES } from '../../../types/racing-game';
import { isImageAvatar } from '../../../utils/avatar-icons';

interface RacePlayerStatsProps {
  player: RacingPlayer;
  raceType: VehicleType;
  position: number;
  totalPlayers?: number;
}

export function RacePlayerStats({
  player,
  raceType,
  position,
}: RacePlayerStatsProps) {
  const accuracy = player.totalAnswers > 0
    ? Math.round((player.correctAnswers / player.totalAnswers) * 100)
    : 0;

  const positionLabel = position <= 3
    ? ['🥇', '🥈', '🥉'][position - 1]
    : `#${position}`;

  return (
    <div className={`pro-player-stats ${raceType}`}>
      {/* Position & Player Info */}
      <div className="stats-player">
        <div className={`position-badge pos-${position}`}>
          {positionLabel}
        </div>
        <div className="player-identity">
          <span className="player-avatar">
            {player.avatar && isImageAvatar(player.avatar) ? (
              <img src={player.avatar} alt={player.displayName} />
            ) : (
              player.avatar || player.displayName.charAt(0)
            )}
          </span>
          <span className="player-vehicle">{player.vehicle.emoji}</span>
        </div>
        <div className="player-name">{player.displayName}</div>
      </div>

      {/* Core Stats */}
      <div className="stats-grid">
        {/* Speed */}
        <div className="stat-item speed">
          <div className="stat-icon">
            <Zap size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{Math.round(player.currentSpeed)}</span>
            <span className="stat-label">km/h</span>
          </div>
        </div>

        {/* Streak */}
        <div className={`stat-item streak ${player.streak >= 3 ? 'hot' : ''}`}>
          <div className="stat-icon">
            <Flame size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{player.streak}</span>
            <span className="stat-label">streak</span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="stat-item accuracy">
          <div className="stat-icon">
            <Target size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {player.correctAnswers}/{player.totalAnswers}
            </span>
            <span className="stat-label">{accuracy}%</span>
          </div>
        </div>

        {/* Distance */}
        <div className="stat-item distance">
          <div className="stat-icon">
            {raceType === 'boat' ? '🚣' : '🏇'}
          </div>
          <div className="stat-content">
            <span className="stat-value">{player.distance.toFixed(1)}%</span>
            <span className="stat-label">hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Active Power-ups */}
      {(player.activeFeatures.length > 0 || player.hasShield) && (
        <div className="active-powerups">
          {player.hasShield && (
            <div className="powerup shield">
              <Shield size={16} />
              <span className="powerup-name">Khiên</span>
            </div>
          )}
          {player.activeFeatures.map((feature, index) => {
            const featureInfo = SPECIAL_FEATURES[feature.type];
            return (
              <div key={index} className="powerup">
                <span className="powerup-icon">{featureInfo.emoji}</span>
                <span className="powerup-name">{featureInfo.name}</span>
                <span className="powerup-duration">{feature.remainingRounds}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress to Finish */}
      <div className="progress-section">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${player.distance}%` }}
          />
          <span className="progress-marker" style={{ left: `${player.distance}%` }}>
            {player.vehicle.emoji}
          </span>
        </div>
        <div className="progress-labels">
          <span>Xuất phát</span>
          <span>Đích</span>
        </div>
      </div>
    </div>
  );
}
