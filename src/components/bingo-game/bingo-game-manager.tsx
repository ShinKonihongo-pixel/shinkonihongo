// Bingo Game Manager - Admin interface for managing Bingo game settings
// Allows viewing rooms, configuring defaults, and viewing statistics

import { useState } from 'react';
import { ArrowLeft, Settings, Users, History, Trash2, Eye, Check } from 'lucide-react';
import type { BingoGameSettings } from '../../types/bingo-game';
import { DEFAULT_BINGO_SETTINGS } from '../../types/bingo-game';

interface BingoGameManagerProps {
  onClose: () => void;
}

type ManagerView = 'main' | 'settings' | 'rooms' | 'history';

// Mock data for active rooms (in real app, would come from server)
interface BingoRoom {
  id: string;
  code: string;
  title: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  currentTurn: number;
  createdAt: string;
}

export function BingoGameManager({ onClose }: BingoGameManagerProps) {
  const [view, setView] = useState<ManagerView>('main');
  const [settings, setSettings] = useState<BingoGameSettings>(DEFAULT_BINGO_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Mock active rooms (in real app, fetch from server)
  const [activeRooms] = useState<BingoRoom[]>([
    // Empty for now - would be populated from database
  ]);

  // Mock history (in real app, fetch from server)
  const [gameHistory] = useState<BingoRoom[]>([
    // Empty for now - would be populated from database
  ]);

  // Handle save settings
  const handleSaveSettings = () => {
    setSaveStatus('saving');
    // Simulate save operation
    setTimeout(() => {
      setSaveStatus('saved');
      // Reset after showing success
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  // Render main menu
  const renderMainView = () => (
    <div className="bingo-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={onClose}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-title">
          <span className="header-icon">🎱</span>
          <h3>Quản Lý Bingo</h3>
        </div>
      </div>

      <div className="manager-cards">
        {/* Settings Card */}
        <div className="manager-card" onClick={() => setView('settings')}>
          <div className="card-icon settings">
            <Settings size={28} />
          </div>
          <div className="card-info">
            <h4>Cài Đặt Mặc Định</h4>
            <p>Cấu hình số dãy, số người chơi, kỹ năng</p>
          </div>
          <span className="card-arrow">→</span>
        </div>

        {/* Active Rooms Card */}
        <div className="manager-card" onClick={() => setView('rooms')}>
          <div className="card-icon rooms">
            <Users size={28} />
          </div>
          <div className="card-info">
            <h4>Phòng Đang Chơi</h4>
            <p>{activeRooms.length} phòng đang hoạt động</p>
          </div>
          <span className="card-arrow">→</span>
        </div>

        {/* History Card */}
        <div className="manager-card" onClick={() => setView('history')}>
          <div className="card-icon history">
            <History size={28} />
          </div>
          <div className="card-info">
            <h4>Lịch Sử</h4>
            <p>Xem lại các ván đã chơi</p>
          </div>
          <span className="card-arrow">→</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="manager-stats">
        <h4>Thống Kê</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{activeRooms.length}</span>
            <span className="stat-label">Phòng Đang Chơi</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{gameHistory.length}</span>
            <span className="stat-label">Ván Đã Chơi</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">0</span>
            <span className="stat-label">Người Chơi Online</span>
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="manager-info">
        <h4>Thông Tin Game</h4>
        <div className="info-list">
          <div className="info-item">
            <span className="info-label">Số dãy mỗi người:</span>
            <span className="info-value">{settings.rowsPerPlayer} dãy × {settings.numbersPerRow} số</span>
          </div>
          <div className="info-item">
            <span className="info-label">Phạm vi số:</span>
            <span className="info-value">{settings.numberRange[0]} - {settings.numberRange[1]}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Kỹ năng đặc biệt:</span>
            <span className="info-value">{settings.skillsEnabled ? 'Bật' : 'Tắt'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Kỹ năng sau mỗi:</span>
            <span className="info-value">{settings.skillInterval} lượt</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render settings view
  const renderSettingsView = () => (
    <div className="bingo-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={() => setView('main')}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-title">
          <Settings size={24} />
          <h3>Cài Đặt Mặc Định</h3>
        </div>
      </div>

      <div className="settings-form">
        {/* Max Players */}
        <div className="setting-group">
          <label>Số Người Chơi Tối Đa</label>
          <div className="setting-options">
            {[4, 6, 8, 10, 15, 20].map(num => (
              <button
                key={num}
                className={`option-btn ${settings.maxPlayers === num ? 'selected' : ''}`}
                onClick={() => setSettings(s => ({ ...s, maxPlayers: num }))}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Min Players */}
        <div className="setting-group">
          <label>Số Người Tối Thiểu Để Bắt Đầu</label>
          <div className="setting-options">
            {[2, 3, 4].map(num => (
              <button
                key={num}
                className={`option-btn ${settings.minPlayers === num ? 'selected' : ''}`}
                onClick={() => setSettings(s => ({ ...s, minPlayers: num }))}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Rows Per Player */}
        <div className="setting-group">
          <label>Số Dãy Mỗi Người Chơi</label>
          <div className="setting-options">
            {[4, 5, 6, 7, 8].map(num => (
              <button
                key={num}
                className={`option-btn ${settings.rowsPerPlayer === num ? 'selected' : ''}`}
                onClick={() => setSettings(s => ({ ...s, rowsPerPlayer: num }))}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Numbers Per Row */}
        <div className="setting-group">
          <label>Số Lượng Số Mỗi Dãy</label>
          <div className="setting-options">
            {[3, 4, 5, 6].map(num => (
              <button
                key={num}
                className={`option-btn ${settings.numbersPerRow === num ? 'selected' : ''}`}
                onClick={() => setSettings(s => ({ ...s, numbersPerRow: num }))}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Toggle */}
        <div className="setting-group toggle">
          <div className="toggle-info">
            <label>Kỹ Năng Đặc Biệt</label>
            <p>Cho phép sử dụng kỹ năng sau mỗi 5 lượt</p>
          </div>
          <button
            className={`toggle-btn ${settings.skillsEnabled ? 'active' : ''}`}
            onClick={() => setSettings(s => ({ ...s, skillsEnabled: !s.skillsEnabled }))}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        {/* Skill Interval */}
        {settings.skillsEnabled && (
          <div className="setting-group">
            <label>Kỹ Năng Sau Mỗi (lượt)</label>
            <div className="setting-options">
              {[3, 5, 7, 10].map(num => (
                <button
                  key={num}
                  className={`option-btn ${settings.skillInterval === num ? 'selected' : ''}`}
                  onClick={() => setSettings(s => ({ ...s, skillInterval: num }))}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          className={`save-btn ${saveStatus === 'saved' ? 'saved' : ''}`}
          onClick={handleSaveSettings}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            'Đang lưu...'
          ) : saveStatus === 'saved' ? (
            <>
              <Check size={16} />
              Đã lưu!
            </>
          ) : (
            'Lưu Cài Đặt'
          )}
        </button>
      </div>
    </div>
  );

  // Render active rooms view
  const renderRoomsView = () => (
    <div className="bingo-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={() => setView('main')}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-title">
          <Users size={24} />
          <h3>Phòng Đang Chơi</h3>
        </div>
      </div>

      {activeRooms.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎱</span>
          <h4>Không có phòng nào đang chơi</h4>
          <p>Các phòng sẽ hiển thị ở đây khi có người tạo game</p>
        </div>
      ) : (
        <div className="rooms-list">
          {activeRooms.map(room => (
            <div key={room.id} className="room-item">
              <div className="room-info">
                <div className="room-title">
                  <span>{room.title}</span>
                  <span className={`room-status ${room.status}`}>
                    {room.status === 'waiting' ? 'Đang chờ' :
                     room.status === 'playing' ? 'Đang chơi' : 'Kết thúc'}
                  </span>
                </div>
                <div className="room-meta">
                  <span>#{room.code}</span>
                  <span>•</span>
                  <span>Host: {room.hostName}</span>
                  <span>•</span>
                  <span>{room.playerCount}/{room.maxPlayers} người</span>
                </div>
              </div>
              <div className="room-actions">
                <button className="action-btn view">
                  <Eye size={16} />
                </button>
                <button className="action-btn danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render history view
  const renderHistoryView = () => (
    <div className="bingo-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={() => setView('main')}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-title">
          <History size={24} />
          <h3>Lịch Sử</h3>
        </div>
      </div>

      {gameHistory.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📜</span>
          <h4>Chưa có lịch sử</h4>
          <p>Các ván đã chơi sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <div className="history-list">
          {gameHistory.map(game => (
            <div key={game.id} className="history-item">
              <div className="history-info">
                <div className="history-title">{game.title}</div>
                <div className="history-meta">
                  <span>{new Date(game.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span>•</span>
                  <span>{game.playerCount} người chơi</span>
                  <span>•</span>
                  <span>{game.currentTurn} lượt</span>
                </div>
              </div>
              <button className="view-btn">
                <Eye size={16} />
                Xem
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render based on view
  switch (view) {
    case 'settings':
      return renderSettingsView();
    case 'rooms':
      return renderRoomsView();
    case 'history':
      return renderHistoryView();
    default:
      return renderMainView();
  }
}
