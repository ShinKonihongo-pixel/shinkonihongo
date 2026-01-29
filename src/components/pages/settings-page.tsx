// Settings page component with tabs: General Settings and Personal Info
// Modularized for better maintainability - constants, types, utils in separate files

import { useState, useMemo, useEffect } from 'react';
import type { AppSettings, CardFrameId } from '../../hooks/use-settings';
import { CARD_FRAME_PRESETS } from '../../hooks/use-settings';
import type { UserJLPTLevel } from '../../types/user';
import { calculateUserLevel, USER_JLPT_LEVELS, USER_JLPT_LEVEL_LABELS } from '../../types/user';
import { ExportImportModal } from '../common/export-import-modal';
import { FriendsPanel } from '../friends/friends-panel';
import { BadgeGiftModal } from '../friends/badge-gift-modal';
import { BadgeStatsDisplay } from '../friends/badge-stats-display';
import { AVATAR_CATEGORIES, isImageAvatar } from '../../utils/avatar-icons';

// Import from modular settings files
import type { SettingsPageProps, SettingsTab, GeneralSubTab } from './settings/settings-types';
import {
  PROFILE_BACKGROUND_OPTIONS,
  GRADIENT_PRESETS,
  GRADIENT_CATEGORIES,
  KANJI_FONTS,
  type GradientCategory,
} from './settings/settings-constants';
import {
  getDeviceType,
  formatDuration,
  formatDate,
  getPreviewBackground,
  getCustomFrameStyle,
} from './settings/settings-utils';
import { GameSoundSettings } from './settings/settings-sound-panel';

// Re-export SettingsPageProps for external use
export type { SettingsPageProps } from './settings/settings-types';

// NOTE: GameSoundSettings component has been moved to ./settings/settings-sound-panel.tsx

export function SettingsPage({
  settings,
  onUpdateSetting,
  onReset,
  initialTab,
  currentUser,
  onUpdateDisplayName,
  onChangePassword,
  onUpdateAvatar,
  onUpdateProfileBackground,
  onUpdateJlptLevel,
  studySessions = [],
  gameSessions = [],
  jlptSessions = [],
  stats,
  historyLoading,
  theme,
  themePresets = [],
  onApplyThemePreset,
  onResetTheme,
  flashcards = [],
  lessons = [],
  onImportData,
  // Friends & Badges props
  allUsers = [],
  friends = [],
  pendingRequests = [],
  badgeStats,
  receivedBadges = [],
  friendsLoading = false,
  onSendFriendRequest,
  onRespondFriendRequest,
  onRemoveFriend,
  onSendBadge,
  isFriend = () => false,
}: SettingsPageProps) {
  // Tab state - use initialTab if provided
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'general');
  const [generalSubTab, setGeneralSubTab] = useState<GeneralSubTab>('flashcard');
  const [showExportModal, setShowExportModal] = useState(false);

  // Device type for font size preview
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>(getDeviceType);

  // Frame category filter
  const [frameCategory, setFrameCategory] = useState<string>('all');

  // Gradient category filter
  const [gradientCategory, setGradientCategory] = useState<GradientCategory>('all');

  // Auto-detect device on resize
  useEffect(() => {
    const handleResize = () => setSelectedDevice(getDeviceType());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Font size multiplier based on device type
  const fontSizeMultiplier = selectedDevice === 'desktop' ? 1 : selectedDevice === 'tablet' ? 0.7 : 0.5;

  // Profile form states
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'study' | 'game' | 'jlpt'>('study');
  const [badgeGiftTarget, setBadgeGiftTarget] = useState<{ id: string; name: string } | null>(null);
  const [jlptLevelMessage, setJlptLevelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      setSelectedAvatar(null);
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

  const handleUpdateJlptLevel = async (level: UserJLPTLevel) => {
    if (!onUpdateJlptLevel) return;
    const result = await onUpdateJlptLevel(level);
    if (result.success) {
      setJlptLevelMessage({ type: 'success', text: 'Đã cập nhật cấp độ học!' });
    } else {
      setJlptLevelMessage({ type: 'error', text: result.error || 'Lỗi' });
    }
    setTimeout(() => setJlptLevelMessage(null), 3000);
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Calculate user level from stats
  const userLevel = useMemo(() => {
    if (!stats) return null;
    return calculateUserLevel(stats);
  }, [stats]);

  return (
    <div className="settings-page">
      {/* Premium Header with Animated Background */}
      <div className="settings-header">
        {/* Animated background orbs */}
        <div className="settings-header-bg">
          <div className="settings-orb settings-orb-1" />
          <div className="settings-orb settings-orb-2" />
          <div className="settings-orb settings-orb-3" />
        </div>
        {/* Bottom wave transition */}
        <div className="settings-wave" />
        <div className="settings-header-content">
          <div className="settings-header-top">
            <div className="settings-logo">
              <span className="settings-logo-icon">設</span>
              <span className="settings-logo-text">Settings</span>
            </div>
          </div>
          <div className="settings-header-main">
            <h2>
              <span className="settings-title-jp">設定</span>
              <span className="settings-title-vn">Cài đặt</span>
            </h2>
            <p className="settings-header-subtitle">
              <span>Tùy chỉnh trải nghiệm học tập của bạn</span>
              <span className="settings-subtitle-jp">あなたの学習体験をカスタマイズ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Page Body */}
      <div className="settings-page-body">
        {/* Main Tabs */}
        <div className="settings-main-tabs">
          <button
            className={`settings-main-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <span className="tab-icon">🎛️</span>
            <span className="tab-label">Cài Đặt Chung</span>
          </button>
          <button
            className={`settings-main-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            <span className="tab-label">Thông Tin Cá Nhân</span>
          </button>
          <button
            className={`settings-main-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <span className="tab-icon">👥</span>
            <span className="tab-label">Bạn bè & Huy hiệu</span>
            {pendingRequests.length > 0 && (
              <span className="tab-badge">{pendingRequests.length}</span>
            )}
          </button>
        </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="settings-tab-content">
          {/* Sub-tabs Navigation */}
          <div className="settings-sub-tabs">
            <button
              className={`settings-sub-tab ${generalSubTab === 'flashcard' ? 'active' : ''}`}
              onClick={() => setGeneralSubTab('flashcard')}
            >
              <span className="sub-tab-icon">🎴</span>
              <span className="sub-tab-label">Thẻ học</span>
            </button>
            <button
              className={`settings-sub-tab ${generalSubTab === 'study' ? 'active' : ''}`}
              onClick={() => setGeneralSubTab('study')}
            >
              <span className="sub-tab-icon">📚</span>
              <span className="sub-tab-label">Học tập</span>
            </button>
            <button
              className={`settings-sub-tab ${generalSubTab === 'grammar' ? 'active' : ''}`}
              onClick={() => setGeneralSubTab('grammar')}
            >
              <span className="sub-tab-icon">📖</span>
              <span className="sub-tab-label">Ngữ pháp</span>
            </button>
            <button
              className={`settings-sub-tab ${generalSubTab === 'game' ? 'active' : ''}`}
              onClick={() => setGeneralSubTab('game')}
            >
              <span className="sub-tab-icon">🎮</span>
              <span className="sub-tab-label">Trò chơi</span>
            </button>
            <button
              className={`settings-sub-tab ${generalSubTab === 'kaiwa' ? 'active' : ''}`}
              onClick={() => setGeneralSubTab('kaiwa')}
            >
              <span className="sub-tab-icon">💬</span>
              <span className="sub-tab-label">Hội thoại</span>
            </button>
            <button
              className={`settings-sub-tab ${generalSubTab === 'system' ? 'active' : ''}`}
              onClick={() => setGeneralSubTab('system')}
            >
              <span className="sub-tab-icon">⚙️</span>
              <span className="sub-tab-label">Hệ thống</span>
            </button>
          </div>

          {/* ==================== FLASHCARD SUB-TAB - PRO DESIGN ==================== */}
          {generalSubTab === 'flashcard' && (
            <>
              <div className="fc-studio">
                {/* Row 1: Preview + Typography */}
                <div className="fc-studio-top">
                  {/* Preview: Front Card */}
                  <div className="fc-preview-area">
                    <div
                      className={`fc-preview-card fc-card-front ${CARD_FRAME_PRESETS.find(f => f.id === settings.cardFrame)?.animationClass || ''}`}
                      style={{
                        ...(settings.cardFrame === 'custom' ? getCustomFrameStyle(settings.customFrame) : CARD_FRAME_PRESETS.find(f => f.id === settings.cardFrame)?.css),
                        ...getPreviewBackground(settings),
                      }}
                    >
                      <span
                        className="fc-kanji"
                        style={{
                          fontFamily: `"${settings.kanjiFont}", serif`,
                          fontSize: `${Math.min(settings.kanjiFontSize * 0.4, 120)}px`,
                          fontWeight: settings.kanjiBold ? 900 : 400
                        }}
                      >
                        漢字
                      </span>
                    </div>
                    <div className="fc-preview-label">Mặt trước</div>
                  </div>

                  {/* Preview: Back Card */}
                  <div className="fc-preview-area">
                    <div className="fc-preview-card fc-card-back">
                      {settings.showSinoVietnamese && <div className="fc-sino" style={{ fontSize: `${settings.sinoVietnameseFontSize * 0.6}px` }}>HÁN TỰ</div>}
                      {settings.showVocabulary && <div className="fc-vocab" style={{ fontSize: `${settings.vocabularyFontSize * 0.6}px` }}>かんじ</div>}
                      {settings.showMeaning && <div className="fc-meaning" style={{ fontSize: `${settings.meaningFontSize * 0.6}px` }}>Chữ Hán</div>}
                    </div>
                    <div className="fc-preview-label">Mặt sau</div>
                  </div>

                  {/* Typography Section */}
                  <div className="fc-section fc-typography">
                    <div className="fc-section-header">
                      <span className="fc-section-title">Kiểu chữ</span>
                    </div>
                    <div className="fc-section-body">
                      <div className="fc-control-row">
                        <label>Font</label>
                        <select
                          value={settings.kanjiFont}
                          onChange={(e) => onUpdateSetting('kanjiFont', e.target.value)}
                          className="fc-select"
                        >
                          {KANJI_FONTS.map((font) => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                          ))}
                        </select>
                        <label className="fc-toggle-mini">
                          <input type="checkbox" checked={settings.kanjiBold} onChange={(e) => onUpdateSetting('kanjiBold', e.target.checked)} />
                          <span>B</span>
                        </label>
                      </div>
                      <div className="fc-control-row">
                        <label>Kanji</label>
                        <input type="range" min="100" max="400" step="10" value={settings.kanjiFontSize}
                          onChange={(e) => onUpdateSetting('kanjiFontSize', Number(e.target.value))} />
                        <span className="fc-value">{settings.kanjiFontSize}</span>
                      </div>
                      <div className="fc-control-row">
                        <label>Hán Việt</label>
                        <input type="range" min="16" max="60" step="2" value={settings.sinoVietnameseFontSize}
                          onChange={(e) => onUpdateSetting('sinoVietnameseFontSize', Number(e.target.value))} />
                        <span className="fc-value">{settings.sinoVietnameseFontSize}</span>
                      </div>
                      <div className="fc-control-row">
                        <label>Từ vựng</label>
                        <input type="range" min="16" max="60" step="2" value={settings.vocabularyFontSize}
                          onChange={(e) => onUpdateSetting('vocabularyFontSize', Number(e.target.value))} />
                        <span className="fc-value">{settings.vocabularyFontSize}</span>
                      </div>
                      <div className="fc-control-row">
                        <label>Nghĩa</label>
                        <input type="range" min="14" max="48" step="2" value={settings.meaningFontSize}
                          onChange={(e) => onUpdateSetting('meaningFontSize', Number(e.target.value))} />
                        <span className="fc-value">{settings.meaningFontSize}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Background, Frame */}
                <div className="fc-studio-bottom">
                  {/* Background Section */}
                  <div className="fc-section">
                    <div className="fc-section-header">
                      <span className="fc-section-icon">🎨</span>
                      <span className="fc-section-title">Nền thẻ</span>
                      <div className="fc-bg-tabs">
                        <button className={settings.cardBackgroundType === 'gradient' ? 'active' : ''} onClick={() => onUpdateSetting('cardBackgroundType', 'gradient')}>Gradient</button>
                        <button className={settings.cardBackgroundType === 'solid' ? 'active' : ''} onClick={() => onUpdateSetting('cardBackgroundType', 'solid')}>Màu</button>
                        <button className={settings.cardBackgroundType === 'image' ? 'active' : ''} onClick={() => onUpdateSetting('cardBackgroundType', 'image')}>Ảnh</button>
                      </div>
                    </div>
                    <div className="fc-section-body">
                      {settings.cardBackgroundType === 'gradient' && (
                        <>
                          <div className="fc-cat-tabs">
                            {GRADIENT_CATEGORIES.map(cat => (
                              <button key={cat.key} className={gradientCategory === cat.key ? 'active' : ''} onClick={() => setGradientCategory(cat.key)} title={cat.label}>{cat.icon}</button>
                            ))}
                          </div>
                          <div className="fc-palette">
                            {GRADIENT_PRESETS.filter(g => gradientCategory === 'all' || g.category === gradientCategory).map((preset, idx) => (
                              <button key={`${preset.category}-${idx}`} className={`fc-swatch ${settings.cardBackgroundGradient === preset.value ? 'active' : ''}`}
                                style={{ background: preset.value }} onClick={() => onUpdateSetting('cardBackgroundGradient', preset.value)} title={preset.label} />
                            ))}
                          </div>
                        </>
                      )}
                      {settings.cardBackgroundType === 'solid' && (
                        <div className="fc-color-row">
                          <input type="color" value={settings.cardBackgroundColor} onChange={(e) => onUpdateSetting('cardBackgroundColor', e.target.value)} />
                          {['#667eea', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e91e63'].map(c => (
                            <button key={c} className={`fc-color ${settings.cardBackgroundColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onUpdateSetting('cardBackgroundColor', c)} />
                          ))}
                        </div>
                      )}
                      {settings.cardBackgroundType === 'image' && (
                        <input type="text" className="fc-input" placeholder="Dán URL hình ảnh..." value={settings.cardBackgroundImage} onChange={(e) => onUpdateSetting('cardBackgroundImage', e.target.value)} />
                      )}
                    </div>
                  </div>

                  {/* Frame Section */}
                  <div className="fc-section">
                    <div className="fc-section-header">
                      <span className="fc-section-icon">🖼️</span>
                      <span className="fc-section-title">Khung</span>
                    </div>
                    <div className="fc-section-body">
                      <div className="fc-cat-tabs">
                        {[{ k: 'all', i: '🎨' }, { k: 'basic', i: '◻️' }, { k: 'gradient', i: '🌈' }, { k: 'shadow', i: '✨' }, { k: 'animated', i: '🔮' }, { k: 'custom', i: '⚙️' }].map(c => (
                          <button key={c.k} className={frameCategory === c.k ? 'active' : ''} onClick={() => setFrameCategory(c.k)}>{c.i}</button>
                        ))}
                      </div>
                      {frameCategory !== 'custom' ? (
                        <div className="fc-frames">
                          {CARD_FRAME_PRESETS.filter(f => frameCategory === 'all' || f.category === frameCategory || (frameCategory === 'basic' && f.id === 'none')).map(frame => (
                            <button key={frame.id} className={`fc-frame ${settings.cardFrame === frame.id ? 'active' : ''}`}
                              onClick={() => onUpdateSetting('cardFrame', frame.id as CardFrameId)} title={frame.name}
                              style={{ border: frame.id === 'none' ? '2px dashed #ccc' : (frame.css.border || 'none'), boxShadow: frame.css.boxShadow as string || 'none', borderRadius: frame.css.borderRadius as string || '4px' }}>
                              {frame.id === 'none' ? '✕' : '漢'}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="fc-custom-frame">
                          <div className="fc-cf-row">
                            <span>Viền</span>
                            <input type="range" min="1" max="10" value={settings.customFrame.borderWidth} onChange={(e) => onUpdateSetting('customFrame', { ...settings.customFrame, borderWidth: Number(e.target.value) })} />
                            <input type="color" value={settings.customFrame.borderColor} onChange={(e) => onUpdateSetting('customFrame', { ...settings.customFrame, borderColor: e.target.value })} />
                          </div>
                          <div className="fc-cf-row">
                            <span>Bo góc</span>
                            <input type="range" min="0" max="24" value={settings.customFrame.borderRadius} onChange={(e) => onUpdateSetting('customFrame', { ...settings.customFrame, borderRadius: Number(e.target.value) })} />
                            <label><input type="checkbox" checked={settings.customFrame.glowEnabled} onChange={(e) => onUpdateSetting('customFrame', { ...settings.customFrame, glowEnabled: e.target.checked })} /> Glow</label>
                          </div>
                          <button className="fc-apply-btn" onClick={() => onUpdateSetting('cardFrame', 'custom' as CardFrameId)}>Áp dụng khung</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

          {/* Hidden: Font Size Settings - Moved to Typography above */}
          <section className="settings-section" style={{ display: 'none' }}>
            <h3>Kích thước chữ</h3>

            <div className="setting-item">
              <label>Thiết bị xem trước</label>
              <div className="setting-control">
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value as DeviceType)}
                  className="font-select"
                >
                  <option value="desktop">🖥️ Máy tính</option>
                  <option value="tablet">📱 iPad</option>
                  <option value="mobile">📲 Điện thoại</option>
                </select>
                <span className="setting-value device-multiplier">×{fontSizeMultiplier}</span>
              </div>
            </div>

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
                <span className="setting-value">
                  {Math.round(settings.kanjiFontSize * fontSizeMultiplier)}px
                  {selectedDevice !== 'desktop' && <span className="original-size">({settings.kanjiFontSize})</span>}
                </span>
              </div>
            </div>

            <div className="setting-item" style={{ display: 'none' }}>
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
                <span className="setting-value">
                  {Math.round(settings.sinoVietnameseFontSize * fontSizeMultiplier)}px
                  {selectedDevice !== 'desktop' && <span className="original-size">({settings.sinoVietnameseFontSize})</span>}
                </span>
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
                <span className="setting-value">
                  {Math.round(settings.vocabularyFontSize * fontSizeMultiplier)}px
                  {selectedDevice !== 'desktop' && <span className="original-size">({settings.vocabularyFontSize})</span>}
                </span>
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
                <span className="setting-value">
                  {Math.round(settings.meaningFontSize * fontSizeMultiplier)}px
                  {selectedDevice !== 'desktop' && <span className="original-size">({settings.meaningFontSize})</span>}
                </span>
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
            </>
          )}

          {/* ==================== STUDY SUB-TAB ==================== */}
          {generalSubTab === 'study' && (
            <>
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
            </>
          )}

          {/* ==================== GRAMMAR SUB-TAB ==================== */}
          {generalSubTab === 'grammar' && (
            <>
              <section className="settings-section">
                <h3>Cài đặt thẻ Ngữ pháp</h3>
                <p className="settings-description">Tùy chỉnh thông tin hiển thị trên thẻ ngữ pháp khi học</p>

                {/* Front Side Settings */}
                <div className="grammar-display-section">
                  <h4>📋 Mặt trước (Câu hỏi)</h4>
                  <div className="grammar-toggles-grid">
                    <div className="setting-item compact">
                      <label>Tiêu đề ngữ pháp</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarFrontShowTitle}
                          onChange={(e) => onUpdateSetting('grammarFrontShowTitle', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Công thức</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarFrontShowFormula}
                          onChange={(e) => onUpdateSetting('grammarFrontShowFormula', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Nghĩa</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarFrontShowMeaning}
                          onChange={(e) => onUpdateSetting('grammarFrontShowMeaning', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Giải thích</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarFrontShowExplanation}
                          onChange={(e) => onUpdateSetting('grammarFrontShowExplanation', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Ví dụ</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarFrontShowExamples}
                          onChange={(e) => onUpdateSetting('grammarFrontShowExamples', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Badge JLPT</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarFrontShowLevel}
                          onChange={(e) => onUpdateSetting('grammarFrontShowLevel', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Badge bài học</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarFrontShowLesson}
                          onChange={(e) => onUpdateSetting('grammarFrontShowLesson', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Back Side Settings */}
                <div className="grammar-display-section">
                  <h4>📝 Mặt sau (Đáp án)</h4>
                  <div className="grammar-toggles-grid">
                    <div className="setting-item compact">
                      <label>Tiêu đề ngữ pháp</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarBackShowTitle}
                          onChange={(e) => onUpdateSetting('grammarBackShowTitle', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Công thức</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarBackShowFormula}
                          onChange={(e) => onUpdateSetting('grammarBackShowFormula', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Nghĩa</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarBackShowMeaning}
                          onChange={(e) => onUpdateSetting('grammarBackShowMeaning', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Giải thích</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarBackShowExplanation}
                          onChange={(e) => onUpdateSetting('grammarBackShowExplanation', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="setting-item compact">
                      <label>Ví dụ</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.grammarBackShowExamples}
                          onChange={(e) => onUpdateSetting('grammarBackShowExamples', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grammar-presets">
                  <h4>⚡ Cài đặt nhanh</h4>
                  <div className="preset-buttons">
                    <button
                      className="preset-btn"
                      onClick={() => {
                        onUpdateSetting('grammarFrontShowTitle', true);
                        onUpdateSetting('grammarFrontShowFormula', true);
                        onUpdateSetting('grammarFrontShowMeaning', false);
                        onUpdateSetting('grammarFrontShowExplanation', false);
                        onUpdateSetting('grammarFrontShowExamples', false);
                        onUpdateSetting('grammarBackShowTitle', false);
                        onUpdateSetting('grammarBackShowFormula', false);
                        onUpdateSetting('grammarBackShowMeaning', true);
                        onUpdateSetting('grammarBackShowExplanation', true);
                        onUpdateSetting('grammarBackShowExamples', true);
                      }}
                    >
                      🎯 Mặc định
                    </button>
                    <button
                      className="preset-btn"
                      onClick={() => {
                        onUpdateSetting('grammarFrontShowTitle', true);
                        onUpdateSetting('grammarFrontShowFormula', false);
                        onUpdateSetting('grammarFrontShowMeaning', false);
                        onUpdateSetting('grammarFrontShowExplanation', false);
                        onUpdateSetting('grammarFrontShowExamples', false);
                        onUpdateSetting('grammarBackShowTitle', false);
                        onUpdateSetting('grammarBackShowFormula', true);
                        onUpdateSetting('grammarBackShowMeaning', true);
                        onUpdateSetting('grammarBackShowExplanation', true);
                        onUpdateSetting('grammarBackShowExamples', true);
                      }}
                    >
                      📚 Chỉ tiêu đề
                    </button>
                    <button
                      className="preset-btn"
                      onClick={() => {
                        onUpdateSetting('grammarFrontShowTitle', true);
                        onUpdateSetting('grammarFrontShowFormula', true);
                        onUpdateSetting('grammarFrontShowMeaning', true);
                        onUpdateSetting('grammarFrontShowExplanation', false);
                        onUpdateSetting('grammarFrontShowExamples', false);
                        onUpdateSetting('grammarBackShowTitle', false);
                        onUpdateSetting('grammarBackShowFormula', false);
                        onUpdateSetting('grammarBackShowMeaning', false);
                        onUpdateSetting('grammarBackShowExplanation', true);
                        onUpdateSetting('grammarBackShowExamples', true);
                      }}
                    >
                      🔄 Đảo nghĩa
                    </button>
                    <button
                      className="preset-btn"
                      onClick={() => {
                        onUpdateSetting('grammarFrontShowTitle', true);
                        onUpdateSetting('grammarFrontShowFormula', true);
                        onUpdateSetting('grammarFrontShowMeaning', true);
                        onUpdateSetting('grammarFrontShowExplanation', true);
                        onUpdateSetting('grammarFrontShowExamples', true);
                        onUpdateSetting('grammarBackShowTitle', true);
                        onUpdateSetting('grammarBackShowFormula', true);
                        onUpdateSetting('grammarBackShowMeaning', true);
                        onUpdateSetting('grammarBackShowExplanation', true);
                        onUpdateSetting('grammarBackShowExamples', true);
                      }}
                    >
                      📖 Hiện tất cả
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ==================== GAME SUB-TAB ==================== */}
          {generalSubTab === 'game' && (
            <>
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

            <div className="setting-item">
              <label>Cỡ chữ câu hỏi (rem)</label>
              <div className="setting-control">
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="0.5"
                  value={settings.gameQuestionFontSize}
                  onChange={(e) => onUpdateSetting('gameQuestionFontSize', Number(e.target.value))}
                />
                <span className="setting-value">{settings.gameQuestionFontSize}rem</span>
              </div>
            </div>

            <div className="setting-item">
              <label>Cỡ chữ đáp án (rem)</label>
              <div className="setting-control">
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.1"
                  value={settings.gameAnswerFontSize}
                  onChange={(e) => onUpdateSetting('gameAnswerFontSize', Number(e.target.value))}
                />
                <span className="setting-value">{settings.gameAnswerFontSize}rem</span>
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

              {/* Question Source Settings */}
              <section className="settings-section">
                <h3>
                  <span className="section-icon">📚</span>
                  Nguồn câu hỏi
                </h3>
                <p className="settings-description">Chọn nguồn thẻ để tạo câu hỏi cho các trò chơi</p>

                <div className="question-source-options">
                  <label className="source-option">
                    <input
                      type="checkbox"
                      checked={settings.gameQuestionSources.includes('all')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onUpdateSetting('gameQuestionSources', ['all']);
                        } else {
                          const filtered = settings.gameQuestionSources.filter(s => s !== 'all');
                          onUpdateSetting('gameQuestionSources', filtered.length > 0 ? filtered : ['all']);
                        }
                      }}
                    />
                    <span className="source-label">Tất cả thẻ</span>
                  </label>

                  <label className="source-option">
                    <input
                      type="checkbox"
                      checked={settings.gameQuestionSources.includes('jlpt_level')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSources = settings.gameQuestionSources.filter(s => s !== 'all');
                          onUpdateSetting('gameQuestionSources', [...newSources, 'jlpt_level']);
                        } else {
                          const filtered = settings.gameQuestionSources.filter(s => s !== 'jlpt_level');
                          onUpdateSetting('gameQuestionSources', filtered.length > 0 ? filtered : ['all']);
                        }
                      }}
                    />
                    <span className="source-label">Theo cấp độ JLPT</span>
                  </label>

                  {settings.gameQuestionSources.includes('jlpt_level') && (
                    <div className="jlpt-level-buttons">
                      {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevelOption[]).map(level => (
                        <button
                          key={level}
                          className={`jlpt-btn ${settings.gameSelectedJLPTLevels.includes(level) ? 'active' : ''}`}
                          onClick={() => {
                            const newLevels = settings.gameSelectedJLPTLevels.includes(level)
                              ? settings.gameSelectedJLPTLevels.filter(l => l !== level)
                              : [...settings.gameSelectedJLPTLevels, level];
                            onUpdateSetting('gameSelectedJLPTLevels', newLevels);
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  )}

                  <label className="source-option">
                    <input
                      type="checkbox"
                      checked={settings.gameQuestionSources.includes('lesson')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSources = settings.gameQuestionSources.filter(s => s !== 'all');
                          onUpdateSetting('gameQuestionSources', [...newSources, 'lesson']);
                        } else {
                          const filtered = settings.gameQuestionSources.filter(s => s !== 'lesson');
                          onUpdateSetting('gameQuestionSources', filtered.length > 0 ? filtered : ['all']);
                        }
                      }}
                    />
                    <span className="source-label">Theo bài học</span>
                  </label>

                  {settings.gameQuestionSources.includes('lesson') && lessons.length > 0 && (
                    <div className="lesson-select-wrapper">
                      <select
                        multiple
                        className="lesson-multiselect"
                        value={settings.gameSelectedLessons}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                          onUpdateSetting('gameSelectedLessons', selected);
                        }}
                      >
                        {lessons.map(lesson => (
                          <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
                        ))}
                      </select>
                      <span className="lesson-hint">Giữ Ctrl để chọn nhiều bài</span>
                    </div>
                  )}

                  <label className="source-option">
                    <input
                      type="checkbox"
                      checked={settings.gameQuestionSources.includes('memorization')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSources = settings.gameQuestionSources.filter(s => s !== 'all');
                          onUpdateSetting('gameQuestionSources', [...newSources, 'memorization']);
                        } else {
                          const filtered = settings.gameQuestionSources.filter(s => s !== 'memorization');
                          onUpdateSetting('gameQuestionSources', filtered.length > 0 ? filtered : ['all']);
                        }
                      }}
                    />
                    <span className="source-label">Theo trạng thái</span>
                  </label>

                  {settings.gameQuestionSources.includes('memorization') && (
                    <div className="memorization-buttons">
                      {([
                        { value: 'all', label: 'Tất cả' },
                        { value: 'memorized', label: 'Đã thuộc' },
                        { value: 'not_memorized', label: 'Chưa thuộc' },
                      ] as { value: MemorizationFilter; label: string }[]).map(opt => (
                        <button
                          key={opt.value}
                          className={`mem-btn ${settings.gameMemorizationFilter === opt.value ? 'active' : ''}`}
                          onClick={() => onUpdateSetting('gameMemorizationFilter', opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="source-summary">
                  <span className="summary-icon">📊</span>
                  <span className="summary-text">
                    Số thẻ phù hợp: <strong>{flashcards.length}</strong>
                  </span>
                </div>
              </section>

              {/* AI Challenge Settings */}
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

              {/* JLPT Practice Settings */}
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

              {/* Game Sound Settings */}
              <GameSoundSettings />
            </>
          )}

          {/* ==================== KAIWA SUB-TAB ==================== */}
          {generalSubTab === 'kaiwa' && (
            <>
              {/* Kaiwa (Conversation) Settings */}
              <section className="settings-section">
                <h3>Cài đặt hội thoại (会話)</h3>
                <p className="settings-description">Cài đặt cho tính năng luyện hội thoại tiếng Nhật (chỉ VIP và Admin)</p>

            <div className="setting-item">
              <label>Giọng nói</label>
              <div className="setting-control">
                <select
                  value={settings.kaiwaVoiceGender}
                  onChange={(e) => onUpdateSetting('kaiwaVoiceGender', e.target.value as 'male' | 'female')}
                  className="font-select"
                >
                  <option value="female">Nữ (女性)</option>
                  <option value="male">Nam (男性)</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <label>Tốc độ nói: {settings.kaiwaVoiceRate.toFixed(1)}x</label>
              <div className="setting-control">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.kaiwaVoiceRate}
                  onChange={(e) => onUpdateSetting('kaiwaVoiceRate', parseFloat(e.target.value))}
                />
                <span className="setting-value">{settings.kaiwaVoiceRate.toFixed(1)}x</span>
              </div>
            </div>

            <div className="setting-item">
              <label>Tự động đọc phản hồi</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.kaiwaAutoSpeak}
                  onChange={(e) => onUpdateSetting('kaiwaAutoSpeak', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <label>Hiện gợi ý trả lời</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.kaiwaShowSuggestions}
                  onChange={(e) => onUpdateSetting('kaiwaShowSuggestions', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <label>Hiện bản dịch tiếng Việt</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.kaiwaShowTranslation}
                  onChange={(e) => onUpdateSetting('kaiwaShowTranslation', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <label>Chế độ gửi phát âm</label>
              <div className="setting-control">
                <select
                  value={settings.kaiwaSendMode}
                  onChange={(e) => onUpdateSetting('kaiwaSendMode', e.target.value as 'auto' | 'manual')}
                  className="font-select"
                >
                  <option value="manual">Thủ công (Manual)</option>
                  <option value="auto">Tự động (Auto)</option>
                </select>
              </div>
            </div>

            {settings.kaiwaSendMode === 'auto' && (
              <>
                <div className="setting-item">
                  <label>Ngưỡng tự động gửi</label>
                  <div className="setting-control">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.kaiwaAutoSendThreshold}
                      onChange={(e) => onUpdateSetting('kaiwaAutoSendThreshold', Number(e.target.value))}
                    />
                    <span className="slider-value">{settings.kaiwaAutoSendThreshold}%</span>
                  </div>
                </div>

                <div className="setting-item">
                  <label>Độ trễ trước khi gửi</label>
                  <div className="setting-control">
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.5"
                      value={settings.kaiwaAutoSendDelay}
                      onChange={(e) => onUpdateSetting('kaiwaAutoSendDelay', Number(e.target.value))}
                    />
                    <span className="slider-value">{settings.kaiwaAutoSendDelay}s</span>
                  </div>
                </div>
              </>
            )}

            <div className="setting-item">
              <label>Cấp độ mặc định</label>
              <div className="setting-control">
                <select
                  value={settings.kaiwaDefaultLevel}
                  onChange={(e) => onUpdateSetting('kaiwaDefaultLevel', e.target.value as 'N5' | 'N4' | 'N3' | 'N2' | 'N1')}
                  className="font-select"
                >
                  <option value="N5">N5 (Sơ cấp)</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1 (Cao cấp)</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <label>Phong cách nói mặc định</label>
              <div className="setting-control">
                <select
                  value={settings.kaiwaDefaultStyle}
                  onChange={(e) => onUpdateSetting('kaiwaDefaultStyle', e.target.value as 'casual' | 'polite' | 'formal')}
                  className="font-select"
                >
                  <option value="casual">Thân mật (タメ口)</option>
                  <option value="polite">Lịch sự (です/ます)</option>
                  <option value="formal">Trang trọng (敬語)</option>
                </select>
              </div>
            </div>
              </section>
            </>
          )}

          {/* ==================== SYSTEM SUB-TAB ==================== */}
          {generalSubTab === 'system' && (
            <>
              {/* Weekly Goals & Notifications */}
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

              {/* Theme Settings (Super Admin Only) */}
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

                  {/* Theme Presets Grid */}
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

              {/* Reset Settings Button */}
              <div className="settings-actions">
                <button className="btn btn-secondary" onClick={onReset}>
                  Khôi phục cài đặt mặc định
                </button>
              </div>
            </>
          )}
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
                  className={`profile-avatar clickable ${(selectedAvatar || currentUser.avatar) && isImageAvatar(selectedAvatar || currentUser.avatar || '') ? 'has-image' : ''}`}
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  title="Nhấp để đổi avatar"
                  style={{
                    background: (selectedAvatar || currentUser.avatar) && isImageAvatar(selectedAvatar || currentUser.avatar || '')
                      ? 'transparent'
                      : currentUser.profileBackground && currentUser.profileBackground !== 'transparent'
                        ? currentUser.profileBackground
                        : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                  }}
                >
                  {(selectedAvatar || currentUser.avatar) && isImageAvatar(selectedAvatar || currentUser.avatar || '') ? (
                    <img src={selectedAvatar || currentUser.avatar} alt="avatar" />
                  ) : (
                    selectedAvatar || currentUser.avatar || (currentUser.displayName || currentUser.username).charAt(0).toUpperCase()
                  )}
                </div>
                <span className="avatar-edit-hint">{selectedAvatar && selectedAvatar !== currentUser.avatar ? 'Xem trước - Nhấn Lưu để áp dụng' : 'Đổi avatar'}</span>
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

            {/* Avatar Picker - 100 icons organized by category */}
            {showAvatarPicker && (
              <div className="avatar-picker avatar-picker-expanded">
                <p className="avatar-picker-title">Chọn avatar (100 biểu tượng):</p>
                {AVATAR_CATEGORIES.map((category) => (
                  <div key={category.key} className="avatar-category">
                    <p className="avatar-category-label">{category.label}</p>
                    <div className={`avatar-options ${category.isImage ? 'avatar-options-images' : ''}`}>
                      {category.icons.map((avatar) => (
                        <button
                          key={avatar}
                          className={`avatar-option ${category.isImage ? 'avatar-option-image' : ''} ${(selectedAvatar || currentUser.avatar) === avatar ? 'active' : ''}`}
                          onClick={() => setSelectedAvatar(avatar)}
                        >
                          {isImageAvatar(avatar) ? (
                            <img src={avatar} alt="avatar" />
                          ) : (
                            avatar
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="avatar-picker-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => selectedAvatar && handleUpdateAvatar(selectedAvatar)}
                    disabled={!selectedAvatar || selectedAvatar === currentUser.avatar}
                  >
                    Lưu avatar
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setShowAvatarPicker(false); setSelectedAvatar(null); }}
                  >
                    Hủy
                  </button>
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

            {/* JLPT Level */}
            <div className="profile-form-group">
              <label>Cấp độ học JLPT</label>
              <p className="form-hint">Chọn cấp độ để nhận bài tập phù hợp với trình độ của bạn</p>
              <div className="jlpt-level-options">
                {USER_JLPT_LEVELS.map((level) => (
                  <button
                    key={level}
                    className={`jlpt-level-btn ${currentUser?.jlptLevel === level ? 'active' : ''}`}
                    onClick={() => handleUpdateJlptLevel(level)}
                  >
                    <span className="jlpt-level-name">{level}</span>
                    <span className="jlpt-level-desc">{USER_JLPT_LEVEL_LABELS[level].split(' - ')[1]}</span>
                  </button>
                ))}
              </div>
              {jlptLevelMessage && (
                <p className={`form-message ${jlptLevelMessage.type}`}>{jlptLevelMessage.text}</p>
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
                  <span className="stat-icon">📝</span>
                  <span className="stat-value">{stats.totalJLPTSessions}</span>
                  <span className="stat-label">Phiên JLPT</span>
                </div>
              </div>

              {/* Medal Statistics */}
              <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--gray-dark)' }}>Thành tích Game</h4>
              <div className="stats-grid medals-grid">
                <div className="stat-card medal-card gold">
                  <span className="stat-icon">🥇</span>
                  <span className="stat-value">{stats.goldMedals}</span>
                  <span className="stat-label">Hạng 1</span>
                </div>
                <div className="stat-card medal-card silver">
                  <span className="stat-icon">🥈</span>
                  <span className="stat-value">{stats.silverMedals}</span>
                  <span className="stat-label">Hạng 2</span>
                </div>
                <div className="stat-card medal-card bronze">
                  <span className="stat-icon">🥉</span>
                  <span className="stat-value">{stats.bronzeMedals}</span>
                  <span className="stat-label">Hạng 3</span>
                </div>
                <div className="stat-card medal-card total">
                  <span className="stat-icon">🏅</span>
                  <span className="stat-value">{stats.totalMedals}</span>
                  <span className="stat-label">Tổng huy chương</span>
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

      {/* Friends & Badges Tab */}
      {activeTab === 'friends' && currentUser && (
        <div className="settings-tab-content friends-tab-content">
          {/* Badge Stats Section */}
          <section className="settings-section badge-stats-section">
            <BadgeStatsDisplay
              stats={badgeStats ?? null}
              recentBadges={receivedBadges}
            />
          </section>

          {/* Friends Panel Section */}
          <section className="settings-section friends-panel-section">
            <FriendsPanel
              friends={friends}
              pendingRequests={pendingRequests}
              allUsers={allUsers}
              currentUserId={currentUser.id}
              loading={friendsLoading}
              onSendRequest={onSendFriendRequest || (async () => ({ success: false, error: 'Không khả dụng' }))}
              onRespondRequest={onRespondFriendRequest || (async () => false)}
              onRemoveFriend={onRemoveFriend || (async () => false)}
              onSendBadge={(friendId) => {
                const friend = friends.find(f => f.friendId === friendId);
                if (friend) {
                  setBadgeGiftTarget({ id: friendId, name: friend.friendName });
                }
              }}
              isFriend={isFriend}
            />
          </section>
        </div>
      )}

      {/* Show message if not logged in for friends tab */}
      {activeTab === 'friends' && !currentUser && (
        <div className="settings-tab-content">
          <p className="settings-not-logged-in">Vui lòng đăng nhập để sử dụng tính năng bạn bè.</p>
        </div>
      )}

      {/* Badge Gift Modal */}
      {badgeGiftTarget && onSendBadge && (
        <BadgeGiftModal
          isOpen={!!badgeGiftTarget}
          onClose={() => setBadgeGiftTarget(null)}
          friendName={badgeGiftTarget.name}
          friendId={badgeGiftTarget.id}
          onSendBadge={onSendBadge}
        />
      )}

      {/* Export/Import Modal */}
      {onImportData && (
        <ExportImportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          flashcards={flashcards}
          lessons={lessons}
          studySessions={studySessions}
          gameSessions={gameSessions}
          jlptSessions={jlptSessions}
          onImport={onImportData}
        />
      )}
      </div>{/* End settings-page-body */}
    </div>
  );
}
