import type { SettingsTab } from './settings-types';

interface SettingsHeaderProps {
  initialTab?: SettingsTab;
}

export function SettingsHeader({ initialTab }: SettingsHeaderProps) {
  return (
    <div className="settings-header">
      <div className="settings-header-bg">
        <div className="settings-orb settings-orb-1" />
        <div className="settings-orb settings-orb-2" />
        <div className="settings-orb settings-orb-3" />
      </div>
      <div className="settings-wave" />
      <div className="settings-header-content">
        <div className="settings-header-top">
          <div className="settings-logo">
            <span className="settings-logo-icon">{initialTab === 'profile' ? '個' : '設'}</span>
            <span className="settings-logo-text">{initialTab === 'profile' ? 'Profile' : 'Settings'}</span>
          </div>
        </div>
        <div className="settings-header-main">
          <h2>
            {initialTab === 'profile' ? (
              <>
                <span className="settings-title-jp">個人</span>
                <span className="settings-title-vn">Cá nhân</span>
              </>
            ) : (
              <>
                <span className="settings-title-jp">設定</span>
                <span className="settings-title-vn">Cài đặt</span>
              </>
            )}
          </h2>
          <p className="settings-header-subtitle">
            {initialTab === 'profile' ? (
              <>
                <span>Thông tin cá nhân, bạn bè và huy hiệu</span>
                <span className="settings-subtitle-jp">プロフィール、友達、バッジ</span>
              </>
            ) : (
              <>
                <span>Tùy chỉnh trải nghiệm học tập của bạn</span>
                <span className="settings-subtitle-jp">あなたの学習体験をカスタマイズ</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
