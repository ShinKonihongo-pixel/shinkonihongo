// Bingo Game Lobby - Waiting room before game starts

import { Users, Play } from 'lucide-react';
import { useState } from 'react';
import type { BingoGame } from '../../types/bingo-game';
import { GameCodeDisplay, PlayerListGrid, LobbyActionBar, normalizePlayer } from '../shared/game-lobby';

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
  const normalizedPlayers = players.map(p => normalizePlayer({ ...p, odinhId: p.odinhId, isHost: p.odinhId === game.hostId }));
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
        <GameCodeDisplay
          code={game.code}
          copied={copied}
          onCopy={copyCode}
          label="Mã Phòng:"
          className="room-code-display"
        />
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
        <PlayerListGrid
          players={normalizedPlayers}
          hostId={game.hostId}
          currentPlayerId={currentPlayerId}
          maxPlayers={game.settings.maxPlayers}
          onKickPlayer={onKickPlayer}
          maxEmptySlots={4}
        />
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
      <LobbyActionBar
        isHost={isHost}
        canStart={canStart}
        onStart={onStartGame}
        onLeave={onLeaveGame}
        startLabel="Bắt Đầu"
        disabledLabel="Cần thêm người chơi"
        waitingLabel="Đang chờ chủ phòng bắt đầu..."
        loading={loading}
        startIcon={<Play size={20} />}
      />
    </div>
  );
}
