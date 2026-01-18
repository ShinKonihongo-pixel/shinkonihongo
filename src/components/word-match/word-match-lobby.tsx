// Word Match Lobby - Waiting room for players
import React from 'react';
import type { WordMatchGame, WordMatchPlayer } from '../../types/word-match';

interface WordMatchLobbyProps {
  game: WordMatchGame;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeave: () => void;
}

export const WordMatchLobby: React.FC<WordMatchLobbyProps> = ({
  game,
  currentPlayerId,
  onStartGame,
  onAddBot,
  onLeave,
}) => {
  const isHost = game.hostId === currentPlayerId;
  const players = Object.values(game.players);
  const canStart = players.length >= game.settings.minPlayers;

  return (
    <div className="word-match-lobby">
      <div className="word-match-lobby-header">
        <button className="word-match-back-btn" onClick={onLeave}>
          ← Rời phòng
        </button>
        <div className="room-info">
          <h2>🔗 {game.title}</h2>
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

      <div className="word-match-lobby-settings">
        <div className="setting-item">
          <span className="icon">📝</span>
          <span>{game.settings.totalRounds} câu</span>
        </div>
        <div className="setting-item">
          <span className="icon">⏱️</span>
          <span>{game.settings.timePerRound}s/câu</span>
        </div>
        <div className="setting-item">
          <span className="icon">🔗</span>
          <span>5 cặp/câu</span>
        </div>
        <div className="setting-item">
          <span className="icon">🎡</span>
          <span>Vòng quay mỗi 5 câu</span>
        </div>
      </div>

      <div className="word-match-lobby-players">
        <div className="players-header">
          <h3>👥 Người chơi ({players.length}/{game.settings.maxPlayers})</h3>
          {isHost && players.length < game.settings.maxPlayers && (
            <button className="word-match-btn secondary small" onClick={onAddBot}>
              🤖 Thêm Bot
            </button>
          )}
        </div>

        <div className="players-grid">
          {players.map((player: WordMatchPlayer) => (
            <div
              key={player.odinhId}
              className={`player-card ${player.odinhId === game.hostId ? 'host' : ''} ${
                player.isBot ? 'bot' : ''
              }`}
            >
              <div className="player-avatar">{player.avatar}</div>
              <div className="player-info">
                <span className="player-name">{player.displayName}</span>
                {player.odinhId === game.hostId && (
                  <span className="host-badge">👑 Chủ phòng</span>
                )}
                {player.isBot && <span className="bot-badge">🤖</span>}
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: game.settings.maxPlayers - players.length }).map(
            (_, i) => (
              <div key={`empty-${i}`} className="player-card empty">
                <div className="player-avatar">?</div>
                <div className="player-info">
                  <span className="player-name">Chờ người chơi...</span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="word-match-lobby-actions">
        {isHost ? (
          <button
            className="word-match-btn primary large"
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
