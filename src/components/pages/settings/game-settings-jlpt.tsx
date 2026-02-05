import type { AppSettings } from '../../../hooks/use-settings';

interface GameSettingsJLPTProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function GameSettingsJLPT({ settings, onUpdateSetting }: GameSettingsJLPTProps) {
  return (
    <section className="settings-section jlpt-settings-section">
      <h3>
        <span className="section-icon">📝</span>
        Cài đặt Luyện thi JLPT
      </h3>
      <p className="settings-description">Tùy chỉnh trải nghiệm luyện thi JLPT</p>

      <div className="setting-item">
        <label>Số câu hỏi mặc định: {settings.jlptDefaultQuestionCount}</label>
        <div className="setting-control">
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={settings.jlptDefaultQuestionCount}
            onChange={(e) => onUpdateSetting('jlptDefaultQuestionCount', Number(e.target.value))}
          />
          <span className="setting-value">{settings.jlptDefaultQuestionCount} câu</span>
        </div>
      </div>

      <div className="setting-item">
        <label>Hiển thị giải thích sau mỗi câu</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.jlptShowExplanation}
            onChange={(e) => onUpdateSetting('jlptShowExplanation', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <label>Tự động chuyển câu sau: {settings.jlptAutoNextDelay === 0 ? 'Tắt (thủ công)' : `${settings.jlptAutoNextDelay}s`}</label>
        <div className="setting-control">
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={settings.jlptAutoNextDelay}
            onChange={(e) => onUpdateSetting('jlptAutoNextDelay', Number(e.target.value))}
          />
          <span className="setting-value">{settings.jlptAutoNextDelay === 0 ? 'Tắt' : `${settings.jlptAutoNextDelay}s`}</span>
        </div>
      </div>

      <div className="setting-divider"></div>
      <p className="ai-adjust-label">Chọn câu hỏi thông minh</p>

      <div className="setting-item">
        <label>Tránh lặp câu hỏi gần đây</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.jlptPreventRepetition}
            onChange={(e) => onUpdateSetting('jlptPreventRepetition', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>

      {settings.jlptPreventRepetition && (
        <div className="setting-item">
          <label>Độ trễ lặp: {settings.jlptRepetitionCooldown} phiên</label>
          <div className="setting-control">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.jlptRepetitionCooldown}
              onChange={(e) => onUpdateSetting('jlptRepetitionCooldown', Number(e.target.value))}
            />
            <span className="setting-value">{settings.jlptRepetitionCooldown} phiên</span>
          </div>
        </div>
      )}

      <div className="setting-item">
        <label>Chế độ chọn câu hỏi</label>
        <div className="setting-control">
          <select
            value={settings.jlptCoverageMode}
            onChange={(e) => onUpdateSetting('jlptCoverageMode', e.target.value as 'random' | 'balanced' | 'weak_first')}
            className="font-select"
          >
            <option value="random">🎲 Ngẫu nhiên</option>
            <option value="balanced">⚖️ Cân bằng (mỗi phần đều có)</option>
            <option value="weak_first">🎯 Ưu tiên điểm yếu</option>
          </select>
        </div>
      </div>

      <div className="setting-divider"></div>
      <p className="ai-adjust-label">Đánh giá & Phân tích</p>

      <div className="setting-item">
        <label>Hiển thị đánh giá trình độ</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.jlptShowLevelAssessment}
            onChange={(e) => onUpdateSetting('jlptShowLevelAssessment', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <label>Theo dõi điểm yếu</label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.jlptTrackWeakAreas}
            onChange={(e) => onUpdateSetting('jlptTrackWeakAreas', e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>
    </section>
  );
}
