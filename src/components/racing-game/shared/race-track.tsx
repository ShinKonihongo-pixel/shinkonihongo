// Race Track - Professional animated race track visualization
// Themed for boat (water) or horse (grass) racing

import { useMemo } from 'react';
import type { RacingPlayer, VehicleType } from '../../../types/racing-game';
import { isImageAvatar } from '../../../utils/avatar-icons';

interface RaceTrackProps {
  raceType: VehicleType;
  players: RacingPlayer[];
  currentPlayerId?: string;
  trackLength: number;
  currentQuestion: number;
  totalQuestions: number;
  compact?: boolean;
}

const TRACK_THEMES = {
  boat: {
    bgGradient: 'linear-gradient(180deg, #0077b6 0%, #00b4d8 50%, #90e0ef 100%)',
    laneColor: 'rgba(255, 255, 255, 0.15)',
    progressColor: 'linear-gradient(90deg, #4ecdc4, #44a08d)',
    finishIcon: '🏁',
    trackPattern: 'wave',
    decorations: ['🌊', '💧', '🐟'],
  },
  horse: {
    bgGradient: 'linear-gradient(180deg, #4a7c23 0%, #7cb342 50%, #aed581 100%)',
    laneColor: 'rgba(139, 69, 19, 0.2)',
    progressColor: 'linear-gradient(90deg, #8B5CF6, #a855f7)',
    finishIcon: '🏁',
    trackPattern: 'grass',
    decorations: ['🌾', '🍃', '🌻'],
  },
};

export function RaceTrack({
  raceType,
  players,
  currentPlayerId,
  trackLength,
  currentQuestion,
  totalQuestions,
  compact = false,
}: RaceTrackProps) {
  const theme = TRACK_THEMES[raceType];

  // Sort players by distance (leader first)
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.distance - a.distance);
  }, [players]);

  return (
    <div className={`pro-race-track ${raceType} ${compact ? 'compact' : ''}`}>
      {/* Track Header */}
      <div className="track-header">
        <div className="track-info">
          <span className="track-icon">{raceType === 'boat' ? '🚣' : '🏇'}</span>
          <span className="track-distance">{trackLength} km</span>
        </div>
        <div className="question-progress">
          <span className="progress-label">Câu hỏi</span>
          <span className="progress-numbers">{currentQuestion}/{totalQuestions}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Track Visual */}
      <div className="track-body" style={{ background: theme.bgGradient }}>
        {/* Decorative elements */}
        <div className="track-decorations">
          {theme.decorations.map((d, i) => (
            <span key={i} className={`decoration d${i + 1}`}>{d}</span>
          ))}
        </div>

        {/* Race Lanes */}
        <div className="race-lanes">
          {sortedPlayers.map((player, idx) => {
            const isCurrentPlayer = player.odinhId === currentPlayerId;
            const position = idx + 1;

            return (
              <div
                key={player.odinhId}
                className={`race-lane ${isCurrentPlayer ? 'current-player' : ''} ${player.isBot ? 'bot' : ''}`}
              >
                {/* Position Badge */}
                <div className={`position-badge pos-${position}`}>
                  {position <= 3 ? ['🥇', '🥈', '🥉'][position - 1] : `#${position}`}
                </div>

                {/* Player Info */}
                <div className="player-info">
                  <span className="player-avatar">
                    {player.avatar && isImageAvatar(player.avatar) ? (
                      <img src={player.avatar} alt={player.displayName} />
                    ) : (
                      player.avatar || player.displayName.charAt(0)
                    )}
                  </span>
                  <span className="player-name">
                    {player.displayName}
                    {player.isBot && <span className="bot-tag">BOT</span>}
                  </span>
                </div>

                {/* Track Lane */}
                <div className="lane-track" style={{ background: theme.laneColor }}>
                  {/* Progress Bar */}
                  <div
                    className="lane-progress"
                    style={{
                      width: `${Math.max(player.distance, 2)}%`,
                      background: theme.progressColor,
                    }}
                  >
                    {/* Vehicle */}
                    <div className={`vehicle ${player.isFrozen ? 'frozen' : ''}`}>
                      <span className="vehicle-emoji">{player.vehicle.emoji}</span>
                      {player.hasShield && <span className="effect-shield">🛡️</span>}
                      {player.activeFeatures.some(f => f.type === 'speed_boost' || f.type === 'double_speed') && (
                        <span className="effect-boost">🚀</span>
                      )}
                    </div>
                  </div>

                  {/* Finish Line */}
                  <div className="finish-line">{theme.finishIcon}</div>
                </div>

                {/* Stats */}
                <div className="player-stats">
                  <span className="stat speed">
                    <span className="stat-icon">⚡</span>
                    {Math.round(player.currentSpeed)}
                  </span>
                  <span className="stat distance">
                    {player.distance.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animated wave/grass overlay */}
      <div className={`track-overlay ${raceType}`} />
    </div>
  );
}
