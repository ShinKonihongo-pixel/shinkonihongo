// Picture Guess Lobby - Waiting room for multiplayer games
// Shows room code, player list, and start button for host

import { Copy, Users, Play, LogOut, Crown, Check, Image } from 'lucide-react';
import { useState } from 'react';
import type { PictureGuessGame, PictureGuessPlayer } from '../../types/picture-guess';

interface PictureGuessLobbyProps {
  game: PictureGuessGame;
  currentPlayer: PictureGuessPlayer | undefined;
  isHost: boolean;
  onStart: () => void;
  onLeave: () => void;
}

export function PictureGuessLobby({
  game,
  currentPlayer,
  isHost,
  onStart,
  onLeave,
}: PictureGuessLobbyProps) {
  const [copied, setCopied] = useState(false);
  const playerCount = Object.keys(game.players).length;
  const canStart = playerCount >= (game.settings.mode === 'single' ? 1 : 2);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(game.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="picture-guess-lobby">
      {/* Room Header */}
      <div className="pg-lobby-header">
        <div className="pg-room-icon">
          <Image size={48} />
        </div>
        <h2 className="pg-room-title">{game.title}</h2>
        <p className="pg-room-subtitle">Đuổi hình bắt chữ</p>
      </div>

      {/* Room Code */}
      {game.settings.mode === 'multiplayer' && (
        <div className="pg-room-code-section">
          <p className="pg-code-label">Mã phòng</p>
          <div className="pg-code-display" onClick={handleCopyCode}>
            <span className="pg-code-value">{game.code}</span>
            <button className="pg-copy-btn" title="Sao chép mã">
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
          {copied && <span className="pg-copied-text">Đã sao chép!</span>}
          <p className="pg-code-hint">Chia sẻ mã này với bạn bè để họ tham gia</p>
        </div>
      )}

      {/* Game Settings Summary */}
      <div className="pg-lobby-settings">
        <div className="pg-setting-item">
          <span className="pg-setting-label">Số câu</span>
          <span className="pg-setting-value">{game.settings.puzzleCount}</span>
        </div>
        <div className="pg-setting-item">
          <span className="pg-setting-label">Thời gian</span>
          <span className="pg-setting-value">{game.settings.timePerPuzzle}s</span>
        </div>
        <div className="pg-setting-item">
          <span className="pg-setting-label">Cấp độ</span>
          <span className="pg-setting-value">{game.settings.jlptLevel}</span>
        </div>
        <div className="pg-setting-item">
          <span className="pg-setting-label">Gợi ý</span>
          <span className="pg-setting-value">{game.settings.allowHints ? 'Có' : 'Không'}</span>
        </div>
      </div>

      {/* Player List */}
      <div className="pg-lobby-players">
        <div className="pg-players-header">
          <Users size={20} />
          <span>Người chơi ({playerCount}/{game.settings.maxPlayers})</span>
        </div>
        <div className="pg-players-list">
          {Object.values(game.players).map(player => (
            <div
              key={player.odinhId}
              className={`pg-player-item ${player.odinhId === currentPlayer?.odinhId ? 'current' : ''}`}
            >
              <span className="pg-player-avatar">{player.avatar}</span>
              <span className="pg-player-name">{player.displayName}</span>
              {player.odinhId === game.hostId && (
                <span className="pg-host-badge" title="Host">
                  <Crown size={16} />
                </span>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.min(game.settings.maxPlayers - playerCount, 4) }).map((_, i) => (
            <div key={`empty-${i}`} className="pg-player-item empty">
              <span className="pg-player-avatar">?</span>
              <span className="pg-player-name">Đang chờ...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pg-lobby-actions">
        {isHost || game.settings.mode === 'single' ? (
          <button
            className="pg-start-btn"
            onClick={onStart}
            disabled={!canStart}
          >
            <Play size={20} />
            <span>
              {!canStart
                ? `Cần ${game.settings.mode === 'single' ? 1 : 2} người`
                : 'Bắt Đầu'}
            </span>
          </button>
        ) : (
          <div className="pg-waiting-host">
            <div className="pg-waiting-spinner"></div>
            <span>Đang chờ host bắt đầu...</span>
          </div>
        )}

        <button className="pg-leave-btn" onClick={onLeave}>
          <LogOut size={18} />
          <span>Rời Phòng</span>
        </button>
      </div>
    </div>
  );
}
