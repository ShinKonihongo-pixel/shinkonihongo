// Free conversation settings + slow mode + start button for kaiwa-start-screen

import type { JLPTLevel, ConversationStyle, ConversationTopic, KaiwaScenario } from '../../types/kaiwa';
import { JLPT_LEVELS, CONVERSATION_STYLES, CONVERSATION_TOPICS } from '../../constants/kaiwa';

interface KaiwaStartSettingsProps {
  // Level/style/topic
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  onLevelChange: (level: JLPTLevel) => void;
  onStyleChange: (style: ConversationStyle) => void;
  onTopicChange: (topic: ConversationTopic) => void;

  // Role
  selectedScenario: KaiwaScenario | null;
  userRole: string | null;
  onUserRoleChange: (roleId: string) => void;

  // Slow mode + voice
  slowMode: boolean;
  voiceGender: 'male' | 'female';
  recognitionSupported: boolean;
  onSlowModeChange: (enabled: boolean) => void;

  // Start button
  isStartDisabled: boolean;
  startButtonText: string;
  onStart: () => void;
}

export function KaiwaStartSettings({
  level,
  style,
  topic,
  onLevelChange,
  onStyleChange,
  onTopicChange,
  selectedScenario,
  userRole,
  onUserRoleChange,
  slowMode,
  voiceGender,
  recognitionSupported,
  onSlowModeChange,
  isStartDisabled,
  startButtonText,
  onStart,
}: KaiwaStartSettingsProps) {
  return (
    <>
      <div className="kaiwa-setup">
        <div className="kaiwa-setup-row">
          <div className="kaiwa-setup-item">
            <label>Cấp độ JLPT</label>
            <select value={level} onChange={e => onLevelChange(e.target.value as JLPTLevel)}>
              {JLPT_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="kaiwa-setup-item">
            <label>Phong cách nói</label>
            <select value={style} onChange={e => onStyleChange(e.target.value as ConversationStyle)}>
              {CONVERSATION_STYLES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="kaiwa-setup-item kaiwa-topic-section">
          <label>Chủ đề hội thoại</label>
          <div className="kaiwa-topic-grid">
            {CONVERSATION_TOPICS.map(t => (
              <button
                key={t.value}
                className={`kaiwa-topic-btn ${topic === t.value ? 'active' : ''}`}
                onClick={() => onTopicChange(t.value)}
              >
                <span className="topic-icon">{t.icon}</span>
                <span className="topic-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Role Selector - shows when scenario topic is selected */}
        {selectedScenario && (
          <div className="kaiwa-setup-item kaiwa-role-section">
            <label>
              Chọn vai trò của bạn
            </label>
            <div className="kaiwa-role-grid">
              {selectedScenario.roles.map(role => (
                <button
                  key={role.id}
                  className={`kaiwa-role-btn ${userRole === role.id ? 'active' : ''}`}
                  onClick={() => onUserRoleChange(role.id)}
                >
                  <span className="role-emoji">{role.emoji}</span>
                  <span className="role-name">{role.name}</span>
                  <span className="role-name-vi">{role.nameVi}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="kaiwa-setup-item kaiwa-options-row">
        <label>
          <input
            type="checkbox"
            checked={slowMode}
            onChange={e => onSlowModeChange(e.target.checked)}
          />
          Chế độ chậm (luyện nghe)
        </label>
        <span className="kaiwa-voice-info">
          Giọng: {voiceGender === 'female' ? 'Nữ' : 'Nam'}
        </span>
      </div>

      {!recognitionSupported && (
        <p className="kaiwa-warning">
          Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.
        </p>
      )}

      <button
        className="btn btn-primary btn-large"
        onClick={onStart}
        disabled={isStartDisabled}
      >
        {startButtonText}
      </button>
    </>
  );
}
