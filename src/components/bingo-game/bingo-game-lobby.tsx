// Bingo Game Lobby - Waiting room before game starts

import { Copy, Users, Play, LogOut, Check, X } from 'lucide-react';
import { useState } from 'react';
import type { BingoGame } from '../../types/bingo-game';
import { isImageAvatar } from '../../utils/avatar-icons';
import { getVipAvatarClasses, getVipNameClasses, isVipRole, getVipBadge } from '../../utils/vip-styling';

interface BingoGameLobbyProps {
  game: BingoGame;
  isHost: boolean;
  currentPlayerId: string;
  loading: boolean;
  onStartGame: () => void;
  onLeaveGame: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export function BingoGameLobby({
  game,
  isHost,
  currentPlayerId,
  loading,
  onStartGame,
  onLeaveGame,
  onKickPlayer,
}: BingoGameLobbyProps) {
  const [copied, setCopied] = useState(false);
  const players = Object.values(game.players);
  const canStart = players.length >= game.settings.minPlayers;

  const copyCode = () => {
    navigator.clipboard.writeText(game.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bingo-lobby">
      {/* Header with room code */}
      <div className="lobby-header">
        <h2>{game.title}</h2>
        <div className="room-code-display" onClick={copyCode}>
          <span className="code-label">Mã Phòng:</span>
          <span className="code-value">{game.code}</span>
          <button className="copy-btn">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Settings info */}
      <div className="lobby-settings">
        <div className="setting-item">
          <Users size={16} />
          <span>{players.length}/{game.settings.maxPlayers} người chơi</span>
        </div>
        <div className="setting-item">
          <span>🎯</span>
          <span>6 dãy × 5 số</span>
        </div>
        {game.settings.skillsEnabled && (
          <div className="setting-item">
            <span>✨</span>
            <span>Kỹ năng đặc biệt</span>
          </div>
        )}
      </div>

      {/* Players list */}
      <div className="lobby-players">
        <h3>Người Chơi</h3>
        <div className="players-grid">
          {players.map(player => {
            const playerIsVip = isVipRole(player.role);
            const vipBadge = getVipBadge(player.role);

            return (
              <div
                key={player.odinhId}
                className={`player-card ${player.odinhId === currentPlayerId ? 'is-me' : ''} ${player.odinhId === game.hostId ? 'is-host' : ''} ${playerIsVip ? 'vip-player' : ''}`}
              >
                <div className={getVipAvatarClasses(player.role, 'player-avatar')}>
                  {player.avatar && isImageAvatar(player.avatar) ? (
                    <img src={player.avatar} alt={player.displayName} />
                  ) : (
                    player.avatar
                  )}
                  {playerIsVip && <span className="vip-frame" />}
                </div>
                <div className={getVipNameClasses(player.role, 'player-name')}>
                  {vipBadge && <span className="vip-badge">{vipBadge}</span>}
                  {player.displayName}
                </div>
                {player.odinhId === game.hostId && (
                  <span className="host-badge">👑</span>
                )}
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
          {Array.from({ length: Math.min(game.settings.maxPlayers - players.length, 4) }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card empty">
              <div className="player-avatar">?</div>
              <div className="player-name">Đang chờ...</div>
            </div>
          ))}
        </div>
      </div>

      {/* Waiting message */}
      <div className="lobby-waiting">
        {!canStart ? (
          <p>⏳ Cần ít nhất {game.settings.minPlayers} người để bắt đầu</p>
        ) : (
          <p>✅ Sẵn sàng! Chủ phòng có thể bắt đầu</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="lobby-actions">
        {isHost ? (
          <button
            className="start-btn"
            onClick={onStartGame}
            disabled={!canStart || loading}
          >
            <Play size={20} />
            {loading ? 'Đang bắt đầu...' : 'Bắt Đầu'}
          </button>
        ) : (
          <div className="waiting-for-host">
            <span className="loading-dots">⏳</span>
            Đang chờ chủ phòng bắt đầu...
          </div>
        )}

        <button className="leave-btn" onClick={onLeaveGame}>
          <LogOut size={18} />
          Rời Phòng
        </button>
      </div>
    </div>
  );
}
