// Kaiwa Settings View - Practice settings configuration

import { Settings, Clock, Mic, BookOpen, Zap, TrendingUp } from 'lucide-react';
import type { KaiwaPracticeSettings } from './kaiwa-tab-types';

interface SettingsViewProps {
  settings: KaiwaPracticeSettings;
  onSettingChange: <K extends keyof KaiwaPracticeSettings>(key: K, value: KaiwaPracticeSettings[K]) => void;
}

export function SettingsView({ settings, onSettingChange }: SettingsViewProps) {
  return (
    <div className="kaiwa-settings-tab">
      <div className="settings-header">
        <h3><Settings size={24} /> Cài Đặt Luyện Tập</h3>
        <p>Tùy chỉnh trải nghiệm luyện hội thoại</p>
      </div>

      <div className="settings-grid">
        {/* AI Response Timing */}
        <div className="setting-card">
          <div className="setting-header">
            <Clock size={20} />
            <span>Thời gian AI phản hồi</span>
          </div>
          <p className="setting-desc">Độ trễ trước khi AI trả lời (giây)</p>
          <div className="setting-control">
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={settings.aiResponseDelay}
              onChange={(e) => onSettingChange('aiResponseDelay', Number(e.target.value))}
            />
            <span className="setting-value">{settings.aiResponseDelay}s</span>
          </div>
        </div>

        {/* User Response Time */}
        <div className="setting-card">
          <div className="setting-header">
            <Clock size={20} />
            <span>Giới hạn thời gian trả lời</span>
          </div>
          <p className="setting-desc">Thời gian tối đa cho người dùng (0 = không giới hạn)</p>
          <div className="setting-control">
            <input
              type="range"
              min="0"
              max="120"
              step="10"
              value={settings.userResponseTime}
              onChange={(e) => onSettingChange('userResponseTime', Number(e.target.value))}
            />
            <span className="setting-value">
              {settings.userResponseTime === 0 ? '∞' : `${settings.userResponseTime}s`}
            </span>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="setting-card">
          <div className="setting-header">
            <Zap size={20} />
            <span>Gợi ý tự động</span>
          </div>
          <p className="setting-desc">Hiển thị câu trả lời gợi ý</p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.autoSuggestions}
              onChange={(e) => onSettingChange('autoSuggestions', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <Mic size={20} />
            <span>Giọng nói</span>
          </div>
          <p className="setting-desc">Bật/tắt tính năng đọc</p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(e) => onSettingChange('voiceEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <BookOpen size={20} />
            <span>Furigana mặc định</span>
          </div>
          <p className="setting-desc">Hiển thị cách đọc kanji</p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.furiganaDefault}
              onChange={(e) => onSettingChange('furiganaDefault', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <TrendingUp size={20} />
            <span>Chế độ chậm mặc định</span>
          </div>
          <p className="setting-desc">Phát âm chậm hơn bình thường</p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.slowModeDefault}
              onChange={(e) => onSettingChange('slowModeDefault', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}
