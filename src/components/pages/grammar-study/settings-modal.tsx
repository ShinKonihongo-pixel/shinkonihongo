// Settings modal component
import { Settings, X, Eye, EyeOff, Type, Sparkles } from 'lucide-react';
import type { GrammarStudySettings } from './types';

const FLIP_STYLES: { value: GrammarStudySettings['cardFlipStyle']; label: string }[] = [
  { value: 'horizontal', label: 'Lật ngang' },
  { value: 'vertical', label: 'Lật dọc' },
  { value: 'fade', label: 'Chuyển mờ' },
  { value: 'slide', label: 'Trượt ngang' },
  { value: 'swing', label: 'Mở cửa' },
  { value: 'flip-up', label: 'Lật lên' },
  { value: 'airplane', label: 'Chuyển trang' },
  { value: 'crumple', label: 'Thu phóng' },
  { value: 'flyaway', label: 'Đảo bài' },
  { value: 'none', label: 'Tức thì' },
];

interface SettingsModalProps {
  settings: GrammarStudySettings;
  onClose: () => void;
  onUpdateSettings: (settings: GrammarStudySettings) => void;
}

export function SettingsModal({ settings, onClose, onUpdateSettings }: SettingsModalProps) {
  const { frontShow, backShow, frontFontSize, backFontSize, cardScale } = settings;

  const toggleFrontShow = (key: keyof typeof frontShow) => {
    onUpdateSettings({
      ...settings,
      frontShow: { ...frontShow, [key]: !frontShow[key] }
    });
  };

  const toggleBackShow = (key: keyof typeof backShow) => {
    onUpdateSettings({
      ...settings,
      backShow: { ...backShow, [key]: !backShow[key] }
    });
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <div className="modal-header-icon">
            <Settings size={20} />
          </div>
          <h3>Cài đặt hiển thị</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-modal-content">
          <div className="settings-section">
            <div className="section-header">
              <Eye size={18} />
              <h4>Mặt trước thẻ</h4>
            </div>
            <div className="settings-grid">
              {[
                { key: 'title', label: 'Tiêu đề' },
                { key: 'formula', label: 'Công thức' },
                { key: 'meaning', label: 'Nghĩa' },
              ].map(item => (
                <label key={item.key} className={`setting-toggle ${frontShow[item.key as keyof typeof frontShow] ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={frontShow[item.key as keyof typeof frontShow]}
                    onChange={() => toggleFrontShow(item.key as keyof typeof frontShow)}
                  />
                  <span className="toggle-switch" />
                  <span className="toggle-label">{item.label}</span>
                </label>
              ))}
            </div>
            <div className="font-size-control">
              <div className="font-size-label">
                <Type size={16} />
                <span>Cỡ chữ</span>
              </div>
              <div className="font-size-slider">
                <button
                  className="font-btn"
                  onClick={() => onUpdateSettings({ ...settings, frontFontSize: Math.max(12, frontFontSize - 4) })}
                >−</button>
                <div className="font-value">{frontFontSize}px</div>
                <button
                  className="font-btn"
                  onClick={() => onUpdateSettings({ ...settings, frontFontSize: Math.min(84, frontFontSize + 4) })}
                >+</button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <EyeOff size={18} />
              <h4>Mặt sau thẻ</h4>
            </div>
            <div className="settings-grid">
              {[
                { key: 'title', label: 'Tiêu đề' },
                { key: 'formula', label: 'Công thức' },
                { key: 'meaning', label: 'Nghĩa' },
              ].map(item => (
                <label key={item.key} className={`setting-toggle ${backShow[item.key as keyof typeof backShow] ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={backShow[item.key as keyof typeof backShow]}
                    onChange={() => toggleBackShow(item.key as keyof typeof backShow)}
                  />
                  <span className="toggle-switch" />
                  <span className="toggle-label">{item.label}</span>
                </label>
              ))}
            </div>
            <div className="font-size-control">
              <div className="font-size-label">
                <Type size={16} />
                <span>Cỡ chữ</span>
              </div>
              <div className="font-size-slider">
                <button
                  className="font-btn"
                  onClick={() => onUpdateSettings({ ...settings, backFontSize: Math.max(12, backFontSize - 2) })}
                >−</button>
                <div className="font-value">{backFontSize}px</div>
                <button
                  className="font-btn"
                  onClick={() => onUpdateSettings({ ...settings, backFontSize: Math.min(28, backFontSize + 2) })}
                >+</button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <Sparkles size={18} />
              <h4>Hiệu ứng lật thẻ</h4>
            </div>
            <select
              className="flip-style-select"
              value={settings.cardFlipStyle || 'horizontal'}
              onChange={(e) => onUpdateSettings({ ...settings, cardFlipStyle: e.target.value as GrammarStudySettings['cardFlipStyle'] })}
            >
              {FLIP_STYLES.map(style => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <Settings size={18} />
              <h4>Kích thước thẻ</h4>
            </div>
            <div className="font-size-control">
              <div className="font-size-label">
                <span>Tỉ lệ</span>
              </div>
              <div className="font-size-slider">
                <button
                  className="font-btn"
                  onClick={() => onUpdateSettings({ ...settings, cardScale: Math.max(60, cardScale - 5) })}
                >−</button>
                <div className="font-value">{cardScale}%</div>
                <button
                  className="font-btn"
                  onClick={() => onUpdateSettings({ ...settings, cardScale: Math.min(150, cardScale + 5) })}
                >+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
