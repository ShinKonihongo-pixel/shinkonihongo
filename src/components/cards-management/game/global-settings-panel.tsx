// Game Tab - Global Settings Panel

import { useState } from 'react';
import { Volume2, Bot, Eye, Clock } from 'lucide-react';

interface GlobalSettingsPanelProps {
  onBack: () => void;
}

export function GlobalSettingsPanel({ onBack }: GlobalSettingsPanelProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoStartBots, setAutoStartBots] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(30);

  return (
    <div className="gm-global-settings">
      <div className="gm-header">
        <button className="gm-back-btn" onClick={onBack}>
          ← Quay lại Dashboard
        </button>
        <div className="gm-header-text">
          <h2>Cài Đặt Chung</h2>
          <p>Cấu hình áp dụng cho tất cả mini-games</p>
        </div>
      </div>

      <div className="gm-settings-grid">
        {/* Sound Settings */}
        <div className="gm-settings-card">
          <div className="settings-card-header">
            <Volume2 size={20} />
            <h4>Âm Thanh & Hiệu Ứng</h4>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Âm thanh game</span>
                <span className="setting-desc">Hiệu ứng âm thanh khi chơi</span>
              </div>
              <button
                className={`toggle-switch ${soundEnabled ? 'active' : ''}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Bot Settings */}
        <div className="gm-settings-card">
          <div className="settings-card-header">
            <Bot size={20} />
            <h4>Bot & Tự Động</h4>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Tự động thêm Bot</span>
                <span className="setting-desc">Thêm bot khi không đủ người chơi</span>
              </div>
              <button
                className={`toggle-switch ${autoStartBots ? 'active' : ''}`}
                onClick={() => setAutoStartBots(!autoStartBots)}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="gm-settings-card">
          <div className="settings-card-header">
            <Eye size={20} />
            <h4>Hiển Thị</h4>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Bảng xếp hạng</span>
                <span className="setting-desc">Hiện bảng xếp hạng sau game</span>
              </div>
              <button
                className={`toggle-switch ${showLeaderboard ? 'active' : ''}`}
                onClick={() => setShowLeaderboard(!showLeaderboard)}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Time Settings */}
        <div className="gm-settings-card">
          <div className="settings-card-header">
            <Clock size={20} />
            <h4>Thời Gian</h4>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Thời gian mặc định</span>
                <span className="setting-desc">Giới hạn thời gian mỗi câu</span>
              </div>
              <div className="setting-select">
                <select
                  value={defaultTimeLimit}
                  onChange={(e) => setDefaultTimeLimit(Number(e.target.value))}
                >
                  <option value={15}>15 giây</option>
                  <option value={20}>20 giây</option>
                  <option value={30}>30 giây</option>
                  <option value={45}>45 giây</option>
                  <option value={60}>60 giây</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gm-settings-actions">
        <button className="gm-btn-primary">
          💾 Lưu Cài Đặt
        </button>
        <button className="gm-btn-secondary">
          🔄 Khôi Phục Mặc Định
        </button>
      </div>
    </div>
  );
}
