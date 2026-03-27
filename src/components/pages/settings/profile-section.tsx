// Profile section component - extracted from settings-page.tsx
// Handles user profile display and editing

import { useMemo, useEffect } from 'react';
import type { ProfileSettingsProps } from './settings-types';
import { useProfileHandlers } from './hooks/use-profile-handlers';
import { AVATAR_CATEGORIES, isImageAvatar } from '../../../utils/avatar-icons';
import { calculateUserLevel } from '../../../types/user';
import { ModalShell } from '../../ui/modal-shell';

export function ProfileSection(props: ProfileSettingsProps) {
  const {
    currentUser,
    stats,
  } = props;

  const profileHandlers = useProfileHandlers(
    currentUser || undefined,
    props.onUpdateDisplayName,
    props.onChangePassword,
    props.onUpdateAvatar,
    props.onUpdateProfileBackground,
    props.onUpdateJlptLevel
  );

  const userLevel = useMemo(() => {
    if (!stats) return null;
    return calculateUserLevel(stats);
  }, [stats]);


  if (!currentUser) {
    return (
      <div className="settings-tab-content">
        <p className="settings-not-logged-in">Vui lòng đăng nhập để xem thông tin cá nhân.</p>
      </div>
    );
  }

  const bannerBg = currentUser.profileBackground && currentUser.profileBackground !== 'transparent'
    ? currentUser.profileBackground
    : undefined;

  return (
    <div className="settings-tab-content">
      <section className="settings-section profile-section">
        <h3>Thông tin tài khoản</h3>

        <div
          className="profile-info"
          style={bannerBg ? { '--profile-banner': bannerBg } as React.CSSProperties : undefined}
        >
          <div className="profile-avatar-wrapper">
            <div
              className={`profile-avatar clickable ${(profileHandlers.selectedAvatar || currentUser.avatar) && isImageAvatar(profileHandlers.selectedAvatar || currentUser.avatar || '') ? 'has-image' : ''}`}
              onClick={() => profileHandlers.setShowAvatarPicker(!profileHandlers.showAvatarPicker)}
              title="Nhấp để đổi avatar"
              style={{
                background: (profileHandlers.selectedAvatar || currentUser.avatar) && isImageAvatar(profileHandlers.selectedAvatar || currentUser.avatar || '')
                  ? 'transparent'
                  : currentUser.profileBackground && currentUser.profileBackground !== 'transparent'
                    ? currentUser.profileBackground
                    : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
              }}
            >
              {(profileHandlers.selectedAvatar || currentUser.avatar) && isImageAvatar(profileHandlers.selectedAvatar || currentUser.avatar || '') ? (
                <img src={profileHandlers.selectedAvatar || currentUser.avatar} alt="avatar" loading="lazy" />
              ) : (
                profileHandlers.selectedAvatar || currentUser.avatar || (currentUser.displayName || currentUser.username).charAt(0).toUpperCase()
              )}
            </div>
            <span className="avatar-edit-hint">
              {profileHandlers.selectedAvatar && profileHandlers.selectedAvatar !== currentUser.avatar ? 'Xem trước - Nhấn Lưu để áp dụng' : 'Đổi avatar'}
            </span>
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

        <ModalShell
          isOpen={profileHandlers.showAvatarPicker}
          onClose={() => { profileHandlers.setShowAvatarPicker(false); profileHandlers.setSelectedAvatar(null); }}
          title="Chọn avatar (100 biểu tượng)"
          maxWidth={560}
          accent="purple"
        >
          <div className="avatar-picker-modal-body">
            {AVATAR_CATEGORIES.map((category) => (
              <div key={category.key} className="avatar-category">
                <p className="avatar-category-label">{category.label}</p>
                <div className={`avatar-options ${category.isImage ? 'avatar-options-images' : ''}`}>
                  {category.icons.map((avatar) => (
                    <button
                      key={avatar}
                      className={`avatar-option ${category.isImage ? 'avatar-option-image' : ''} ${(profileHandlers.selectedAvatar || currentUser.avatar) === avatar ? 'active' : ''}`}
                      onClick={() => profileHandlers.setSelectedAvatar(avatar)}
                    >
                      {isImageAvatar(avatar) ? (
                        <img src={avatar} alt="avatar" loading="lazy" />
                      ) : (
                        avatar
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="avatar-picker-actions">
            <button
              className="btn btn-primary"
              onClick={() => profileHandlers.selectedAvatar && profileHandlers.handleUpdateAvatar(profileHandlers.selectedAvatar)}
              disabled={!profileHandlers.selectedAvatar || profileHandlers.selectedAvatar === currentUser.avatar}
            >
              Lưu avatar
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { profileHandlers.setShowAvatarPicker(false); profileHandlers.setSelectedAvatar(null); }}
            >
              Hủy
            </button>
          </div>
          {profileHandlers.avatarMessage && (
            <p className={`form-message ${profileHandlers.avatarMessage.type}`}>{profileHandlers.avatarMessage.text}</p>
          )}
        </ModalShell>
      </section>

      {/* Additional sections would go here - display name, password, etc. */}
      {/* Keeping this component under 200 lines, full implementation would need more sub-components */}
    </div>
  );
}
