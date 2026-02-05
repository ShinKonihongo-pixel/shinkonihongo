import type { SystemSettingsProps } from './settings-types';
import { ExportImportModal } from '../../common/export-import-modal';
import { useState } from 'react';

export function SystemSettings({
  settings,
  onUpdateSetting,
  onReset,
  currentUser,
  theme,
  themePresets = [],
  onApplyThemePreset,
  onResetTheme,
  flashcards = [],
  lessons = [],
  onImportData,
}: SystemSettingsProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <>
      <section className="settings-section">
        <h3>Mục tiêu tuần & Thông báo</h3>
        <p className="settings-description">Đặt mục tiêu học tập và nhận nhắc nhở ôn bài</p>

        <div className="setting-item">
          <label>Mục tiêu thẻ/tuần: {settings.weeklyCardsTarget}</label>
          <div className="setting-control">
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={settings.weeklyCardsTarget}
              onChange={(e) => onUpdateSetting('weeklyCardsTarget', parseInt(e.target.value))}
            />
            <span className="setting-value">{settings.weeklyCardsTarget} thẻ</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Mục tiêu thời gian/tuần: {settings.weeklyMinutesTarget} phút</label>
          <div className="setting-control">
            <input
              type="range"
              min="15"
              max="300"
              step="15"
              value={settings.weeklyMinutesTarget}
              onChange={(e) => onUpdateSetting('weeklyMinutesTarget', parseInt(e.target.value))}
            />
            <span className="setting-value">{settings.weeklyMinutesTarget} phút</span>
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label-with-toggle">
            <span>Nhiệm vụ học từ hàng ngày</span>
            <input
              type="checkbox"
              checked={settings.dailyWordsEnabled}
              onChange={(e) => onUpdateSetting('dailyWordsEnabled', e.target.checked)}
            />
          </label>
          <p className="setting-hint">Hiển thị nhiệm vụ học từ ngẫu nhiên mỗi ngày trên trang chủ</p>
        </div>

        {settings.dailyWordsEnabled && (
          <div className="setting-item">
            <label>Số từ mỗi ngày: {settings.dailyWordsTarget}</label>
            <div className="setting-control daily-words-options">
              {([5, 10, 15, 20] as const).map(num => (
                <button
                  key={num}
                  className={`daily-words-option ${settings.dailyWordsTarget === num ? 'active' : ''}`}
                  onClick={() => onUpdateSetting('dailyWordsTarget', num)}
                >
                  {num} từ
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="setting-item">
          <label>Sao lưu & Khôi phục dữ liệu</label>
          <button
            className="btn btn-secondary"
            onClick={() => setShowExportModal(true)}
          >
            📦 Xuất / Nhập dữ liệu
          </button>
        </div>
      </section>

      {isSuperAdmin && theme && (
        <section className="settings-section theme-section">
          <h3>Màu chủ đạo (Toàn trang web)</h3>
          <p className="settings-description">Chỉ Super Admin mới có thể thay đổi. Màu này sẽ áp dụng cho tất cả người dùng.</p>

          <div className="theme-current">
            <span>Đang sử dụng:</span>
            <div className="theme-current-preview">
              <div className="theme-color-preview" style={{ background: theme.primaryColor }} />
              <div className="theme-gradient-preview" style={{ background: theme.bodyGradient }} />
            </div>
          </div>

          <div className="theme-presets-container">
            {[
              { label: 'Cổ điển', presets: themePresets.slice(0, 4) },
              { label: 'Hiện đại', presets: themePresets.slice(4, 8) },
              { label: 'Tối & Sang trọng', presets: themePresets.slice(8, 12) },
              { label: 'Tự nhiên', presets: themePresets.slice(12, 16) },
            ].map(category => (
              <div className="theme-category" key={category.label}>
                <span className="theme-category-label">{category.label}</span>
                <div className="theme-preset-grid">
                  {category.presets.map((preset) => (
                    <button
                      key={preset.name}
                      className={`theme-preset-btn ${theme.primaryColor === preset.primary ? 'active' : ''}`}
                      onClick={() => onApplyThemePreset?.(preset)}
                      title={preset.name}
                    >
                      <div className="theme-preset-colors">
                        <div className="theme-preset-primary" style={{ background: preset.primary }} />
                        <div className="theme-preset-gradient" style={{ background: preset.gradient }} />
                      </div>
                      <span className="theme-preset-name">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-secondary btn-small" onClick={onResetTheme}>
            Khôi phục mặc định
          </button>
        </section>
      )}

      <div className="settings-actions">
        <button className="btn btn-secondary" onClick={onReset}>
          Khôi phục cài đặt mặc định
        </button>
      </div>

      {onImportData && (
        <ExportImportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          flashcards={flashcards}
          lessons={lessons}
          studySessions={[]}
          gameSessions={[]}
          jlptSessions={[]}
          onImport={onImportData}
        />
      )}
    </>
  );
}
