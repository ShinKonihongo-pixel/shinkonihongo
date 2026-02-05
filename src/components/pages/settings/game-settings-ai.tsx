import type { AppSettings, AutoAddDifficulty } from '../../../hooks/use-settings';

interface GameSettingsAIProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function GameSettingsAI({ settings, onUpdateSetting }: GameSettingsAIProps) {
  return (
    <section className="settings-section ai-challenge-section">
      <h3>
        <span className="section-icon">🤖</span>
        Cài đặt Thách Đấu AI
      </h3>
      <p className="settings-description">Cài đặt cho chế độ chơi 1v1 với AI</p>

      <div className="setting-item">
        <label>Số câu hỏi: {settings.aiChallengeQuestionCount}</label>
        <div className="setting-control">
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={settings.aiChallengeQuestionCount}
            onChange={(e) => onUpdateSetting('aiChallengeQuestionCount', Number(e.target.value))}
          />
          <span className="setting-value">{settings.aiChallengeQuestionCount} câu</span>
        </div>
      </div>

      <div className="setting-item">
        <label>Thời gian/câu: {settings.aiChallengeTimePerQuestion}s</label>
        <div className="setting-control">
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={settings.aiChallengeTimePerQuestion}
            onChange={(e) => onUpdateSetting('aiChallengeTimePerQuestion', Number(e.target.value))}
          />
          <span className="setting-value">{settings.aiChallengeTimePerQuestion}s</span>
        </div>
      </div>

      <div className="setting-divider"></div>
      <p className="ai-adjust-label">Điều chỉnh AI</p>

      <div className="setting-item">
        <label>Độ chính xác: {settings.aiChallengeAccuracyModifier > 0 ? '+' : ''}{settings.aiChallengeAccuracyModifier}%</label>
        <div className="setting-control">
          <input
            type="range"
            min="-20"
            max="20"
            step="5"
            value={settings.aiChallengeAccuracyModifier}
            onChange={(e) => onUpdateSetting('aiChallengeAccuracyModifier', Number(e.target.value))}
          />
          <span className="setting-value">{settings.aiChallengeAccuracyModifier > 0 ? '+' : ''}{settings.aiChallengeAccuracyModifier}%</span>
        </div>
      </div>

      <div className="setting-item">
        <label>Tốc độ trả lời: {settings.aiChallengeSpeedMultiplier}x</label>
        <div className="setting-control">
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.aiChallengeSpeedMultiplier}
            onChange={(e) => onUpdateSetting('aiChallengeSpeedMultiplier', Number(e.target.value))}
          />
          <span className="setting-value">{settings.aiChallengeSpeedMultiplier.toFixed(1)}x</span>
        </div>
      </div>

      <div className="setting-divider"></div>
      <p className="ai-adjust-label">Thêm AI Nhanh</p>

      <div className="setting-item">
        <label>Mức độ mặc định</label>
        <div className="setting-control">
          <select
            value={settings.aiChallengeAutoAddDifficulty}
            onChange={(e) => onUpdateSetting('aiChallengeAutoAddDifficulty', e.target.value as AutoAddDifficulty)}
            className="font-select"
          >
            <option value="random">🎲 Ngẫu nhiên</option>
            <option value="easy">🌱 Dễ (Trang 1)</option>
            <option value="medium">⚡ Trung bình (Trang 2)</option>
            <option value="hard">🔥 Khó (Trang 3)</option>
          </select>
        </div>
      </div>
    </section>
  );
}
