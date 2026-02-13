// Word Match Lobby - Waiting room for players
import React, { useState } from 'react';
import type { WordMatchGame, WordMatchPlayer } from '../../types/word-match';
import { GameCodeDisplay, PlayerListGrid, LobbyActionBar, normalizePlayer } from '../shared/game-lobby';

interface WordMatchLobbyProps {
  game: WordMatchGame;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export const WordMatchLobby: React.FC<WordMatchLobbyProps> = ({
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
    <div className="word-match-lobby">
      <div className="word-match-lobby-header">
        <button className="word-match-back-btn" onClick={onLeave}>
          ← Rời phòng
        </button>
        <div className="room-info">
          <h2>🔗 {game.title}</h2>
          <GameCodeDisplay
            code={game.code}
            copied={copied}
            onCopy={copyCode}
            label="Mã phòng:"
            className="room-code"
          />
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
        className="word-match-lobby-actions"
      />
    </div>
  );
};
