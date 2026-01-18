// Bingo Game Menu - Entry point for creating/joining bingo games

import { useState } from 'react';
import { Plus, Users, HelpCircle } from 'lucide-react';
import type { BingoGame } from '../../types/bingo-game';

interface BingoGameMenuProps {
  availableRooms: BingoGame[];
  loading: boolean;
  error: string | null;
  onCreateGame: () => void;
  onJoinGame: (code: string) => void;
  onShowGuide: () => void;
}

export function BingoGameMenu({
  availableRooms,
  loading,
  error,
  onCreateGame,
  onJoinGame,
  onShowGuide,
}: BingoGameMenuProps) {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleJoin = () => {
    if (joinCode.length >= 4) {
      onJoinGame(joinCode);
      setShowJoinModal(false);
      setJoinCode('');
    }
  };

  return (
    <div className="bingo-menu">
      {/* Error message */}
      {error && (
        <div className="bingo-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="bingo-menu-actions">
        <button
          className="bingo-menu-btn primary"
          onClick={onCreateGame}
          disabled={loading}
        >
          <Plus size={24} />
          <span>Tạo Phòng Mới</span>
        </button>

        <button
          className="bingo-menu-btn secondary"
          onClick={() => setShowJoinModal(true)}
          disabled={loading}
        >
          <Users size={24} />
          <span>Tham Gia Phòng</span>
        </button>

        <button
          className="bingo-menu-btn guide"
          onClick={onShowGuide}
        >
          <HelpCircle size={24} />
          <span>Hướng Dẫn</span>
        </button>
      </div>

      {/* Available rooms */}
      {availableRooms.length > 0 && (
        <div className="bingo-rooms-list">
          <h3>Phòng Đang Chờ</h3>
          {availableRooms.map(room => (
            <div key={room.id} className="bingo-room-card">
              <div className="room-info">
                <span className="room-title">{room.title}</span>
                <span className="room-code">#{room.code}</span>
              </div>
              <div className="room-players">
                <Users size={16} />
                <span>{Object.keys(room.players).length}/{room.settings.maxPlayers}</span>
              </div>
              <button
                className="room-join-btn"
                onClick={() => onJoinGame(room.code)}
              >
                Vào
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Join modal */}
      {showJoinModal && (
        <div className="bingo-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="bingo-modal" onClick={e => e.stopPropagation()}>
            <h3>Nhập Mã Phòng</h3>
            <input
              type="text"
              className="bingo-code-input"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="XXXXXX"
              maxLength={6}
              autoFocus
            />
            <div className="bingo-modal-actions">
              <button className="btn-cancel" onClick={() => setShowJoinModal(false)}>
                Hủy
              </button>
              <button
                className="btn-join"
                onClick={handleJoin}
                disabled={joinCode.length < 4}
              >
                Tham Gia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
