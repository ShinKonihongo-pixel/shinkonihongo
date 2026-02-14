// Player List Grid - Reusable player list with VIP styling, host badge, kick button
// Extracted from common pattern across all game lobbies

import { X } from 'lucide-react';
import type { BaseLobbyPlayer } from './types';
import { isImageAvatar } from '../../../utils/avatar-icons';
import { getVipAvatarClasses, getVipNameClasses, isVipRole, getVipBadge } from '../../../utils/vip-styling';

interface PlayerListGridProps {
  players: BaseLobbyPlayer[];
  hostId: string;
  currentPlayerId: string;
  maxPlayers: number;
  onKickPlayer?: (playerId: string) => void;
  className?: string;
  emptySlotLabel?: string;
  maxEmptySlots?: number;
  renderExtra?: (player: BaseLobbyPlayer) => React.ReactNode;
}

export function PlayerListGrid({
  players,
  hostId,
  currentPlayerId,
  maxPlayers,
  onKickPlayer,
  className = '',
  emptySlotLabel = 'Đang chờ...',
  maxEmptySlots = 10,
  renderExtra,
}: PlayerListGridProps) {
  const isHost = currentPlayerId === hostId;

  return (
    <div className={`players-grid ${className}`}>
      {players.map(player => {
        const playerIsVip = isVipRole(player.role);
        const vipBadge = getVipBadge(player.role);
        const playerIsHost = player.id === hostId;
        const isCurrentPlayer = player.id === currentPlayerId;

        return (
          <div
            key={player.id}
            className={`player-card ${isCurrentPlayer ? 'current' : ''} ${playerIsHost ? 'host' : ''} ${playerIsVip ? 'vip-player' : ''} ${player.isBot ? 'bot' : ''}`}
          >
            <div className={getVipAvatarClasses(player.role, 'player-avatar')}>
              {player.avatar && isImageAvatar(player.avatar) ? (
                <img src={player.avatar} alt={player.displayName} />
              ) : (
                player.avatar || player.displayName.charAt(0).toUpperCase()
              )}
              {playerIsVip && <span className="vip-frame" />}
            </div>
            <div className="player-info" title={player.displayName}>
              <span className={getVipNameClasses(player.role, 'player-name')}>
                {vipBadge && <span className="vip-badge">{vipBadge}</span>}
                {player.displayName}
                {playerIsHost && <span className="host-badge">Host</span>}
              </span>
              {renderExtra?.(player)}
            </div>
            {/* Kick button for host */}
            {isHost && !playerIsHost && !isCurrentPlayer && onKickPlayer && (
              <button
                className="kick-btn"
                onClick={() => onKickPlayer(player.id)}
                title="Kick khỏi phòng"
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}

      {/* Empty slots */}
      {Array.from({ length: Math.min(maxPlayers - players.length, maxEmptySlots) }).map((_, i) => (
        <div key={`empty-${i}`} className="player-card empty">
          <div className="player-avatar empty">?</div>
          <span className="player-name">{emptySlotLabel}</span>
        </div>
      ))}
    </div>
  );
}
