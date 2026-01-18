// Race Track - Professional animated race track visualization
// Supports multi-zone track with traps and team indicators

import { useMemo } from 'react';
import type { RacingPlayer, VehicleType, TrackZone, Trap, RacingTeam } from '../../../types/racing-game';
import { DEFAULT_TRACK_ZONES, TRAPS, TEAM_COLORS } from '../../../types/racing-game';
import { isImageAvatar } from '../../../utils/avatar-icons';

interface RaceTrackProps {
  raceType: VehicleType;
  players: RacingPlayer[];
  currentPlayerId?: string;
  trackLength: number;
  currentQuestion: number;
  totalQuestions: number;
  compact?: boolean;
  // New props for "Đường Đua"
  trackZones?: TrackZone[];
  activeTraps?: Trap[];
  teams?: Record<string, RacingTeam>;
  showZones?: boolean;
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
  trackZones = DEFAULT_TRACK_ZONES,
  activeTraps = [],
  teams,
  showZones = true,
}: RaceTrackProps) {
  const theme = TRACK_THEMES[raceType];

  // Sort players by distance (leader first)
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.distance - a.distance);
  }, [players]);

  return (
    <div className={`pro-race-track ${raceType} ${compact ? 'compact' : ''} ${showZones ? 'multi-zone' : ''}`}>
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

      {/* Track Zones Visual (background gradient) */}
      {showZones && (
        <div className="track-zones">
          {trackZones.map(zone => (
            <div
              key={zone.id}
              className={`track-zone zone-${zone.type}`}
              style={{
                left: `${zone.startPosition}%`,
                width: `${zone.endPosition - zone.startPosition}%`,
                background: zone.background,
              }}
            >
              <div className="zone-decorations">
                {zone.decorations.map((d, i) => (
                  <span key={i} className="zone-deco">{d}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Track Visual */}
      <div className="track-body" style={{ background: showZones ? 'transparent' : theme.bgGradient }}>
        {/* Decorative elements (only show if no zones) */}
        {!showZones && (
          <div className="track-decorations">
            {theme.decorations.map((d, i) => (
              <span key={i} className={`decoration d${i + 1}`}>{d}</span>
            ))}
          </div>
        )}

        {/* Trap Markers */}
        {activeTraps.length > 0 && (
          <div className="track-traps">
            {activeTraps.filter(t => t.isActive).map(trap => {
              const trapDef = TRAPS[trap.type];
              return (
                <div
                  key={trap.id}
                  className={`trap-marker trap-${trap.type}`}
                  style={{ left: `${trap.position}%` }}
                  title={trapDef.name}
                >
                  <span className="trap-emoji">{trapDef.emoji}</span>
                  <div className="trap-pulse" />
                </div>
              );
            })}
          </div>
        )}

        {/* Race Lanes */}
        <div className="race-lanes">
          {sortedPlayers.map((player, idx) => {
            const isCurrentPlayer = player.odinhId === currentPlayerId;
            const position = idx + 1;
            const teamColor = player.teamId && teams?.[player.teamId]
              ? TEAM_COLORS[teams[player.teamId].colorKey]
              : null;
            const hasTrapEffect = player.trapEffects && player.trapEffects.length > 0;

            return (
              <div
                key={player.odinhId}
                className={`race-lane ${isCurrentPlayer ? 'current-player' : ''} ${player.isBot ? 'bot' : ''} ${hasTrapEffect ? 'trapped' : ''}`}
                style={teamColor ? { '--team-color': teamColor.color } as React.CSSProperties : undefined}
              >
                {/* Position Badge */}
                <div className={`position-badge pos-${position}`}>
                  {position <= 3 ? ['🥇', '🥈', '🥉'][position - 1] : `#${position}`}
                </div>

                {/* Player Info */}
                <div className="player-info">
                  {/* Team Indicator */}
                  {teamColor && (
                    <span className="team-indicator" title={teams![player.teamId!].name}>
                      {teams![player.teamId!].emoji}
                    </span>
                  )}
                  <span className="player-avatar">
                    {player.avatar && isImageAvatar(player.avatar) ? (
                      <img src={player.avatar} alt={player.displayName} />
                    ) : (
                      player.avatar || player.displayName.charAt(0)
                    )}
                  </span>
                  <span className="player-name">
                    {player.displayName}
                                      </span>
                </div>

                {/* Track Lane */}
                <div className="lane-track" style={{ background: theme.laneColor }}>
                  {/* Progress Bar */}
                  <div
                    className="lane-progress"
                    style={{
                      width: `${Math.max(player.distance, 2)}%`,
                      background: teamColor ? teamColor.color : theme.progressColor,
                    }}
                  >
                    {/* Vehicle */}
                    <div className={`vehicle ${player.isFrozen ? 'frozen' : ''} ${player.isEscaping ? 'escaping' : ''}`}>
                      <span className="vehicle-emoji">{player.vehicle.emoji}</span>
                      {player.hasShield && <span className="effect-shield">🛡️</span>}
                      {player.activeFeatures.some(f => f.type === 'speed_boost' || f.type === 'double_speed') && (
                        <span className="effect-boost">🚀</span>
                      )}
                      {/* Trap Effect Indicators */}
                      {player.trapEffects && player.trapEffects.map((effect, i) => (
                        <span key={i} className={`effect-trap effect-${effect.trapType}`}>
                          {TRAPS[effect.trapType].emoji}
                        </span>
                      ))}
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
