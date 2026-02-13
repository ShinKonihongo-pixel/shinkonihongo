// Golden Bell Lobby - Waiting room before game starts
// Shows players, game code, and start button for host

import { Users, Bell } from 'lucide-react';
import { useState } from 'react';
import type { GoldenBellGame } from '../../types/golden-bell';
import { CATEGORY_INFO } from '../../types/golden-bell';
import { GameCodeDisplay, PlayerListGrid, LobbyActionBar, normalizePlayer } from '../shared/game-lobby';

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
  const normalizedPlayers = players.map(p => normalizePlayer({ ...p, odinhId: p.odinhId, isHost: p.odinhId === game.hostId }));
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
      <GameCodeDisplay
        code={game.code}
        copied={copied}
        onCopy={copyCode}
        onShare={shareGame}
        className="golden-bell-code"
      />

      {/* Players List */}
      <div className="lobby-players">
        <div className="players-header">
          <Users size={18} />
          <span>Người chơi ({players.length}/{game.settings.maxPlayers})</span>
        </div>
        <PlayerListGrid
          players={normalizedPlayers}
          hostId={game.hostId}
          currentPlayerId={currentPlayerId}
          maxPlayers={game.settings.maxPlayers}
          onKickPlayer={onKickPlayer}
          className="golden-bell-players"
          renderExtra={() => <span className="player-status alive">Sẵn sàng</span>}
        />
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
      <LobbyActionBar
        isHost={isHost}
        canStart={canStart}
        onStart={onStart}
        onLeave={onLeave}
        startLabel="Bắt Đầu Game"
        disabledLabel={`Cần ${game.settings.minPlayers} người`}
        waitingLabel="Đang chờ host bắt đầu..."
        startIcon={<Bell size={20} />}
      />
    </div>
  );
}
