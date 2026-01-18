// Speed Quiz Manager - Admin management screen
import React, { useState } from 'react';
import { DEFAULT_SPEED_QUIZ_SETTINGS, SPEED_QUIZ_SKILLS } from '../../types/speed-quiz';

interface SpeedQuizManagerProps {
  onClose: () => void;
}

type ManagerView = 'overview' | 'settings' | 'questions' | 'rooms' | 'history';

export const SpeedQuizManager: React.FC<SpeedQuizManagerProps> = ({ onClose }) => {
  const [view, setView] = useState<ManagerView>('overview');
  const [settings, setSettings] = useState(DEFAULT_SPEED_QUIZ_SETTINGS);
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
          <span className="stat-icon">📝</span>
          <span className="stat-value">-</span>
          <span className="stat-label">Câu hỏi</span>
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
          <button className="action-btn" onClick={() => setView('questions')}>
            <span className="icon">📝</span>
            <span>Quản lý câu hỏi</span>
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
            onChange={(e) =>
              setSettings({ ...settings, maxPlayers: Number(e.target.value) })
            }
            min={2}
            max={50}
          />
        </div>

        <div className="form-group">
          <label>Số người chơi tối thiểu</label>
          <input
            type="number"
            value={settings.minPlayers}
            onChange={(e) =>
              setSettings({ ...settings, minPlayers: Number(e.target.value) })
            }
            min={1}
            max={10}
          />
        </div>

        <div className="form-group">
          <label>Số câu hỏi mặc định</label>
          <input
            type="number"
            value={settings.totalRounds}
            onChange={(e) =>
              setSettings({ ...settings, totalRounds: Number(e.target.value) })
            }
            min={5}
            max={50}
          />
        </div>

        <div className="form-group">
          <label>Thời gian mỗi câu (giây)</label>
          <input
            type="number"
            value={settings.timePerQuestion}
            onChange={(e) =>
              setSettings({ ...settings, timePerQuestion: Number(e.target.value) })
            }
            min={5}
            max={60}
          />
        </div>

        <div className="form-group">
          <label>Số gợi ý mỗi người</label>
          <input
            type="number"
            value={settings.hintsPerPlayer}
            onChange={(e) =>
              setSettings({ ...settings, hintsPerPlayer: Number(e.target.value) })
            }
            min={0}
            max={10}
          />
        </div>

        <div className="form-group">
          <label>Điểm trả lời đúng</label>
          <input
            type="number"
            value={settings.pointsCorrect}
            onChange={(e) =>
              setSettings({ ...settings, pointsCorrect: Number(e.target.value) })
            }
            min={10}
            max={500}
          />
        </div>

        <div className="form-group">
          <label>Điểm phạt trả lời sai</label>
          <input
            type="number"
            value={settings.pointsPenalty}
            onChange={(e) =>
              setSettings({ ...settings, pointsPenalty: Number(e.target.value) })
            }
            min={0}
            max={100}
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.skillsEnabled}
              onChange={(e) =>
                setSettings({ ...settings, skillsEnabled: e.target.checked })
              }
            />
            <span>Bật kỹ năng đặc biệt</span>
          </label>
        </div>

        {settings.skillsEnabled && (
          <div className="form-group">
            <label>Kỹ năng xuất hiện sau mỗi X câu</label>
            <input
              type="number"
              value={settings.skillInterval}
              onChange={(e) =>
                setSettings({ ...settings, skillInterval: Number(e.target.value) })
              }
              min={3}
              max={10}
            />
          </div>
        )}
      </div>

      <div className="skills-preview">
        <h4>✨ Danh sách kỹ năng</h4>
        <div className="skills-grid">
          {Object.values(SPEED_QUIZ_SKILLS).map((skill) => (
            <div key={skill.type} className="skill-preview-card">
              <span className="emoji">{skill.emoji}</span>
              <span className="name">{skill.name}</span>
              <span className="desc">{skill.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-actions">
        <button
          className={`speed-quiz-btn primary ${saveStatus === 'saved' ? 'saved' : ''}`}
          onClick={handleSaveSettings}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? '⏳ Đang lưu...' : saveStatus === 'saved' ? '✅ Đã lưu!' : '💾 Lưu Cài Đặt'}
        </button>
        <button
          className="speed-quiz-btn secondary"
          onClick={() => setSettings(DEFAULT_SPEED_QUIZ_SETTINGS)}
        >
          🔄 Khôi Phục Mặc Định
        </button>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div className="manager-questions">
      <div className="questions-header">
        <h3>📝 Quản Lý Câu Hỏi</h3>
        <button className="speed-quiz-btn primary">+ Thêm Câu Hỏi</button>
      </div>

      <div className="questions-filters">
        <select>
          <option value="">Tất cả loại</option>
          <option value="vocabulary">Từ vựng</option>
          <option value="kanji">Kanji</option>
          <option value="grammar">Ngữ pháp</option>
        </select>
        <input type="text" placeholder="Tìm kiếm..." />
      </div>

      <div className="questions-info">
        <p>
          💡 Câu hỏi được lấy từ <strong>Flashcard</strong> của bạn.
          Để thêm câu hỏi mới, hãy tạo flashcard mới trong phần Quản lý Flashcard.
        </p>
      </div>

      <div className="questions-table">
        <div className="table-header">
          <span className="col-display">Hiển thị</span>
          <span className="col-answer">Đáp án</span>
          <span className="col-category">Loại</span>
          <span className="col-points">Điểm</span>
          <span className="col-actions">Thao tác</span>
        </div>
        <div className="table-body">
          <div className="table-row">
            <span className="col-display">日本</span>
            <span className="col-answer">Nhật Bản</span>
            <span className="col-category">📝 Từ vựng</span>
            <span className="col-points">100</span>
            <span className="col-actions">
              <button className="icon-btn">✏️</button>
              <button className="icon-btn danger">🗑️</button>
            </span>
          </div>
          <div className="table-row">
            <span className="col-display">食べる</span>
            <span className="col-answer">Ăn</span>
            <span className="col-category">📝 Từ vựng</span>
            <span className="col-points">100</span>
            <span className="col-actions">
              <button className="icon-btn">✏️</button>
              <button className="icon-btn danger">🗑️</button>
            </span>
          </div>
          <div className="table-row">
            <span className="col-display">山</span>
            <span className="col-answer">Núi</span>
            <span className="col-category">🈳 Kanji</span>
            <span className="col-points">100</span>
            <span className="col-actions">
              <button className="icon-btn">✏️</button>
              <button className="icon-btn danger">🗑️</button>
            </span>
          </div>
        </div>
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
                <span className="players">👥 {room.players} người chơi</span>
                <span className={`status ${room.status}`}>
                  {room.status === 'playing' ? '🎮 Đang chơi' : '⏳ Đang chờ'}
                </span>
              </div>
              <div className="room-actions">
                <button className="speed-quiz-btn secondary small">👁️ Xem</button>
                <button className="speed-quiz-btn danger small">🚫 Đóng</button>
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
              <button className="speed-quiz-btn secondary small">📊 Chi tiết</button>
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
      case 'questions':
        return renderQuestions();
      case 'rooms':
        return renderRooms();
      case 'history':
        return renderHistory();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="speed-quiz-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={view === 'overview' ? onClose : () => setView('overview')}>
          ← {view === 'overview' ? 'Quay lại' : 'Tổng quan'}
        </button>
        <h2>⚡ Quản Lý Speed Quiz</h2>
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
          className={`nav-btn ${view === 'questions' ? 'active' : ''}`}
          onClick={() => setView('questions')}
        >
          📝 Câu hỏi
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
