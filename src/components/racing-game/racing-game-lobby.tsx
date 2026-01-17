// Racing Game Lobby - Waiting room before race starts
// Shows players, game code, and start button for host

import { Copy, Play, LogOut, Users, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import type { RacingGame, RacingVehicle } from '../../types/racing-game';
import { DEFAULT_VEHICLES } from '../../types/racing-game';
import { isImageAvatar } from '../../utils/avatar-icons';

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
}: RacingGameLobbyProps) {
  const handleStart = onStartGame || onStart;
  const handleLeave = onLeaveGame || onLeave;
  const vehiclesForType = DEFAULT_VEHICLES.filter(v => v.type === game.settings.raceType);
  const [copied, setCopied] = useState(false);

  const players = Object.values(game.players);
  const canStart = players.length >= game.settings.minPlayers;

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
            <span>{game.settings.raceType === 'boat' ? 'Đua Thuyền' : 'Đua Ngựa'}</span>
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
        </div>
        <div className="players-grid">
          {players.map(player => (
            <div
              key={player.odinhId}
              className={`player-card ${player.odinhId === currentPlayerId ? 'current' : ''} ${player.odinhId === game.hostId ? 'host' : ''}`}
            >
              <div className="player-avatar">
                {player.avatar && isImageAvatar(player.avatar) ? (
                  <img src={player.avatar} alt={player.displayName} />
                ) : (
                  player.avatar || player.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="player-info">
                <span className="player-name">
                  {player.displayName}
                  {player.odinhId === game.hostId && <span className="host-badge">Host</span>}
                </span>
                <span className="player-vehicle">
                  {player.vehicle.emoji} {player.vehicle.name}
                </span>
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: game.settings.maxPlayers - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card empty">
              <div className="player-avatar empty">?</div>
              <span className="player-name">Đang chờ...</span>
            </div>
          ))}
        </div>
      </div>

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
