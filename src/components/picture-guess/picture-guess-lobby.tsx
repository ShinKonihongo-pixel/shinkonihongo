// Picture Guess Lobby - Waiting room for multiplayer games
// Shows room code, player list, and start button for host

import { Users, Play, Image } from 'lucide-react';
import { useState } from 'react';
import type { PictureGuessGame, PictureGuessPlayer } from '../../types/picture-guess';
import { GameCodeDisplay, PlayerListGrid, LobbyActionBar, normalizePlayer } from '../shared/game-lobby';

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
  const players = Object.values(game.players);
  const normalizedPlayers = players.map(p => normalizePlayer({ ...p, odinhId: p.odinhId, isHost: p.odinhId === game.hostId }));
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
        <GameCodeDisplay
          code={game.code}
          copied={copied}
          onCopy={handleCopyCode}
          label="Mã phòng"
          className="pg-room-code-section"
        />
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
        <PlayerListGrid
          players={normalizedPlayers}
          hostId={game.hostId}
          currentPlayerId={currentPlayer?.odinhId || ''}
          maxPlayers={game.settings.maxPlayers}
          className="pg-players-list"
          maxEmptySlots={4}
        />
      </div>

      {/* Action Buttons */}
      <LobbyActionBar
        isHost={isHost || game.settings.mode === 'single'}
        canStart={canStart}
        onStart={onStart}
        onLeave={onLeave}
        startLabel="Bắt Đầu"
        disabledLabel={`Cần ${game.settings.mode === 'single' ? 1 : 2} người`}
        waitingLabel="Đang chờ host bắt đầu..."
        className="pg-lobby-actions"
        startIcon={<Play size={20} />}
      />
    </div>
  );
}
