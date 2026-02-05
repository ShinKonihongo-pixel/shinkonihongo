import { useState } from 'react';
import type { UserJLPTLevel } from '../../../../types/user';

export function useProfileHandlers(
  currentUser?: { displayName?: string; username: string },
  onUpdateDisplayName?: (name: string) => Promise<{ success: boolean; error?: string }>,
  onChangePassword?: (old: string, newPass: string) => Promise<{ success: boolean; error?: string }>,
  onUpdateAvatar?: (avatar: string) => Promise<{ success: boolean; error?: string }>,
  onUpdateProfileBackground?: (bg: string) => Promise<{ success: boolean; error?: string }>,
  onUpdateJlptLevel?: (level: UserJLPTLevel) => Promise<{ success: boolean; error?: string }>
) {
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

  return {
    displayName,
    setDisplayName,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    profileMessage,
    passwordMessage,
    avatarMessage,
    showAvatarPicker,
    setShowAvatarPicker,
    selectedAvatar,
    setSelectedAvatar,
    activeHistoryTab,
    setActiveHistoryTab,
    badgeGiftTarget,
    setBadgeGiftTarget,
    jlptLevelMessage,
    handleUpdateDisplayName,
    handleChangePassword,
    handleUpdateAvatar,
    handleUpdateProfileBackground,
    handleUpdateJlptLevel,
  };
}
