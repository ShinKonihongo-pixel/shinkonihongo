// Game lobby/waiting room with QR code

import { QRCodeSVG } from 'qrcode.react';
import { Users } from 'lucide-react';
import { useState } from 'react';
import type { QuizGame } from '../../types/quiz-game';
import { GameCodeDisplay, PlayerListGrid, LobbyActionBar, normalizePlayer } from '../shared/game-lobby';

interface GameLobbyProps {
  game: QuizGame;
  isHost: boolean;
  onStartGame: () => Promise<boolean>;
  onKickPlayer: (playerId: string) => Promise<boolean>;
  onLeaveGame: () => Promise<void>;
  onInviteFriends?: () => void;
  hasFriends?: boolean;
  error: string | null;
}

export function GameLobby({
  game,
  isHost,
  onStartGame,
  onKickPlayer,
  onLeaveGame,
  onInviteFriends,
  hasFriends = false,
  error,
}: GameLobbyProps) {
  const [copied, setCopied] = useState(false);
  const players = Object.values(game.players);
  const normalizedPlayers = players.map(p => normalizePlayer({ id: p.id, name: p.name, avatar: p.avatar, isHost: p.isHost }));
  const playerCount = players.length;
  const canStart = playerCount >= game.settings.minPlayers;

  // Generate join URL
  const joinUrl = `${window.location.origin}?join=${game.code}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(game.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleStart = async () => {
    await onStartGame();
  };

  const handleKick = async (playerId: string) => {
    await onKickPlayer(playerId);
  };

  return (
    <div className="quiz-game-page">
      <div className="game-lobby">
        <div className="lobby-header">
          <h2>{game.title}</h2>
          <p className="game-info">
            {game.totalRounds} câu hỏi | {game.timePerQuestion}s mỗi câu
          </p>
        </div>

        <div className="lobby-content">
          <div className="qr-section">
            <h3>Quét mã QR để tham gia</h3>
            <div className="qr-code">
              <QRCodeSVG
                value={joinUrl}
                size={200}
                level="M"
                includeMargin
              />
            </div>
            <GameCodeDisplay
              code={game.code}
              copied={copied}
              onCopy={copyCode}
              label="Mã phòng:"
              className="game-code"
            />
            {onInviteFriends && hasFriends && (
              <button
                className="btn btn-secondary invite-friends-btn"
                onClick={onInviteFriends}
              >
                <Users size={18} />
                Mời bạn bè
              </button>
            )}
          </div>

          <div className="players-section">
            <h3>Người chơi ({playerCount}/{game.settings.maxPlayers})</h3>
            <PlayerListGrid
              players={normalizedPlayers}
              hostId={players.find(p => p.isHost)?.id || ''}
              currentPlayerId={players.find(p => p.isHost)?.id || ''}
              maxPlayers={game.settings.maxPlayers}
              onKickPlayer={handleKick}
              className="player-list"
            />
            {playerCount < game.settings.minPlayers && (
              <div className="waiting-message">
                Đang chờ thêm {game.settings.minPlayers - playerCount} người chơi...
              </div>
            )}
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <LobbyActionBar
          isHost={isHost}
          canStart={canStart}
          onStart={handleStart}
          onLeave={onLeaveGame}
          startLabel="Bắt đầu game"
          disabledLabel={`Cần ${game.settings.minPlayers} người chơi`}
          waitingLabel="Đang chờ host bắt đầu..."
          leaveLabel="Rời phòng"
        />
      </div>
    </div>
  );
}
