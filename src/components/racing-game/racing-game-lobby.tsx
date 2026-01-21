// Racing Game Lobby - Waiting room before race starts
// Shows players, game code, team assignment, and start button for host

import { Copy, Play, LogOut, Users, Share2, Check, X } from 'lucide-react';
import { useState } from 'react';
import type { RacingGame, RacingVehicle } from '../../types/racing-game';
import { DEFAULT_VEHICLES, TEAM_COLORS } from '../../types/racing-game';
import { isImageAvatar } from '../../utils/avatar-icons';
import { getVipAvatarClasses, getVipNameClasses, isVipRole, getVipBadge } from '../../utils/vip-styling';

interface RacingGameLobbyProps {
  game: RacingGame;
  isHost: boolean;
  currentPlayerId?: string;
  selectedVehicle?: RacingVehicle;
  loading?: boolean;
  onSelectVehicle?: (vehicle: RacingVehicle) => void;
  onStartGame?: () => void;
  onLeaveGame?: () => void;
  onStart?: () => void;
  onLeave?: () => void;
  onAssignTeam?: (playerId: string, teamId: string) => void;
  onKickPlayer?: (playerId: string) => void;
}

export function RacingGameLobby({
  game,
  isHost,
  currentPlayerId,
  selectedVehicle,
  loading,
  onSelectVehicle,
  onStartGame,
  onLeaveGame,
  onStart,
  onLeave,
  onAssignTeam,
  onKickPlayer,
}: RacingGameLobbyProps) {
  const handleStart = onStartGame || onStart;
  const handleLeave = onLeaveGame || onLeave;
  const vehiclesForType = DEFAULT_VEHICLES.filter(v => v.type === game.settings.raceType);
  const [copied, setCopied] = useState(false);

  const players = Object.values(game.players);
  const canStart = players.length >= game.settings.minPlayers;
  const isTeamMode = game.settings.gameMode === 'team';
  const teams = game.teams;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(game.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const shareGame = async () => {
    const url = `${window.location.origin}/racing?join=${game.code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: game.title,
          text: `Tham gia cuộc đua "${game.title}" cùng mình!`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="racing-lobby">
      {/* Header */}
      <div className="lobby-header">
        <div className="lobby-icon">
          {game.settings.raceType === 'boat' ? '🚣' : '🏇'}
        </div>
        <div className="lobby-info">
          <h2>{game.title}</h2>
          <div className="lobby-meta">
            <span>{game.settings.raceType === 'boat' ? 'Đua Thuyền' : 'Chạy Đua'}</span>
            <span>•</span>
            <span>{game.settings.jlptLevel}</span>
            <span>•</span>
            <span>{game.settings.questionCount} câu hỏi</span>
          </div>
        </div>
      </div>

      {/* Game Code */}
      <div className="lobby-code-section">
        <span className="code-label">Mã Phòng</span>
        <div className="code-display">
          <span className="code-value">{game.code}</span>
          <button className="copy-btn" onClick={copyCode}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <button className="share-btn" onClick={shareGame}>
          <Share2 size={16} />
          Chia sẻ link
        </button>
      </div>

      {/* Players List */}
      <div className="lobby-players">
        <div className="players-header">
          <Users size={18} />
          <span>Người chơi ({players.length}/{game.settings.maxPlayers})</span>
          {isTeamMode && <span className="mode-badge team">Chế độ Đội</span>}
        </div>
        <div className="players-grid">
          {players.map(player => {
            const playerTeam = player.teamId && teams ? teams[player.teamId] : null;
            const teamColor = playerTeam ? TEAM_COLORS[playerTeam.colorKey] : null;

            const playerIsVip = isVipRole(player.role);
            const vipBadge = getVipBadge(player.role);

            return (
              <div
                key={player.odinhId}
                className={`player-card ${player.odinhId === currentPlayerId ? 'current' : ''} ${player.odinhId === game.hostId ? 'host' : ''} ${playerIsVip ? 'vip-player' : ''}`}
                style={teamColor ? { '--team-color': teamColor.color, borderLeftColor: teamColor.color } as React.CSSProperties : undefined}
              >
                {/* Team indicator */}
                {playerTeam && (
                  <div className="player-team-indicator" style={{ backgroundColor: teamColor?.color }}>
                    {playerTeam.emoji}
                  </div>
                )}
                <div className={getVipAvatarClasses(player.role, 'player-avatar')}>
                  {player.avatar && isImageAvatar(player.avatar) ? (
                    <img src={player.avatar} alt={player.displayName} />
                  ) : (
                    player.avatar || player.displayName.charAt(0).toUpperCase()
                  )}
                  {playerIsVip && <span className="vip-frame" />}
                </div>
                <div className="player-info">
                  <span className={getVipNameClasses(player.role, 'player-name')}>
                    {vipBadge && <span className="vip-badge">{vipBadge}</span>}
                    {player.displayName}
                    {player.odinhId === game.hostId && <span className="host-badge">Host</span>}
                  </span>
                  <span className="player-vehicle">
                    {player.vehicle.emoji} {player.vehicle.name}
                  </span>
                </div>
                {/* Kick button for host */}
                {isHost && player.odinhId !== game.hostId && player.odinhId !== currentPlayerId && onKickPlayer && (
                  <button
                    className="kick-btn"
                    onClick={() => onKickPlayer(player.odinhId)}
                    title="Kick khỏi phòng"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: game.settings.maxPlayers - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card empty">
              <div className="player-avatar empty">?</div>
              <span className="player-name">Đang chờ...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Team Assignment UI (only for team mode) */}
      {isTeamMode && teams && onAssignTeam && (
        <div className="lobby-teams">
          <div className="teams-header">
            <span className="teams-title">Chọn Đội</span>
          </div>
          <div className="teams-grid">
            {Object.values(teams).map(team => {
              const teamColor = TEAM_COLORS[team.colorKey];
              const memberPlayers = players.filter(p => p.teamId === team.id);
              const currentPlayer = players.find(p => p.odinhId === currentPlayerId);
              const isCurrentTeam = currentPlayer?.teamId === team.id;

              return (
                <button
                  key={team.id}
                  className={`team-select-card ${isCurrentTeam ? 'selected' : ''}`}
                  style={{ '--team-color': teamColor.color } as React.CSSProperties}
                  onClick={() => currentPlayerId && onAssignTeam(currentPlayerId, team.id)}
                  disabled={isCurrentTeam}
                >
                  <div className="team-header">
                    <span className="team-emoji">{team.emoji}</span>
                    <span className="team-name">{team.name}</span>
                    {isCurrentTeam && <Check size={16} className="check-icon" />}
                  </div>
                  <div className="team-members-list">
                    {memberPlayers.map(p => (
                      <span key={p.odinhId} className="member-mini" title={p.displayName}>
                        {p.avatar && isImageAvatar(p.avatar) ? (
                          <img src={p.avatar} alt={p.displayName} />
                        ) : (
                          p.avatar || p.displayName.charAt(0)
                        )}
                      </span>
                    ))}
                    {memberPlayers.length === 0 && <span className="no-members">Trống</span>}
                  </div>
                  <div className="team-count">{memberPlayers.length} người</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Track Preview */}
      <div className="track-preview">
        <div className="track-info">
          <span className="track-icon">🏁</span>
          <span>Đường đua: {game.settings.trackLength} km</span>
        </div>
        <div className="track-visual">
          <div className="track-start">Start</div>
          <div className="track-line">
            {players.map(player => (
              <div
                key={player.odinhId}
                className="track-player"
                style={{ left: '2%' }}
              >
                {player.vehicle.emoji}
              </div>
            ))}
          </div>
          <div className="track-finish">🏁</div>
        </div>
      </div>

      {/* Vehicle Selection (if callback provided) */}
      {onSelectVehicle && selectedVehicle && (
        <div className="lobby-vehicle-section">
          <h3>Chọn Phương Tiện</h3>
          <div className="vehicle-grid compact">
            {vehiclesForType.map(vehicle => (
              <button
                key={vehicle.id}
                className={`vehicle-card ${selectedVehicle.id === vehicle.id ? 'selected' : ''} ${vehicle.unlockPoints > 0 ? 'locked' : ''}`}
                onClick={() => vehicle.unlockPoints === 0 && onSelectVehicle(vehicle)}
                disabled={vehicle.unlockPoints > 0}
              >
                <span className="vehicle-emoji">{vehicle.emoji}</span>
                <span className="vehicle-name">{vehicle.name}</span>
                {vehicle.unlockPoints > 0 && (
                  <span className="unlock-badge">🔒</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="lobby-actions">
        {isHost ? (
          <button
            className="start-btn"
            onClick={handleStart}
            disabled={!canStart || loading}
          >
            <Play size={20} />
            {loading ? 'Đang tải...' : canStart ? 'Bắt Đầu Đua' : `Cần ${game.settings.minPlayers} người`}
          </button>
        ) : (
          <div className="waiting-message">
            Đang chờ host bắt đầu...
          </div>
        )}

        <button className="leave-btn" onClick={handleLeave}>
          <LogOut size={18} />
          Rời Phòng
        </button>
      </div>
    </div>
  );
}
