// Game lobby/waiting room with QR code

import { QRCodeSVG } from 'qrcode.react';
import { Users } from 'lucide-react';
import type { QuizGame } from '../../types/quiz-game';
import { isImageAvatar } from '../../utils/avatar-icons';

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
  const players = Object.values(game.players);
  const playerCount = players.length;
  const canStart = playerCount >= game.settings.minPlayers;

  // Generate join URL
  const joinUrl = `${window.location.origin}?join=${game.code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(game.code);
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
            <div className="game-code">
              <span className="code-label">Mã phòng:</span>
              <span className="code-value">{game.code}</span>
              <button
                className="btn btn-small btn-outline"
                onClick={copyCode}
                title="Copy mã"
              >
                Copy
              </button>
            </div>
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
            <div className="player-list">
              {players.map((player, index) => (
                <div key={player.id} className="player-item">
                  <span className="player-rank">#{index + 1}</span>
                  <span className="player-avatar">
                    {player.avatar && isImageAvatar(player.avatar) ? (
                      <img src={player.avatar} alt="avatar" />
                    ) : (
                      player.avatar || player.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="player-name">
                    {player.name}
                    {player.isHost && <span className="host-badge">Host</span>}
                  </span>
                  {isHost && !player.isHost && (
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => onKickPlayer(player.id)}
                      title="Kick"
                    >
                      Kick
                    </button>
                  )}
                </div>
              ))}

              {playerCount < game.settings.minPlayers && (
                <div className="waiting-message">
                  Đang chờ thêm {game.settings.minPlayers - playerCount} người chơi...
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="lobby-actions">
          {isHost ? (
            <button
              className="btn btn-primary btn-large"
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? 'Bắt đầu game' : `Cần ${game.settings.minPlayers} người chơi`}
            </button>
          ) : (
            <p className="waiting-host">Đang chờ host bắt đầu...</p>
          )}
          <button
            className="btn btn-outline"
            onClick={onLeaveGame}
          >
            Rời phòng
          </button>
        </div>
      </div>
    </div>
  );
}
