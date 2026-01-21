// Golden Bell Lobby - Waiting room before game starts
// Shows players, game code, and start button for host

import { Copy, Play, LogOut, Users, Share2, Check, Bell, X } from 'lucide-react';
import { useState } from 'react';
import type { GoldenBellGame } from '../../types/golden-bell';
import { CATEGORY_INFO } from '../../types/golden-bell';
import { isImageAvatar } from '../../utils/avatar-icons';
import { getVipAvatarClasses, getVipNameClasses, isVipRole, getVipBadge } from '../../utils/vip-styling';

interface GoldenBellLobbyProps {
  game: GoldenBellGame;
  isHost: boolean;
  currentPlayerId: string;
  onStart: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export function GoldenBellLobby({
  game,
  isHost,
  currentPlayerId,
  onStart,
  onLeave,
  onKickPlayer,
}: GoldenBellLobbyProps) {
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
    const url = `${window.location.origin}/golden-bell?join=${game.code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: game.title,
          text: `Tham gia Rung Chuông Vàng "${game.title}" cùng mình!`,
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
    <div className="golden-bell-lobby">
      {/* Header */}
      <div className="lobby-header golden-bell-header">
        <div className="lobby-icon bell-icon">
          <Bell size={40} />
        </div>
        <div className="lobby-info">
          <h2>{game.title}</h2>
          <div className="lobby-meta">
            <span>{game.settings.jlptLevel}</span>
            <span>•</span>
            <span>{game.settings.questionCount} câu hỏi</span>
            <span>•</span>
            <span>{game.settings.timePerQuestion}s/câu</span>
          </div>
          <div className="lobby-categories">
            {game.settings.categories.map(cat => (
              <span key={cat} className="category-tag" style={{ background: CATEGORY_INFO[cat].color }}>
                {CATEGORY_INFO[cat].emoji} {CATEGORY_INFO[cat].name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Game Code */}
      <div className="lobby-code-section golden-bell-code">
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
        <div className="players-grid golden-bell-players">
          {players.map(player => {
            const playerIsVip = isVipRole(player.role);
            const vipBadge = getVipBadge(player.role);

            return (
              <div
                key={player.odinhId}
                className={`player-card ${player.odinhId === currentPlayerId ? 'current' : ''} ${player.odinhId === game.hostId ? 'host' : ''} ${playerIsVip ? 'vip-player' : ''}`}
              >
                <div className={getVipAvatarClasses(player.role, 'player-avatar')}>
                  {player.avatar && isImageAvatar(player.avatar) ? (
                    <img src={player.avatar} alt={player.displayName} />
                  ) : (
                    player.avatar
                  )}
                  {playerIsVip && <span className="vip-frame" />}
                </div>
                <div className="player-info">
                  <span className={getVipNameClasses(player.role, 'player-name')}>
                    {vipBadge && <span className="vip-badge">{vipBadge}</span>}
                    {player.displayName}
                    {player.odinhId === game.hostId && <span className="host-badge">Host</span>}
                  </span>
                  <span className="player-status alive">Sẵn sàng</span>
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
          {Array.from({ length: Math.min(game.settings.maxPlayers - players.length, 10) }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card empty">
              <div className="player-avatar empty">?</div>
              <span className="player-name">Đang chờ...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game Rules Preview */}
      <div className="lobby-rules">
        <h3>Luật chơi</h3>
        <ul>
          <li>Trả lời sai = Bị loại khỏi game</li>
          <li>Không trả lời = Bị loại</li>
          <li>Người cuối cùng tồn tại = Chiến thắng</li>
          <li>Nếu hết câu hỏi mà còn nhiều người = Ai đúng nhiều nhất thắng</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="lobby-actions">
        {isHost ? (
          <button
            className="start-btn golden-bell-start"
            onClick={onStart}
            disabled={!canStart}
          >
            <Play size={20} />
            {canStart ? 'Bắt Đầu Game' : `Cần ${game.settings.minPlayers} người`}
          </button>
        ) : (
          <div className="waiting-message">
            <Bell size={24} className="bell-waiting" />
            Đang chờ host bắt đầu...
          </div>
        )}

        <button className="leave-btn" onClick={onLeave}>
          <LogOut size={18} />
          Rời Phòng
        </button>
      </div>
    </div>
  );
}
