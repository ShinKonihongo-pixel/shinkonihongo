import type { GeneralSubTab } from './settings-types';

interface SettingsSubTabsProps {
  activeSubTab: GeneralSubTab;
  onSubTabChange: (subTab: GeneralSubTab) => void;
}

export function SettingsSubTabs({ activeSubTab, onSubTabChange }: SettingsSubTabsProps) {
  return (
    <div className="settings-sub-tabs">
      <button
        className={`settings-sub-tab ${activeSubTab === 'flashcard' ? 'active' : ''}`}
        onClick={() => onSubTabChange('flashcard')}
      >
        <span className="sub-tab-icon">🎴</span>
        <span className="sub-tab-label">Thẻ học</span>
      </button>
      <button
        className={`settings-sub-tab ${activeSubTab === 'study' ? 'active' : ''}`}
        onClick={() => onSubTabChange('study')}
      >
        <span className="sub-tab-icon">📚</span>
        <span className="sub-tab-label">Học tập</span>
      </button>
      <button
        className={`settings-sub-tab ${activeSubTab === 'grammar' ? 'active' : ''}`}
        onClick={() => onSubTabChange('grammar')}
      >
        <span className="sub-tab-icon">📖</span>
        <span className="sub-tab-label">Ngữ pháp</span>
      </button>
      <button
        className={`settings-sub-tab ${activeSubTab === 'game' ? 'active' : ''}`}
        onClick={() => onSubTabChange('game')}
      >
        <span className="sub-tab-icon">🎮</span>
        <span className="sub-tab-label">Trò chơi</span>
      </button>
      <button
        className={`settings-sub-tab ${activeSubTab === 'kaiwa' ? 'active' : ''}`}
        onClick={() => onSubTabChange('kaiwa')}
      >
        <span className="sub-tab-icon">💬</span>
        <span className="sub-tab-label">Hội thoại</span>
      </button>
      <button
        className={`settings-sub-tab ${activeSubTab === 'listening' ? 'active' : ''}`}
        onClick={() => onSubTabChange('listening')}
      >
        <span className="sub-tab-icon">🎧</span>
        <span className="sub-tab-label">Nghe Hiểu</span>
      </button>
      <button
        className={`settings-sub-tab ${activeSubTab === 'system' ? 'active' : ''}`}
        onClick={() => onSubTabChange('system')}
      >
        <span className="sub-tab-icon">⚙️</span>
        <span className="sub-tab-label">Hệ thống</span>
      </button>
    </div>
  );
}
