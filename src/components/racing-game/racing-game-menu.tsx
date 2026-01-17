// Racing Game Menu - Main menu for boat/horse racing game
// Allows players to create or join a race

import { useState } from 'react';
import { Ship, Users, Plus, ArrowRight, Trophy, Zap, AlertCircle } from 'lucide-react';
import type { VehicleType, RacingGame } from '../../types/racing-game';

interface RacingGameMenuProps {
  raceType?: VehicleType;
  availableRooms: RacingGame[];
  loading?: boolean;
  error?: string | null;
  onCreateGame: ((raceType: VehicleType) => void) | (() => void);
  onJoinGame: (code: string) => void;
  onSelectRoom?: (game: RacingGame) => void;
}

export function RacingGameMenu({
  raceType,
  availableRooms,
  loading,
  error,
  onCreateGame,
  onJoinGame,
  onSelectRoom,
}: RacingGameMenuProps) {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      onJoinGame(joinCode.trim());
    }
  };

  const waitingRooms = availableRooms.filter(r => r.status === 'waiting');
  const isSingleType = !!raceType;

  const handleCreateClick = (type: VehicleType) => {
    if (typeof onCreateGame === 'function') {
      if (isSingleType) {
        (onCreateGame as () => void)();
      } else {
        (onCreateGame as (raceType: VehicleType) => void)(type);
      }
    }
  };

  const handleRoomClick = (room: RacingGame) => {
    if (onSelectRoom) {
      onSelectRoom(room);
    } else {
      onJoinGame(room.code);
    }
  };

  return (
    <div className={`racing-menu ${raceType ? raceType : ''}`}>
      {/* Error Message */}
      {error && (
        <div className="racing-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="racing-loading">
          <div className="loading-spinner" />
          <span>Đang tải...</span>
        </div>
      )}

      {/* Single Type Mode - Just create button */}
      {isSingleType ? (
        <div className="single-race-actions">
          <button
            className={`create-race-btn ${raceType}`}
            onClick={() => handleCreateClick(raceType)}
            disabled={loading}
          >
            <Plus size={20} />
            <span>Tạo Phòng Mới</span>
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="racing-menu-header">
            <div className="racing-title">
              <span className="racing-icon">🏁</span>
              <h1>Đua Thuyền & Ngựa</h1>
              <span className="racing-subtitle">Học Tiếng Nhật</span>
            </div>
            <p className="racing-desc">
              Trả lời đúng để tăng tốc - Vượt qua đối thủ để về đích!
            </p>
          </div>

          {/* Race Type Selection */}
          <div className="race-type-section">
            <h2>Chọn Loại Đua</h2>
            <div className="race-type-grid">
              <button className="race-type-card boat" onClick={() => handleCreateClick('boat')}>
                <div className="race-type-icon">
                  <Ship size={48} />
                  <span className="race-emoji">🚣</span>
                </div>
                <h3>Đua Thuyền</h3>
                <p>Lướt sóng trên đại dương</p>
                <div className="race-type-action">
                  <Plus size={16} /> Tạo Phòng
                </div>
              </button>

              <button className="race-type-card horse" onClick={() => handleCreateClick('horse')}>
                <div className="race-type-icon">
                  <Zap size={48} />
                  <span className="race-emoji">🏇</span>
                </div>
                <h3>Đua Ngựa</h3>
                <p>Phi nước đại trên thảo nguyên</p>
                <div className="race-type-action">
                  <Plus size={16} /> Tạo Phòng
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Join Game Section */}
      <div className="join-section">
        <h2>Tham Gia Phòng</h2>

        {!showJoinInput ? (
          <button className="join-code-btn" onClick={() => setShowJoinInput(true)}>
            <ArrowRight size={20} />
            <span>Nhập mã phòng</span>
          </button>
        ) : (
          <form className="join-code-form" onSubmit={handleJoinSubmit}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Nhập mã 6 số"
              maxLength={6}
              autoFocus
            />
            <button type="submit" disabled={joinCode.length !== 6}>
              Tham Gia
            </button>
            <button type="button" className="cancel-btn" onClick={() => {
              setShowJoinInput(false);
              setJoinCode('');
            }}>
              Hủy
            </button>
          </form>
        )}
      </div>

      {/* Available Rooms */}
      {waitingRooms.length > 0 && (
        <div className="rooms-section">
          <h2>
            <Users size={20} />
            Phòng Đang Chờ ({waitingRooms.length})
          </h2>
          <div className="rooms-list">
            {waitingRooms.map(room => (
              <div key={room.id} className="room-card" onClick={() => handleRoomClick(room)}>
                <div className="room-icon">
                  {room.settings.raceType === 'boat' ? '🚣' : '🏇'}
                </div>
                <div className="room-info">
                  <h4>{room.title}</h4>
                  <div className="room-meta">
                    <span>{room.settings.raceType === 'boat' ? 'Đua Thuyền' : 'Đua Ngựa'}</span>
                    <span>•</span>
                    <span>{room.settings.jlptLevel}</span>
                    <span>•</span>
                    <span>{Object.keys(room.players).length}/{room.settings.maxPlayers} người</span>
                  </div>
                </div>
                <button className="room-join-btn">
                  Tham Gia <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="features-section">
        <div className="feature-item">
          <Trophy size={24} />
          <span>Mở khóa xe đua mới</span>
        </div>
        <div className="feature-item">
          <Zap size={24} />
          <span>Hộp mù bất ngờ</span>
        </div>
        <div className="feature-item">
          <Users size={24} />
          <span>Đua cùng bạn bè</span>
        </div>
      </div>
    </div>
  );
}
