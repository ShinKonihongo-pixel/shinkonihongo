// Free conversation settings (level/style/topic/role) for kaiwa setup view
// Only shown when not in advanced/custom/speaking mode and no default question selected

import { Users } from 'lucide-react';
import type { JLPTLevel, ConversationStyle, ConversationTopic } from '../../../types/kaiwa';
import { JLPT_LEVELS, CONVERSATION_STYLES, CONVERSATION_TOPICS } from '../../../constants/kaiwa';

interface KaiwaSetupSettingsPanelProps {
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  selectedScenario: any;
  userRole: string | null;
  setLevel: (level: JLPTLevel) => void;
  setStyle: (style: ConversationStyle) => void;
  setUserRole: (role: string | null) => void;
  handleTopicChange: (topic: ConversationTopic) => void;
}

export function KaiwaSetupSettingsPanel({
  level,
  style,
  topic,
  selectedScenario,
  userRole,
  setLevel,
  setStyle,
  setUserRole,
  handleTopicChange,
}: KaiwaSetupSettingsPanelProps) {
  return (
    <>
      <div className="kaiwa-section-header">
        <div className="kaiwa-section-line" />
        <span className="kaiwa-section-label">
          <span className="kaiwa-step-badge">2</span>
          Tùy chỉnh
        </span>
        <div className="kaiwa-section-line" />
      </div>
      <div className="kaiwa-setup">
        <div className="kaiwa-setup-row-inline">
          <div className="kaiwa-setup-col">
            <label>Cấp độ JLPT</label>
            <div className="kaiwa-level-pills">
              {JLPT_LEVELS.map(l => (
                <button
                  key={l.value}
                  className={`kaiwa-pill ${level === l.value ? 'active' : ''}`}
                  onClick={() => setLevel(l.value as JLPTLevel)}
                >{l.label}</button>
              ))}
            </div>
          </div>
          <div className="kaiwa-setup-col">
            <label>Phong cách nói</label>
            <div className="kaiwa-style-pills">
              {CONVERSATION_STYLES.map(s => (
                <button
                  key={s.value}
                  className={`kaiwa-pill ${style === s.value ? 'active' : ''}`}
                  onClick={() => setStyle(s.value as ConversationStyle)}
                >{s.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="kaiwa-setup-divider" />

        <div className="kaiwa-setup-item kaiwa-topic-section">
          <label>Chủ đề hội thoại</label>
          <div className="kaiwa-topic-grid">
            {CONVERSATION_TOPICS.map(t => (
              <button
                key={t.value}
                className={`kaiwa-topic-btn ${topic === t.value ? 'active' : ''}`}
                onClick={() => handleTopicChange(t.value)}
              >
                <span className="topic-icon">{t.icon}</span>
                <span className="topic-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Role Selector */}
        {selectedScenario && (
          <div className="kaiwa-setup-item kaiwa-role-section">
            <label>
              <Users size={16} />
              Chọn vai trò của bạn
            </label>
            <div className="kaiwa-role-grid">
              {selectedScenario.roles.map((role: any) => (
                <button
                  key={role.id}
                  className={`kaiwa-role-btn ${userRole === role.id ? 'active' : ''}`}
                  onClick={() => setUserRole(role.id)}
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
    </>
  );
}
