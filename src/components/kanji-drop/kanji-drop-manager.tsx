// Kanji Drop Manager — Admin interface for managing Kanji Drop game settings
// Follows BingoGameManager pattern: main menu → settings, rooms, history

import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Users, History, Trash2, Eye, Check } from 'lucide-react';
import { subscribeToAllWaitingRooms, deleteWaitingRoom } from '../../services/game-rooms';
import type { WaitingRoomGame } from '../../types/game-hub';

interface KanjiDropManagerProps {
  onClose: () => void;
}

type ManagerView = 'main' | 'settings' | 'rooms' | 'history';

interface KanjiDropSettings {
  defaultLevelStart: number;
  defaultLevelEnd: number;
  maxPlayers: number;
  minPlayers: number;
  allowedJlptLevels: string[];
}

const DEFAULT_SETTINGS: KanjiDropSettings = {
  defaultLevelStart: 1,
  defaultLevelEnd: 10,
  maxPlayers: 10,
  minPlayers: 2,
  allowedJlptLevels: ['N5', 'N4', 'N3', 'N2', 'N1'],
};

export function KanjiDropManager({ onClose }: KanjiDropManagerProps) {
  const [view, setView] = useState<ManagerView>('main');
  const [settings, setSettings] = useState<KanjiDropSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeRooms, setActiveRooms] = useState<WaitingRoomGame[]>([]);

  // Subscribe to active kanji-drop rooms
  useEffect(() => {
    const unsub = subscribeToAllWaitingRooms(rooms => {
      setActiveRooms(rooms.filter(r => r.gameType === 'kanji-drop'));
    });
    return unsub;
  }, []);

  const handleSaveSettings = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteWaitingRoom(roomId, 'kanji-drop');
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  };

  const toggleJlptLevel = (level: string) => {
    setSettings(s => ({
      ...s,
      allowedJlptLevels: s.allowedJlptLevels.includes(level)
        ? s.allowedJlptLevels.filter(l => l !== level)
        : [...s.allowedJlptLevels, level],
    }));
  };

  // Main menu
  const renderMainView = () => (
    <div className="bingo-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={onClose}><ArrowLeft size={20} /></button>
        <div className="header-title">
          <span className="header-icon">🀄</span>
          <h3>Quản Lý Kanji Drop</h3>
        </div>
      </div>

      <div className="manager-cards">
        <div className="manager-card" onClick={() => setView('settings')}>
          <div className="card-icon settings"><Settings size={28} /></div>
          <div className="card-info">
            <h4>Cài Đặt Mặc Định</h4>
            <p>Phạm vi màn, số người chơi, JLPT</p>
          </div>
          <span className="card-arrow">→</span>
        </div>
        <div className="manager-card" onClick={() => setView('rooms')}>
          <div className="card-icon rooms"><Users size={28} /></div>
          <div className="card-info">
            <h4>Phòng Đang Chờ</h4>
            <p>{activeRooms.length} phòng đang hoạt động</p>
          </div>
          <span className="card-arrow">→</span>
        </div>
        <div className="manager-card" onClick={() => setView('history')}>
          <div className="card-icon history"><History size={28} /></div>
          <div className="card-info">
            <h4>Lịch Sử</h4>
            <p>Xem lại các ván đã chơi</p>
          </div>
          <span className="card-arrow">→</span>
        </div>
      </div>

      <div className="manager-stats">
        <h4>Thống Kê</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{activeRooms.length}</span>
            <span className="stat-label">Phòng Đang Chờ</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">100</span>
            <span className="stat-label">Tổng Màn Chơi</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">0</span>
            <span className="stat-label">Người Chơi Online</span>
          </div>
        </div>
      </div>

      <div className="manager-info">
        <h4>Thông Tin Game</h4>
        <div className="info-list">
          <div className="info-item">
            <span className="info-label">Phạm vi mặc định:</span>
            <span className="info-value">Màn {settings.defaultLevelStart} → {settings.defaultLevelEnd}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Người chơi:</span>
            <span className="info-value">{settings.minPlayers} - {settings.maxPlayers}</span>
          </div>
          <div className="info-item">
            <span className="info-label">JLPT:</span>
            <span className="info-value">{settings.allowedJlptLevels.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Settings view
  const renderSettingsView = () => (
    <div className="bingo-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={() => setView('main')}><ArrowLeft size={20} /></button>
        <div className="header-title"><Settings size={24} /><h3>Cài Đặt Mặc Định</h3></div>
      </div>

      <div className="settings-form">
        <div className="setting-group">
          <label>Người Chơi Tối Đa</label>
          <div className="setting-options">
            {[4, 6, 8, 10].map(n => (
              <button key={n} className={`option-btn ${settings.maxPlayers === n ? 'selected' : ''}`}
                onClick={() => setSettings(s => ({ ...s, maxPlayers: n }))}>{n}</button>
            ))}
          </div>
        </div>
        <div className="setting-group">
          <label>Người Chơi Tối Thiểu</label>
          <div className="setting-options">
            {[2, 3, 4].map(n => (
              <button key={n} className={`option-btn ${settings.minPlayers === n ? 'selected' : ''}`}
                onClick={() => setSettings(s => ({ ...s, minPlayers: n }))}>{n}</button>
            ))}
          </div>
        </div>
        <div className="setting-group">
          <label>Màn Bắt Đầu Mặc Định</label>
          <div className="setting-options">
            {[1, 10, 20, 30].map(n => (
              <button key={n} className={`option-btn ${settings.defaultLevelStart === n ? 'selected' : ''}`}
                onClick={() => setSettings(s => ({ ...s, defaultLevelStart: n }))}>{n}</button>
            ))}
          </div>
        </div>
        <div className="setting-group">
          <label>Màn Kết Thúc Mặc Định</label>
          <div className="setting-options">
            {[10, 30, 60, 100].map(n => (
              <button key={n} className={`option-btn ${settings.defaultLevelEnd === n ? 'selected' : ''}`}
                onClick={() => setSettings(s => ({ ...s, defaultLevelEnd: n }))}>{n}</button>
            ))}
          </div>
        </div>
        <div className="setting-group">
          <label>Cấp Độ JLPT Cho Phép</label>
          <div className="setting-options">
            {['N5', 'N4', 'N3', 'N2', 'N1'].map(l => (
              <button key={l} className={`option-btn ${settings.allowedJlptLevels.includes(l) ? 'selected' : ''}`}
                onClick={() => toggleJlptLevel(l)}>{l}</button>
            ))}
          </div>
        </div>
        <button
          className={`save-btn ${saveStatus === 'saved' ? 'saved' : ''}`}
          onClick={handleSaveSettings}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'Đang lưu...' :
           saveStatus === 'saved' ? <><Check size={16} /> Đã lưu!</> :
           'Lưu Cài Đặt'}
        </button>
      </div>
    </div>
  );

  // Rooms view
  const renderRoomsView = () => (
    <div className="bingo-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={() => setView('main')}><ArrowLeft size={20} /></button>
        <div className="header-title"><Users size={24} /><h3>Phòng Đang Chờ</h3></div>
      </div>

      {activeRooms.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🀄</span>
          <h4>Không có phòng nào đang chờ</h4>
          <p>Các phòng sẽ hiển thị ở đây khi có người tạo game</p>
        </div>
      ) : (
        <div className="rooms-list">
          {activeRooms.map(room => (
            <div key={room.id} className="room-item">
              <div className="room-info">
                <div className="room-title">
                  <span>{room.title}</span>
                  <span className={`room-status ${room.status}`}>Đang chờ</span>
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
                <button className="action-btn view"><Eye size={16} /></button>
                <button className="action-btn danger" onClick={() => handleDeleteRoom(room.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // History view
  const renderHistoryView = () => (
    <div className="bingo-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={() => setView('main')}><ArrowLeft size={20} /></button>
        <div className="header-title"><History size={24} /><h3>Lịch Sử</h3></div>
      </div>
      <div className="empty-state">
        <span className="empty-icon">📜</span>
        <h4>Chưa có lịch sử</h4>
        <p>Các ván đã chơi sẽ hiển thị ở đây</p>
      </div>
    </div>
  );

  switch (view) {
    case 'settings': return renderSettingsView();
    case 'rooms': return renderRoomsView();
    case 'history': return renderHistoryView();
    default: return renderMainView();
  }
}
