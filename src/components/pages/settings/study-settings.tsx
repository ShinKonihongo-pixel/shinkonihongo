import type { StudySettingsProps } from './settings-types';

export function StudySettings({ settings, onUpdateSetting }: StudySettingsProps) {
  return (
    <>
      <section className="settings-section">
        <h3>Hành vi học</h3>

        <div className="setting-item">
          <label>Tự động chuyển từ khi nhấp {settings.clicksToAdvance} lần</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.autoAdvanceOnThirdClick}
              onChange={(e) => onUpdateSetting('autoAdvanceOnThirdClick', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {settings.autoAdvanceOnThirdClick && (
          <div className="setting-item">
            <label>Số lần nhấp để chuyển</label>
            <div className="setting-control">
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={settings.clicksToAdvance}
                onChange={(e) => onUpdateSetting('clicksToAdvance', Number(e.target.value))}
              />
              <span className="setting-value">{settings.clicksToAdvance}</span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
