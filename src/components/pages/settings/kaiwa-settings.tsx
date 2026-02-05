import type { KaiwaSettingsProps } from './settings-types';

export function KaiwaSettings({ settings, onUpdateSetting }: KaiwaSettingsProps) {
  return (
    <>
      <section className="settings-section">
        <h3>Cài đặt hội thoại (会話)</h3>
        <p className="settings-description">Cài đặt cho tính năng luyện hội thoại tiếng Nhật (chỉ VIP và Admin)</p>

        <div className="setting-item">
          <label>Giọng nói</label>
          <div className="setting-control">
            <select
              value={settings.kaiwaVoiceGender}
              onChange={(e) => onUpdateSetting('kaiwaVoiceGender', e.target.value as 'male' | 'female')}
              className="font-select"
            >
              <option value="female">Nữ (女性)</option>
              <option value="male">Nam (男性)</option>
            </select>
          </div>
        </div>

        <div className="setting-item">
          <label>Tốc độ nói: {settings.kaiwaVoiceRate.toFixed(1)}x</label>
          <div className="setting-control">
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.kaiwaVoiceRate}
              onChange={(e) => onUpdateSetting('kaiwaVoiceRate', parseFloat(e.target.value))}
            />
            <span className="setting-value">{settings.kaiwaVoiceRate.toFixed(1)}x</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Tự động đọc phản hồi</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.kaiwaAutoSpeak}
              onChange={(e) => onUpdateSetting('kaiwaAutoSpeak', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <label>Hiện gợi ý trả lời</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.kaiwaShowSuggestions}
              onChange={(e) => onUpdateSetting('kaiwaShowSuggestions', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <label>Hiện bản dịch tiếng Việt</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.kaiwaShowTranslation}
              onChange={(e) => onUpdateSetting('kaiwaShowTranslation', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <label>Chế độ gửi phát âm</label>
          <div className="setting-control">
            <select
              value={settings.kaiwaSendMode}
              onChange={(e) => onUpdateSetting('kaiwaSendMode', e.target.value as 'auto' | 'manual')}
              className="font-select"
            >
              <option value="manual">Thủ công (Manual)</option>
              <option value="auto">Tự động (Auto)</option>
            </select>
          </div>
        </div>

        {settings.kaiwaSendMode === 'auto' && (
          <>
            <div className="setting-item">
              <label>Ngưỡng tự động gửi</label>
              <div className="setting-control">
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={settings.kaiwaAutoSendThreshold}
                  onChange={(e) => onUpdateSetting('kaiwaAutoSendThreshold', Number(e.target.value))}
                />
                <span className="slider-value">{settings.kaiwaAutoSendThreshold}%</span>
              </div>
            </div>

            <div className="setting-item">
              <label>Độ trễ trước khi gửi</label>
              <div className="setting-control">
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.5"
                  value={settings.kaiwaAutoSendDelay}
                  onChange={(e) => onUpdateSetting('kaiwaAutoSendDelay', Number(e.target.value))}
                />
                <span className="slider-value">{settings.kaiwaAutoSendDelay}s</span>
              </div>
            </div>
          </>
        )}

        <div className="setting-item">
          <label>Cấp độ mặc định</label>
          <div className="setting-control">
            <select
              value={settings.kaiwaDefaultLevel}
              onChange={(e) => onUpdateSetting('kaiwaDefaultLevel', e.target.value as 'N5' | 'N4' | 'N3' | 'N2' | 'N1')}
              className="font-select"
            >
              <option value="N5">N5 (Sơ cấp)</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1 (Cao cấp)</option>
            </select>
          </div>
        </div>

        <div className="setting-item">
          <label>Phong cách nói mặc định</label>
          <div className="setting-control">
            <select
              value={settings.kaiwaDefaultStyle}
              onChange={(e) => onUpdateSetting('kaiwaDefaultStyle', e.target.value as 'casual' | 'polite' | 'formal')}
              className="font-select"
            >
              <option value="casual">Thân mật (タメ口)</option>
              <option value="polite">Lịch sự (です/ます)</option>
              <option value="formal">Trang trọng (敬語)</option>
            </select>
          </div>
        </div>
      </section>
    </>
  );
}
