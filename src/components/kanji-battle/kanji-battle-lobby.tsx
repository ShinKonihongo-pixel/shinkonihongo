// Kanji Battle Lobby - Waiting room for players
import React from 'react';
import { X } from 'lucide-react';
import type { KanjiBattleGame, KanjiBattlePlayer } from '../../types/kanji-battle';
import { isImageAvatar } from '../../utils/avatar-icons';
import { getVipAvatarClasses, getVipNameClasses, isVipRole, getVipBadge } from '../../utils/vip-styling';

interface KanjiBattleLobbyProps {
  game: KanjiBattleGame;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export const KanjiBattleLobby: React.FC<KanjiBattleLobbyProps> = ({
  game,
  currentPlayerId,
  onStartGame,
  onAddBot,
  onLeave,
  onKickPlayer,
}) => {
  const isHost = game.hostId === currentPlayerId;
  const players = Object.values(game.players);
  const canStart = players.length >= game.settings.minPlayers;

  return (
    <div className="speed-quiz-lobby">
      <div className="speed-quiz-lobby-header">
        <button className="speed-quiz-back-btn" onClick={onLeave}>
          ← Rời phòng
        </button>
        <div className="room-info">
          <h2>⚔️ {game.title}</h2>
          <div className="room-code">
            <span className="label">Mã phòng:</span>
            <span className="code">{game.code}</span>
            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(game.code)}
              title="Sao chép"
            >
              📋
            </button>
          </div>
        </div>
      </div>

      <div className="speed-quiz-lobby-settings">
        <div className="setting-item">
          <span className="icon">{game.settings.gameMode === 'read' ? '📖' : '✍️'}</span>
          <span>{game.settings.gameMode === 'read' ? 'Đọc Kanji' : 'Viết Kanji'}</span>
        </div>
        <div className="setting-item">
          <span className="icon">🏷️</span>
          <span>{game.settings.selectedLevels.join(', ')}</span>
        </div>
        <div className="setting-item">
          <span className="icon">📝</span>
          <span>{game.settings.totalRounds} câu hỏi</span>
        </div>
        <div className="setting-item">
          <span className="icon">⏱️</span>
          <span>{game.settings.timePerQuestion}s/câu</span>
        </div>
        <div className="setting-item">
          <span className="icon">✨</span>
          <span>{game.settings.skillsEnabled ? 'Có kỹ năng' : 'Không kỹ năng'}</span>
        </div>
      </div>

      <div className="speed-quiz-lobby-players">
        <div className="players-header">
          <h3>👥 Người chơi ({players.length}/{game.settings.maxPlayers})</h3>
          {isHost && players.length < game.settings.maxPlayers && (
            <button className="speed-quiz-btn secondary small" onClick={onAddBot}>
              🤖 Thêm Bot
            </button>
          )}
        </div>

        <div className="players-grid">
          {players.map((player: KanjiBattlePlayer) => {
            const playerIsVip = isVipRole(player.role);
            const vipBadge = getVipBadge(player.role);

            return (
              <div
                key={player.odinhId}
                className={`player-card ${player.odinhId === game.hostId ? 'host' : ''} ${
                  player.isBot ? 'bot' : ''
                } ${playerIsVip ? 'vip-player' : ''}`}
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
                  </span>
                  {player.odinhId === game.hostId && (
                    <span className="host-badge">👑 Chủ phòng</span>
                  )}
                  {player.isBot && <span className="bot-badge">🤖</span>}
                </div>
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

          {Array.from({ length: game.settings.maxPlayers - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card empty">
              <div className="player-avatar">?</div>
              <div className="player-info">
                <span className="player-name">Chờ người chơi...</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="speed-quiz-lobby-actions">
        {isHost ? (
          <button
            className="speed-quiz-btn primary large"
            onClick={onStartGame}
            disabled={!canStart}
          >
            {canStart ? '🚀 Bắt Đầu' : `Cần ít nhất ${game.settings.minPlayers} người`}
          </button>
        ) : (
          <div className="waiting-message">
            <span className="spinner">⏳</span>
            <span>Đợi chủ phòng bắt đầu...</span>
          </div>
        )}
      </div>
    </div>
  );
};
