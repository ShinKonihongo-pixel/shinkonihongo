// Word Match Manager - Admin management screen
import React, { useState } from 'react';
import { DEFAULT_WORD_MATCH_SETTINGS, WORD_MATCH_EFFECTS } from '../../types/word-match';

interface WordMatchManagerProps {
  onClose: () => void;
}

type ManagerView = 'overview' | 'settings' | 'rooms' | 'history';

export const WordMatchManager: React.FC<WordMatchManagerProps> = ({ onClose }) => {
  const [view, setView] = useState<ManagerView>('overview');
  const [settings, setSettings] = useState(DEFAULT_WORD_MATCH_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Handle save settings
  const handleSaveSettings = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  // Room and history data (would come from backend in production)
  const [activeRooms] = useState<Array<{
    id: string;
    code: string;
    title: string;
    players: number;
    status: 'playing' | 'waiting';
  }>>([]);

  const [gameHistory] = useState<Array<{
    id: string;
    title: string;
    date: string;
    players: number;
    winner: string;
    rounds: number;
  }>>([]);

  const renderOverview = () => (
    <div className="manager-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">🎮</span>
          <span className="stat-value">{activeRooms.length}</span>
          <span className="stat-label">Phòng đang chơi</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <span className="stat-value">{activeRooms.reduce((sum, r) => sum + r.players, 0)}</span>
          <span className="stat-label">Người chơi online</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔗</span>
          <span className="stat-value">-</span>
          <span className="stat-label">Cặp từ</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <span className="stat-value">{gameHistory.length}</span>
          <span className="stat-label">Games hoàn thành</span>
        </div>
      </div>

      <div className="quick-actions">
        <h3>⚡ Thao tác nhanh</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => setView('settings')}>
            <span className="icon">⚙️</span>
            <span>Cài đặt game</span>
          </button>
          <button className="action-btn" onClick={() => setView('rooms')}>
            <span className="icon">🚪</span>
            <span>Xem phòng chơi</span>
          </button>
          <button className="action-btn" onClick={() => setView('history')}>
            <span className="icon">📊</span>
            <span>Lịch sử game</span>
          </button>
        </div>
      </div>

      <div className="active-rooms-preview">
        <h3>🎮 Phòng đang hoạt động</h3>
        {activeRooms.length > 0 ? (
          <div className="rooms-preview-list">
            {activeRooms.map((room) => (
              <div key={room.id} className="room-preview-item">
                <span className="room-title">{room.title}</span>
                <span className="room-code">{room.code}</span>
                <span className="room-players">👥 {room.players}</span>
                <span className={`room-status ${room.status}`}>
                  {room.status === 'playing' ? '🎮 Đang chơi' : '⏳ Chờ'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">Không có phòng nào đang hoạt động</p>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="manager-settings">
      <h3>⚙️ Cài Đặt Mặc Định</h3>

      <div className="settings-form">
        <div className="form-group">
          <label>Số người chơi tối đa</label>
          <input
            type="number"
            value={settings.maxPlayers}
            onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
            min={2}
            max={20}
          />
        </div>

        <div className="form-group">
          <label>Số câu hỏi mặc định</label>
          <input
            type="number"
            value={settings.totalRounds}
            onChange={(e) => setSettings({ ...settings, totalRounds: Number(e.target.value) })}
            min={5}
            max={30}
          />
        </div>

        <div className="form-group">
          <label>Thời gian mỗi câu (giây)</label>
          <input
            type="number"
            value={settings.timePerRound}
            onChange={(e) => setSettings({ ...settings, timePerRound: Number(e.target.value) })}
            min={15}
            max={60}
          />
        </div>

        <div className="form-group">
          <label>Điểm mỗi cặp đúng</label>
          <input
            type="number"
            value={settings.pointsPerPair}
            onChange={(e) => setSettings({ ...settings, pointsPerPair: Number(e.target.value) })}
            min={5}
            max={50}
          />
        </div>

        <div className="form-group">
          <label>Bonus hoàn hảo (5/5)</label>
          <input
            type="number"
            value={settings.bonusAllCorrect}
            onChange={(e) => setSettings({ ...settings, bonusAllCorrect: Number(e.target.value) })}
            min={0}
            max={100}
          />
        </div>
      </div>

      <div className="effects-preview">
        <h4>🎡 Hiệu ứng vòng quay</h4>
        <div className="effects-grid">
          {Object.values(WORD_MATCH_EFFECTS).map((effect) => (
            <div key={effect.type} className="effect-preview-card">
              <span className="emoji">{effect.emoji}</span>
              <span className="name">{effect.name}</span>
              <span className="desc">{effect.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-actions">
        <button
          className={`word-match-btn primary ${saveStatus === 'saved' ? 'saved' : ''}`}
          onClick={handleSaveSettings}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? '⏳ Đang lưu...' : saveStatus === 'saved' ? '✅ Đã lưu!' : '💾 Lưu Cài Đặt'}
        </button>
        <button
          className="word-match-btn secondary"
          onClick={() => setSettings(DEFAULT_WORD_MATCH_SETTINGS)}
        >
          🔄 Khôi Phục Mặc Định
        </button>
      </div>
    </div>
  );

  const renderRooms = () => (
    <div className="manager-rooms">
      <h3>🚪 Phòng Chơi Hiện Tại</h3>

      {activeRooms.length > 0 ? (
        <div className="rooms-list">
          {activeRooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="room-main">
                <span className="room-title">{room.title}</span>
                <span className="room-code">Mã: {room.code}</span>
              </div>
              <div className="room-info">
                <span className="players">👥 {room.players} người</span>
                <span className={`status ${room.status}`}>
                  {room.status === 'playing' ? '🎮 Đang chơi' : '⏳ Đang chờ'}
                </span>
              </div>
              <div className="room-actions">
                <button className="word-match-btn secondary small">👁️ Xem</button>
                <button className="word-match-btn danger small">🚫 Đóng</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-rooms">
          <span className="icon">🏠</span>
          <p>Không có phòng nào đang hoạt động</p>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="manager-history">
      <h3>📊 Lịch Sử Game</h3>

      <div className="history-filters">
        <input type="date" />
        <select>
          <option value="">Tất cả</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Hủy bỏ</option>
        </select>
      </div>

      <div className="history-list">
        {gameHistory.map((game) => (
          <div key={game.id} className="history-card">
            <div className="history-main">
              <span className="title">{game.title}</span>
              <span className="date">📅 {game.date}</span>
            </div>
            <div className="history-stats">
              <span className="players">👥 {game.players} người</span>
              <span className="rounds">📝 {game.rounds} câu</span>
              <span className="winner">🏆 {game.winner}</span>
            </div>
            <div className="history-actions">
              <button className="word-match-btn secondary small">📊 Chi tiết</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'settings':
        return renderSettings();
      case 'rooms':
        return renderRooms();
      case 'history':
        return renderHistory();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="word-match-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={view === 'overview' ? onClose : () => setView('overview')}>
          ← {view === 'overview' ? 'Quay lại' : 'Tổng quan'}
        </button>
        <h2>🔗 Quản Lý Nối Từ Thách Đấu</h2>
      </div>

      <div className="manager-nav">
        <button
          className={`nav-btn ${view === 'overview' ? 'active' : ''}`}
          onClick={() => setView('overview')}
        >
          📊 Tổng quan
        </button>
        <button
          className={`nav-btn ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
        >
          ⚙️ Cài đặt
        </button>
        <button
          className={`nav-btn ${view === 'rooms' ? 'active' : ''}`}
          onClick={() => setView('rooms')}
        >
          🚪 Phòng chơi
        </button>
        <button
          className={`nav-btn ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          📜 Lịch sử
        </button>
      </div>

      <div className="manager-content">{renderContent()}</div>
    </div>
  );
};
