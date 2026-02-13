// Kanji Battle Lobby - Waiting room for players
import React, { useState } from 'react';
import type { KanjiBattleGame, KanjiBattlePlayer } from '../../types/kanji-battle';
import { GameCodeDisplay, PlayerListGrid, LobbyActionBar, normalizePlayer } from '../shared/game-lobby';

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
  const [copied, setCopied] = useState(false);
  const isHost = game.hostId === currentPlayerId;
  const players = Object.values(game.players);
  const normalizedPlayers = players.map(p => normalizePlayer({ ...p, odinhId: p.odinhId, isHost: p.odinhId === game.hostId, isBot: p.isBot }));
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

  return (
    <div className="speed-quiz-lobby">
      <div className="speed-quiz-lobby-header">
        <button className="speed-quiz-back-btn" onClick={onLeave}>
          ← Rời phòng
        </button>
        <div className="room-info">
          <h2>⚔️ {game.title}</h2>
          <GameCodeDisplay
            code={game.code}
            copied={copied}
            onCopy={copyCode}
            label="Mã phòng:"
            className="room-code"
          />
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

        <PlayerListGrid
          players={normalizedPlayers}
          hostId={game.hostId}
          currentPlayerId={currentPlayerId}
          maxPlayers={game.settings.maxPlayers}
          onKickPlayer={onKickPlayer}
          emptySlotLabel="Chờ người chơi..."
          maxEmptySlots={game.settings.maxPlayers}
          renderExtra={(player) => (
            <>
              {player.isBot && <span className="bot-badge">🤖</span>}
            </>
          )}
        />
      </div>

      <LobbyActionBar
        isHost={isHost}
        canStart={canStart}
        onStart={onStartGame}
        onLeave={() => {}}
        startLabel="🚀 Bắt Đầu"
        disabledLabel={`Cần ít nhất ${game.settings.minPlayers} người`}
        waitingLabel="Đợi chủ phòng bắt đầu..."
        className="speed-quiz-lobby-actions"
      />
    </div>
  );
};
