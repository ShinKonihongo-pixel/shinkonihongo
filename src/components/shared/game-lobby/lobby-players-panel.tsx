// Lobby Players Panel — Players header with capacity bar + grid + waiting hint
// Reusable across all premium game lobbies

import { Users } from 'lucide-react';
import { PlayerListGrid } from './player-list-grid';
import type { BaseLobbyPlayer } from './types';

interface LobbyPlayersPanelProps {
  players: BaseLobbyPlayer[];
  hostId: string;
  currentPlayerId: string;
  maxPlayers: number;
  playerCount: number;
  fillPercent: number;
  minPlayers: number;
  onKickPlayer?: (playerId: string) => void;
}

export function LobbyPlayersPanel({
  players,
  hostId,
  currentPlayerId,
  maxPlayers,
  playerCount,
  fillPercent,
  minPlayers,
  onKickPlayer,
}: LobbyPlayersPanelProps) {
  return (
    <>
      <div className="pl-lobby-players-header">
        <div className="pl-lobby-players-title">
          <Users size={18} />
          <span>Người chơi</span>
        </div>
        <div className="pl-lobby-capacity">
          <span className="pl-lobby-players-count">
            {playerCount}<span className="pl-lobby-players-max">/{maxPlayers}</span>
          </span>
          <div className="pl-lobby-capacity-bar">
            <div className="pl-lobby-capacity-fill" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="pl-lobby-players-grid-wrap">
        <PlayerListGrid
          players={players}
          hostId={hostId}
          currentPlayerId={currentPlayerId}
          maxPlayers={maxPlayers}
          onKickPlayer={onKickPlayer}
          className="pl-lobby-players-grid"
          maxEmptySlots={6}
        />
      </div>

      {playerCount < minPlayers && (
        <div className="pl-lobby-waiting-hint">
          <div className="pl-lobby-waiting-dots"><span /><span /><span /></div>
          Đang chờ thêm {minPlayers - playerCount} người chơi
        </div>
      )}
    </>
  );
}
