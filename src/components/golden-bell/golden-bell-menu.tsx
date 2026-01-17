// Golden Bell Menu - Main menu for the elimination quiz game
// Allows players to create or join a game

import { useState } from 'react';
import { Bell, Users, Plus, ArrowRight, Trophy, Zap, Target, Crown } from 'lucide-react';
import type { GoldenBellGame } from '../../types/golden-bell';

interface GoldenBellMenuProps {
  availableRooms: GoldenBellGame[];
  onCreateGame: () => void;
  onJoinGame: (code: string) => void;
  onSelectRoom: (game: GoldenBellGame) => void;
}

export function GoldenBellMenu({
  availableRooms,
  onCreateGame,
  onJoinGame,
  onSelectRoom,
}: GoldenBellMenuProps) {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      onJoinGame(joinCode.trim());
    }
  };

  return (
    <div className="golden-bell-menu">
      {/* Header */}
      <div className="menu-header golden-bell-header">
        <div className="header-icon bell-icon">
          <Bell size={48} />
        </div>
        <h1>Rung Chuông Vàng</h1>
        <p>Trả lời đúng để tồn tại - Người cuối cùng là người chiến thắng!</p>
      </div>

      {/* Game Mode */}
      <div className="menu-section">
        <h2>Tạo Phòng Mới</h2>
        <div className="game-modes">
          <button className="game-mode-btn golden-bell-mode" onClick={onCreateGame}>
            <div className="mode-icon">
              <Crown size={32} />
            </div>
            <div className="mode-info">
              <span className="mode-name">Rung Chuông Vàng</span>
              <span className="mode-desc">Trả lời sai = Bị loại</span>
            </div>
            <Plus size={24} className="mode-action" />
          </button>
        </div>
      </div>

      {/* Join Game */}
      <div className="menu-section">
        <h2>Tham Gia Phòng</h2>
        {!showJoinInput ? (
          <button className="join-toggle-btn" onClick={() => setShowJoinInput(true)}>
            <ArrowRight size={20} />
            Nhập mã phòng
          </button>
        ) : (
          <form className="join-form" onSubmit={handleJoinSubmit}>
            <input
              type="text"
              placeholder="Nhập mã 6 số"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoFocus
            />
            <button type="submit" disabled={joinCode.length !== 6}>
              Tham Gia
            </button>
          </form>
        )}
      </div>

      {/* Available Rooms */}
      {availableRooms.length > 0 && (
        <div className="menu-section">
          <h2>Phòng Đang Chờ</h2>
          <div className="room-list">
            {availableRooms.map((room) => (
              <button
                key={room.id}
                className="room-item golden-bell-room"
                onClick={() => onSelectRoom(room)}
              >
                <div className="room-icon">
                  <Bell size={24} />
                </div>
                <div className="room-info">
                  <span className="room-title">{room.title}</span>
                  <span className="room-meta">
                    {room.settings.jlptLevel} • {room.settings.questionCount} câu hỏi
                  </span>
                </div>
                <div className="room-players">
                  <Users size={16} />
                  <span>{Object.keys(room.players).length}/{room.settings.maxPlayers}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game Features */}
      <div className="menu-features">
        <div className="feature-item">
          <Target size={24} />
          <span>Loại trừ</span>
          <p>Trả lời sai = Bị loại khỏi game</p>
        </div>
        <div className="feature-item">
          <Zap size={24} />
          <span>Nhanh nhạy</span>
          <p>Thời gian giới hạn cho mỗi câu</p>
        </div>
        <div className="feature-item">
          <Trophy size={24} />
          <span>Chiến thắng</span>
          <p>Người cuối cùng tồn tại!</p>
        </div>
      </div>
    </div>
  );
}
