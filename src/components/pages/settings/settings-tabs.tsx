import type { SettingsTab } from './settings-types';

interface SettingsTabsProps {
  initialTab?: SettingsTab;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  pendingRequestsCount?: number;
}

export function SettingsTabs({ initialTab, activeTab, onTabChange, pendingRequestsCount = 0 }: SettingsTabsProps) {
  return (
    <div className="settings-main-tabs">
      {!initialTab && (
        <button
          className={`settings-main-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => onTabChange('general')}
        >
          <span className="tab-icon">🎛️</span>
          <span className="tab-label">Cài Đặt Chung</span>
        </button>
      )}
      {initialTab === 'profile' && (
        <>
          <button
            className={`settings-main-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => onTabChange('profile')}
          >
            <span className="tab-icon">👤</span>
            <span className="tab-label">Thông Tin Cá Nhân</span>
          </button>
          <button
            className={`settings-main-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => onTabChange('friends')}
          >
            <span className="tab-icon">👥</span>
            <span className="tab-label">Bạn bè & Huy hiệu</span>
            {pendingRequestsCount > 0 && (
              <span className="tab-badge">{pendingRequestsCount}</span>
            )}
          </button>
        </>
      )}
    </div>
  );
}
