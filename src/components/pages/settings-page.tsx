// Settings page component with tabs: General Settings and Personal Info

import { useState, useMemo } from 'react';
import type { AppSettings, CardBackgroundType, GameQuestionContent, GameAnswerContent, GlobalTheme } from '../../hooks/use-settings';
import type { CurrentUser, StudySession, GameSession, JLPTSession, UserStats } from '../../types/user';
import { calculateUserLevel } from '../../types/user';

type SettingsTab = 'general' | 'profile';

interface ThemePreset {
  name: string;
  primary: string;
  dark: string;
  gradient: string;
}

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onReset: () => void;
  // Profile management props
  currentUser?: CurrentUser | null;
  onUpdateDisplayName?: (displayName: string) => Promise<{ success: boolean; error?: string }>;
  onChangePassword?: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateAvatar?: (avatar: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateProfileBackground?: (background: string) => Promise<{ success: boolean; error?: string }>;
  // History props
  studySessions?: StudySession[];
  gameSessions?: GameSession[];
  jlptSessions?: JLPTSession[];
  stats?: UserStats;
  historyLoading?: boolean;
  // Theme settings (super_admin only)
  theme?: GlobalTheme;
  themePresets?: ThemePreset[];
  onApplyThemePreset?: (preset: ThemePreset) => void;
  onResetTheme?: () => void;
}

// Avatar options (emojis)
const AVATAR_OPTIONS = [
  '😊', '😎', '🤓', '🥳', '😇', '🤩', '🥰', '😺',
  '🐱', '🐶', '🐼', '🦊', '🦁', '🐯', '🐻', '🐨',
  '🌸', '🌺', '🌻', '🌼', '🍀', '⭐', '🌙', '☀️',
  '🎮', '📚', '✏️', '🎨', '🎵', '🎯', '🏆', '💎',
];

// Profile background options
const PROFILE_BACKGROUND_OPTIONS = [
  { value: 'transparent', label: 'Trong suốt' },
  { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Tím xanh' },
  { value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Hồng' },
  { value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', label: 'Xanh dương' },
  { value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', label: 'Xanh lá' },
  { value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', label: 'Cam hồng' },
  { value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', label: 'Pastel' },
  { value: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', label: 'Xanh đậm' },
  { value: 'linear-gradient(135deg, #232526 0%, #414345 100%)', label: 'Xám đen' },
  { value: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', label: 'Đỏ' },
];

// Preset gradients for card background
const GRADIENT_PRESETS = [
  { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Tím xanh (Mặc định)' },
  { value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Hồng' },
  { value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', label: 'Xanh dương' },
  { value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', label: 'Xanh lá' },
  { value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', label: 'Cam hồng' },
  { value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', label: 'Pastel' },
  { value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', label: 'Hồng nhạt' },
  { value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', label: 'Cam nhạt' },
  { value: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', label: 'Xanh đậm' },
  { value: 'linear-gradient(135deg, #232526 0%, #414345 100%)', label: 'Xám đen' },
  { value: 'linear-gradient(135deg, #c31432 0%, #240b36 100%)', label: 'Đỏ đậm' },
  { value: 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)', label: 'Đỏ' },
];

// Get background style for preview
function getPreviewBackground(settings: AppSettings): React.CSSProperties {
  switch (settings.cardBackgroundType) {
    case 'solid':
      return { background: settings.cardBackgroundColor };
    case 'image':
      return settings.cardBackgroundImage
        ? {
            backgroundImage: `url(${settings.cardBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : { background: settings.cardBackgroundGradient };
    case 'gradient':
    default:
      return { background: settings.cardBackgroundGradient };
  }
}

const KANJI_FONTS = [
  { value: 'Noto Serif JP', label: 'Noto Serif JP' },
  { value: 'Shippori Mincho', label: 'Shippori Mincho' },
  { value: 'Zen Old Mincho', label: 'Zen Old Mincho' },
  { value: 'Zen Antique', label: 'Zen Antique' },
  { value: 'Noto Sans JP', label: 'Noto Sans JP' },
  { value: 'Zen Maru Gothic', label: 'Zen Maru Gothic' },
  { value: 'Zen Kurenaido', label: 'Zen Kurenaido' },
  { value: 'Klee One', label: 'Klee One (Giáo khoa)' },
  { value: 'Hachi Maru Pop', label: 'Hachi Maru Pop (Dễ thương)' },
  { value: 'MS Mincho', label: 'MS Mincho (Hệ thống)' },
];

// Format duration in seconds to readable string
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// Format date to readable string
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function SettingsPage({
  settings,
  onUpdateSetting,
  onReset,
  currentUser,
  onUpdateDisplayName,
  onChangePassword,
  onUpdateAvatar,
  onUpdateProfileBackground,
  studySessions = [],
  gameSessions = [],
  jlptSessions = [],
  stats,
  historyLoading,
  theme,
  themePresets = [],
  onApplyThemePreset,
  onResetTheme,
}: SettingsPageProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Profile form states
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'study' | 'game' | 'jlpt'>('study');

  const handleUpdateDisplayName = async () => {
    if (!onUpdateDisplayName) return;
    const result = await onUpdateDisplayName(displayName);
    if (result.success) {
      setProfileMessage({ type: 'success', text: 'Đã cập nhật tên hiển thị!' });
    } else {
      setProfileMessage({ type: 'error', text: result.error || 'Lỗi' });
    }
    setTimeout(() => setProfileMessage(null), 3000);
  };

  const handleChangePassword = async () => {
    if (!onChangePassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      setTimeout(() => setPasswordMessage(null), 3000);
      return;
    }
    const result = await onChangePassword(oldPassword, newPassword);
    if (result.success) {
      setPasswordMessage({ type: 'success', text: 'Đã đổi mật khẩu!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMessage({ type: 'error', text: result.error || 'Lỗi' });
    }
    setTimeout(() => setPasswordMessage(null), 3000);
  };

  const handleUpdateAvatar = async (avatar: string) => {
    if (!onUpdateAvatar) return;
    const result = await onUpdateAvatar(avatar);
    if (result.success) {
      setAvatarMessage({ type: 'success', text: 'Đã cập nhật avatar!' });
      setShowAvatarPicker(false);
    } else {
      setAvatarMessage({ type: 'error', text: result.error || 'Lỗi' });
    }
    setTimeout(() => setAvatarMessage(null), 3000);
  };

  const handleUpdateProfileBackground = async (background: string) => {
    if (!onUpdateProfileBackground) return;
    const result = await onUpdateProfileBackground(background);
    if (!result.success) {
      setProfileMessage({ type: 'error', text: result.error || 'Lỗi' });
      setTimeout(() => setProfileMessage(null), 3000);
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Calculate user level from stats
  const userLevel = useMemo(() => {
    if (!stats) return null;
    return calculateUserLevel(stats);
  }, [stats]);

  return (
    <div className="settings-page">
      <h2>Cài đặt</h2>

      {/* Main Tabs */}
      <div className="settings-main-tabs">
        <button
          className={`settings-main-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Cài Đặt Chung
        </button>
        <button
          className={`settings-main-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Thông Tin Cá Nhân
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="settings-tab-content">
          {/* Font Settings */}
          <section className="settings-section">
            <h3>Font chữ</h3>

            <div className="setting-item">
              <label>Font Kanji</label>
              <div className="setting-control">
                <select
                  value={settings.kanjiFont}
                  onChange={(e) => onUpdateSetting('kanjiFont', e.target.value)}
                  className="font-select"
                >
                  {KANJI_FONTS.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="setting-item">
              <label>In đậm Kanji</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.kanjiBold}
                  onChange={(e) => onUpdateSetting('kanjiBold', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Font Preview */}
            <div className="font-preview" style={getPreviewBackground(settings)}>
              <div className="font-preview-label">Xem trước:</div>
              <div
                className="font-preview-text"
                style={{
                  fontFamily: `"${settings.kanjiFont}", serif`,
                  fontSize: `${Math.min(settings.kanjiFontSize, 150)}px`,
                  fontWeight: settings.kanjiBold ? 900 : 400
                }}
              >
                漢字
              </div>
              <div className="font-preview-samples">
                <span style={{ fontFamily: `"${settings.kanjiFont}", serif`, fontWeight: settings.kanjiBold ? 900 : 400 }}>永 愛 飛 龍 鬱</span>
              </div>
            </div>
          </section>

          {/* Card Background Settings */}
          <section className="settings-section">
            <h3>Nền thẻ flashcard</h3>

            <div className="setting-item">
              <label>Loại nền</label>
              <div className="setting-control">
                <select
                  value={settings.cardBackgroundType}
                  onChange={(e) => onUpdateSetting('cardBackgroundType', e.target.value as CardBackgroundType)}
                  className="font-select"
                >
                  <option value="gradient">Gradient</option>
                  <option value="solid">Màu đơn</option>
                  <option value="image">Hình ảnh</option>
                </select>
              </div>
            </div>

            {settings.cardBackgroundType === 'gradient' && (
              <>
                <div className="setting-item">
                  <label>Chọn gradient</label>
                  <div className="setting-control">
                    <select
                      value={settings.cardBackgroundGradient}
                      onChange={(e) => onUpdateSetting('cardBackgroundGradient', e.target.value)}
                      className="font-select"
                    >
                      {GRADIENT_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="gradient-preview-grid">
                  {GRADIENT_PRESETS.map((preset) => (
                    <div
                      key={preset.value}
                      className={`gradient-preview-item ${settings.cardBackgroundGradient === preset.value ? 'active' : ''}`}
                      style={{ background: preset.value }}
                      onClick={() => onUpdateSetting('cardBackgroundGradient', preset.value)}
                      title={preset.label}
                    />
                  ))}
                </div>
              </>
            )}

            {settings.cardBackgroundType === 'solid' && (
              <div className="setting-item">
                <label>Chọn màu</label>
                <div className="setting-control">
                  <input
                    type="color"
                    value={settings.cardBackgroundColor}
                    onChange={(e) => onUpdateSetting('cardBackgroundColor', e.target.value)}
                    className="color-picker"
                  />
                  <span className="setting-value">{settings.cardBackgroundColor}</span>
                </div>
              </div>
            )}

            {settings.cardBackgroundType === 'image' && (
              <div className="setting-item">
                <label>URL hình ảnh</label>
                <div className="setting-control full-width">
                  <input
                    type="text"
                    value={settings.cardBackgroundImage}
                    onChange={(e) => onUpdateSetting('cardBackgroundImage', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="url-input"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Font Size Settings */}
          <section className="settings-section">
            <h3>Kích thước chữ</h3>

            <div className="setting-item">
              <label>Kanji (mặt trước)</label>
              <div className="setting-control">
                <input
                  type="range"
                  min="100"
                  max="400"
                  step="10"
                  value={settings.kanjiFontSize}
                  onChange={(e) => onUpdateSetting('kanjiFontSize', Number(e.target.value))}
                />
                <span className="setting-value">{settings.kanjiFontSize}px</span>
              </div>
            </div>

            <div className="setting-item">
              <label>Âm Hán Việt</label>
              <div className="setting-control">
                <input
                  type="range"
                  min="16"
                  max="60"
                  step="2"
                  value={settings.sinoVietnameseFontSize}
                  onChange={(e) => onUpdateSetting('sinoVietnameseFontSize', Number(e.target.value))}
                />
                <span className="setting-value">{settings.sinoVietnameseFontSize}px</span>
              </div>
            </div>

            <div className="setting-item">
              <label>Từ vựng</label>
              <div className="setting-control">
                <input
                  type="range"
                  min="16"
                  max="60"
                  step="2"
                  value={settings.vocabularyFontSize}
                  onChange={(e) => onUpdateSetting('vocabularyFontSize', Number(e.target.value))}
                />
                <span className="setting-value">{settings.vocabularyFontSize}px</span>
              </div>
            </div>

            <div className="setting-item">
              <label>Nghĩa</label>
              <div className="setting-control">
                <input
                  type="range"
                  min="14"
                  max="48"
                  step="2"
                  value={settings.meaningFontSize}
                  onChange={(e) => onUpdateSetting('meaningFontSize', Number(e.target.value))}
                />
                <span className="setting-value">{settings.meaningFontSize}px</span>
              </div>
            </div>
          </section>

          {/* Field Visibility Settings */}
          <section className="settings-section">
            <h3>Hiển thị trường (mặt sau)</h3>

            <div className="setting-item">
              <label>Từ vựng</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.showVocabulary}
                  onChange={(e) => onUpdateSetting('showVocabulary', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <label>Âm Hán Việt</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.showSinoVietnamese}
                  onChange={(e) => onUpdateSetting('showSinoVietnamese', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <label>Nghĩa</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.showMeaning}
                  onChange={(e) => onUpdateSetting('showMeaning', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <label>Ví dụ</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.showExample}
                  onChange={(e) => onUpdateSetting('showExample', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          {/* Study Behavior Settings */}
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

          {/* Game Settings */}
          <section className="settings-section">
            <h3>Cài đặt trò chơi</h3>
            <p className="settings-description">Cài đặt nội dung hiển thị trong trò chơi Quiz Game</p>

            <div className="setting-item">
              <label>Nội dung câu hỏi</label>
              <div className="setting-control">
                <select
                  value={settings.gameQuestionContent}
                  onChange={(e) => onUpdateSetting('gameQuestionContent', e.target.value as GameQuestionContent)}
                  className="font-select"
                >
                  <option value="kanji">Kanji</option>
                  <option value="vocabulary">Từ vựng (Hiragana)</option>
                  <option value="meaning">Nghĩa</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <label>Nội dung câu trả lời</label>
              <div className="setting-control">
                <select
                  value={settings.gameAnswerContent}
                  onChange={(e) => onUpdateSetting('gameAnswerContent', e.target.value as GameAnswerContent)}
                  className="font-select"
                >
                  <option value="vocabulary_meaning">Từ vựng + Nghĩa (Mặc định)</option>
                  <option value="kanji">Kanji</option>
                  <option value="vocabulary">Từ vựng (Hiragana)</option>
                  <option value="meaning">Nghĩa</option>
                </select>
              </div>
            </div>

            <div className="game-settings-preview">
              <div className="preview-label">Xem trước:</div>
              <div className="preview-content">
                <div className="preview-question">
                  <span className="preview-badge">Câu hỏi</span>
                  <span className="preview-text">
                    {settings.gameQuestionContent === 'kanji' && '漢字'}
                    {settings.gameQuestionContent === 'vocabulary' && 'かんじ'}
                    {settings.gameQuestionContent === 'meaning' && 'Chữ Hán'}
                  </span>
                </div>
                <div className="preview-arrow">→</div>
                <div className="preview-answer">
                  <span className="preview-badge">Đáp án</span>
                  <span className="preview-text">
                    {settings.gameAnswerContent === 'kanji' && '漢字'}
                    {settings.gameAnswerContent === 'vocabulary' && 'かんじ'}
                    {settings.gameAnswerContent === 'meaning' && 'Chữ Hán'}
                    {settings.gameAnswerContent === 'vocabulary_meaning' && 'かんじ - Chữ Hán'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Theme Settings (Super Admin Only) */}
          {isSuperAdmin && theme && (
            <section className="settings-section theme-section">
              <h3>Màu chủ đạo (Toàn trang web)</h3>
              <p className="settings-description">Chỉ Super Admin mới có thể thay đổi</p>

              <div className="theme-current">
                <span>Màu hiện tại:</span>
                <div
                  className="theme-color-preview"
                  style={{ background: theme.primaryColor }}
                />
                <span className="theme-color-value">{theme.primaryColor}</span>
              </div>

              <div className="theme-presets">
                <label>Chọn theme:</label>
                <div className="theme-preset-grid">
                  {themePresets.map((preset) => (
                    <button
                      key={preset.name}
                      className={`theme-preset-btn ${theme.primaryColor === preset.primary ? 'active' : ''}`}
                      onClick={() => onApplyThemePreset?.(preset)}
                      title={preset.name}
                    >
                      <div
                        className="theme-preset-color"
                        style={{ background: preset.primary }}
                      />
                      <div
                        className="theme-preset-gradient"
                        style={{ background: preset.gradient }}
                      />
                      <span className="theme-preset-name">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-secondary btn-small" onClick={onResetTheme}>
                Khôi phục theme mặc định
              </button>
            </section>
          )}

          {/* Reset Button */}
          <div className="settings-actions">
            <button className="btn btn-secondary" onClick={onReset}>
              Khôi phục mặc định
            </button>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && currentUser && (
        <div className="settings-tab-content">
          {/* Profile Info Section */}
          <section className="settings-section profile-section">
            <h3>Thông tin tài khoản</h3>

            <div className="profile-info">
              <div className="profile-avatar-wrapper">
                <div
                  className="profile-avatar clickable"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  title="Nhấp để đổi avatar"
                  style={{
                    background: currentUser.profileBackground && currentUser.profileBackground !== 'transparent'
                      ? currentUser.profileBackground
                      : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                  }}
                >
                  {currentUser.avatar || (currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
                </div>
                <span className="avatar-edit-hint">Đổi avatar</span>
              </div>
              <div className="profile-details">
                <p className="profile-name">{currentUser.displayName || currentUser.username}</p>
                <p className="profile-username">@{currentUser.username}</p>
                <div className="profile-badges">
                  <span className={`role-badge role-${currentUser.role}`}>
                    {currentUser.role === 'super_admin' ? 'Super Admin' :
                     currentUser.role === 'admin' ? 'Admin' :
                     currentUser.role === 'vip_user' ? 'VIP' : 'User'}
                  </span>
                  {userLevel && (
                    <span className="level-badge">
                      Lv.{userLevel.level} {userLevel.title}
                    </span>
                  )}
                </div>
                {userLevel && (
                  <div className="level-progress-container">
                    <div className="level-progress-bar">
                      <div
                        className="level-progress-fill"
                        style={{ width: `${userLevel.progress}%` }}
                      />
                    </div>
                    <span className="level-progress-text">{userLevel.xp} XP</span>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Picker */}
            {showAvatarPicker && (
              <div className="avatar-picker">
                <p className="avatar-picker-title">Chọn avatar:</p>
                <div className="avatar-options">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      className={`avatar-option ${currentUser.avatar === emoji ? 'active' : ''}`}
                      onClick={() => handleUpdateAvatar(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {avatarMessage && (
                  <p className={`form-message ${avatarMessage.type}`}>{avatarMessage.text}</p>
                )}
              </div>
            )}

            {/* Profile Background */}
            <div className="profile-form-group">
              <label>Background cá nhân</label>
              <div className="profile-bg-options">
                {PROFILE_BACKGROUND_OPTIONS.map((bg) => (
                  <button
                    key={bg.value}
                    className={`profile-bg-option ${currentUser.profileBackground === bg.value ? 'active' : ''}`}
                    style={{ background: bg.value }}
                    onClick={() => handleUpdateProfileBackground(bg.value)}
                    title={bg.label}
                  />
                ))}
              </div>
            </div>

            {/* Display Name */}
            <div className="profile-form-group">
              <label>Tên hiển thị</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên hiển thị"
                className="profile-input"
              />
              <div className="profile-action">
                <button
                  className="btn btn-small btn-orange"
                  onClick={handleUpdateDisplayName}
                  disabled={!displayName || displayName === currentUser.displayName}
                >
                  Lưu tên hiển thị
                </button>
              </div>
              {profileMessage && (
                <p className={`form-message ${profileMessage.type}`}>{profileMessage.text}</p>
              )}
            </div>

            {/* Password Change */}
            <div className="profile-form-group password-section">
              <label>Đổi mật khẩu</label>
              <div className="password-inputs">
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Mật khẩu hiện tại"
                  className="profile-input"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới"
                  className="profile-input"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  className="profile-input"
                />
              </div>
              <div className="password-action">
                <button
                  className="btn btn-small btn-orange"
                  onClick={handleChangePassword}
                  disabled={!oldPassword || !newPassword || !confirmPassword}
                >
                  Đổi mật khẩu
                </button>
              </div>
              {passwordMessage && (
                <p className={`form-message ${passwordMessage.type}`}>{passwordMessage.text}</p>
              )}
            </div>
          </section>

          {/* Statistics Section */}
          {stats && (
            <section className="settings-section stats-section">
              <h3>Thống kê hoạt động</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">📚</span>
                  <span className="stat-value">{stats.totalStudySessions}</span>
                  <span className="stat-label">Phiên học</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">⏱️</span>
                  <span className="stat-value">{formatDuration(stats.totalStudyTime)}</span>
                  <span className="stat-label">Thời gian học</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🎮</span>
                  <span className="stat-value">{stats.totalGamesPlayed}</span>
                  <span className="stat-label">Game đã chơi</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🏆</span>
                  <span className="stat-value">{stats.totalGameWins}</span>
                  <span className="stat-label">Chiến thắng</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">📝</span>
                  <span className="stat-value">{stats.totalJLPTSessions}</span>
                  <span className="stat-label">Phiên JLPT</span>
                </div>
              </div>
            </section>
          )}

          {/* History Section */}
          <section className="settings-section history-section">
            <h3>Lịch sử hoạt động</h3>
            <div className="history-tabs">
              <button
                className={`history-tab ${activeHistoryTab === 'study' ? 'active' : ''}`}
                onClick={() => setActiveHistoryTab('study')}
              >
                Học tập ({studySessions.length})
              </button>
              <button
                className={`history-tab ${activeHistoryTab === 'game' ? 'active' : ''}`}
                onClick={() => setActiveHistoryTab('game')}
              >
                Game ({gameSessions.length})
              </button>
              <button
                className={`history-tab ${activeHistoryTab === 'jlpt' ? 'active' : ''}`}
                onClick={() => setActiveHistoryTab('jlpt')}
              >
                JLPT ({jlptSessions.length})
              </button>
            </div>

            {historyLoading ? (
              <p className="history-loading">Đang tải...</p>
            ) : (
              <div className="history-content">
                {activeHistoryTab === 'study' && (
                  <div className="history-list">
                    {studySessions.length === 0 ? (
                      <p className="history-empty">Chưa có lịch sử học tập</p>
                    ) : (
                      studySessions.slice(0, 10).map(session => (
                        <div key={session.id} className="history-item">
                          <div className="history-item-main">
                            <span className="history-date">{formatDate(session.date)}</span>
                            <span className="history-detail">{session.cardsStudied} thẻ</span>
                          </div>
                          <div className="history-item-sub">
                            <span>Đúng: {session.correctCount}/{session.cardsStudied}</span>
                            <span>{formatDuration(session.duration)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeHistoryTab === 'game' && (
                  <div className="history-list">
                    {gameSessions.length === 0 ? (
                      <p className="history-empty">Chưa có lịch sử chơi game</p>
                    ) : (
                      gameSessions.slice(0, 10).map(session => (
                        <div key={session.id} className="history-item">
                          <div className="history-item-main">
                            <span className="history-date">{formatDate(session.date)}</span>
                            <span className="history-title">{session.gameTitle}</span>
                          </div>
                          <div className="history-item-sub">
                            <span className={session.rank === 1 ? 'rank-win' : ''}>
                              #{session.rank}/{session.totalPlayers}
                            </span>
                            <span>{session.score} điểm</span>
                            <span>{session.correctAnswers}/{session.totalQuestions} đúng</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeHistoryTab === 'jlpt' && (
                  <div className="history-list">
                    {jlptSessions.length === 0 ? (
                      <p className="history-empty">Chưa có lịch sử luyện JLPT</p>
                    ) : (
                      jlptSessions.slice(0, 10).map(session => (
                        <div key={session.id} className="history-item">
                          <div className="history-item-main">
                            <span className="history-date">{formatDate(session.date)}</span>
                            <span className="history-level">{session.level}</span>
                            <span className="history-category">{session.category}</span>
                          </div>
                          <div className="history-item-sub">
                            <span>{session.correctCount}/{session.totalQuestions} đúng</span>
                            <span>{formatDuration(session.duration)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Show message if not logged in for profile tab */}
      {activeTab === 'profile' && !currentUser && (
        <div className="settings-tab-content">
          <p className="settings-not-logged-in">Vui lòng đăng nhập để xem thông tin cá nhân.</p>
        </div>
      )}
    </div>
  );
}
