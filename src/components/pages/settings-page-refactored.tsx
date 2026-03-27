// Refactored Settings Page - thin wrapper orchestrating modular components
import { useSettings, useGlobalTheme, THEME_PRESETS } from '../../hooks/use-settings';
import { useUserData } from '../../contexts/user-data-context';
import { useFlashcardData } from '../../contexts/flashcard-data-context';
import { useNavigation } from '../../contexts/navigation-context';
import { useSettingsState } from './settings/hooks/use-settings-state';
import { SettingsHeader } from './settings/settings-header';
import { SettingsTabs } from './settings/settings-tabs';
import { SettingsSubTabs } from './settings/settings-sub-tabs';
import { FlashcardSettings } from './settings/flashcard-settings';
import { StudySettings } from './settings/study-settings';
import { GrammarSettings } from './settings/grammar-settings';
import { GameSettings } from './settings/game-settings';
import { KaiwaSettings } from './settings/kaiwa-settings';
import { ListeningSettings } from './settings/listening-settings';
import { SystemSettings } from './settings/system-settings';
import { ProfileSection } from './settings/profile-section';
import { FriendsSection } from './settings/friends-section';
import './settings/settings-layout.css';
import './settings/settings-tabs.css';
import './settings/settings-sections.css';
import './settings/settings-controls.css';
import './settings/settings-frames.css';
import './settings/settings-flashcard-studio.css';
import './settings/settings-display.css';

export function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { theme, applyPreset, resetTheme } = useGlobalTheme();
  const {
    currentUser,
    users,
    studySessions,
    gameSessions,
    jlptSessions,
    userStats: stats,
    historyLoading,
    updateDisplayName,
    changePassword,
    updateAvatar,
    updateProfileBackground,
    updateJlptLevel,
    friendsWithUsers: friends,
    pendingRequests,
    friendsLoading,
    sendFriendRequest,
    respondFriendRequest,
    removeFriend,
    sendBadge,
    isFriend,
    badgeStats,
    receivedBadges,
  } = useUserData();
  const { cards: flashcards, lessons, addCard } = useFlashcardData();
  const { currentPage } = useNavigation();

  const initialTab = currentPage === 'profile' ? ('profile' as const) : undefined;

  const onUpdateDisplayName = async (name: string) => {
    if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
    return updateDisplayName(currentUser.id, name);
  };

  const onChangePassword = async (oldPwd: string, newPwd: string) => {
    if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
    const u = users.find(u => u.id === currentUser.id);
    if (!u || u.password !== oldPwd) return { success: false, error: 'Mật khẩu hiện tại không đúng' };
    return changePassword(currentUser.id, newPwd);
  };

  const onUpdateAvatar = async (avatar: string) => {
    if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
    return updateAvatar(currentUser.id, avatar);
  };

  const onUpdateProfileBackground = async (bg: string) => {
    if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
    return updateProfileBackground(currentUser.id, bg);
  };

  const onUpdateJlptLevel = async (level: string) => {
    if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
    return updateJlptLevel(currentUser.id, level);
  };

  const onImportData = async (data: import('../../lib/data-export').ExportData) => {
    for (const card of data.flashcards) {
      await addCard({ vocabulary: card.vocabulary, kanji: card.kanji, sinoVietnamese: card.sinoVietnamese, meaning: card.meaning, examples: card.examples, jlptLevel: card.jlptLevel, lessonId: card.lessonId });
    }
  };

  const {
    activeTab,
    setActiveTab,
    generalSubTab,
    setGeneralSubTab,
    selectedDevice,
    setSelectedDevice,
    frameCategory,
    setFrameCategory,
    gradientCategory,
    setGradientCategory,
    fontSizeMultiplier,
  } = useSettingsState(initialTab);

  return (
    <div className="settings-page">
      <SettingsHeader initialTab={initialTab} />

      <div className="settings-page-body">
        <div className="settings-tabs-bar">
          <SettingsTabs
            initialTab={initialTab}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingRequestsCount={pendingRequests.length}
          />

          {activeTab === 'general' && (
            <SettingsSubTabs
              activeSubTab={generalSubTab}
              onSubTabChange={setGeneralSubTab}
            />
          )}
        </div>

        {activeTab === 'general' && (
          <div className="settings-tab-content">
            {generalSubTab === 'flashcard' && (
              <FlashcardSettings
                settings={settings}
                onUpdateSetting={updateSetting}
                frameCategory={frameCategory}
                setFrameCategory={setFrameCategory}
                gradientCategory={gradientCategory}
                setGradientCategory={setGradientCategory}
                selectedDevice={selectedDevice}
                setSelectedDevice={setSelectedDevice}
                fontSizeMultiplier={fontSizeMultiplier}
              />
            )}

            {generalSubTab === 'study' && (
              <StudySettings
                settings={settings}
                onUpdateSetting={updateSetting}
              />
            )}

            {generalSubTab === 'grammar' && (
              <GrammarSettings
                settings={settings}
                onUpdateSetting={updateSetting}
              />
            )}

            {generalSubTab === 'game' && (
              <GameSettings
                settings={settings}
                onUpdateSetting={updateSetting}
                flashcards={flashcards}
                lessons={lessons}
              />
            )}

            {generalSubTab === 'kaiwa' && (
              <KaiwaSettings
                settings={settings}
                onUpdateSetting={updateSetting}
              />
            )}

            {generalSubTab === 'listening' && (
              <ListeningSettings />
            )}

            {generalSubTab === 'system' && (
              <SystemSettings
                settings={settings}
                onUpdateSetting={updateSetting}
                onReset={resetSettings}
                currentUser={currentUser}
                theme={theme}
                themePresets={THEME_PRESETS}
                onApplyThemePreset={applyPreset}
                onResetTheme={resetTheme}
                flashcards={flashcards}
                lessons={lessons}
                onImportData={onImportData}
              />
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileSection
            currentUser={currentUser}
            stats={stats}
            historyLoading={historyLoading}
            studySessions={studySessions}
            gameSessions={gameSessions}
            jlptSessions={jlptSessions}
            onUpdateDisplayName={onUpdateDisplayName}
            onChangePassword={onChangePassword}
            onUpdateAvatar={onUpdateAvatar}
            onUpdateProfileBackground={onUpdateProfileBackground}
            onUpdateJlptLevel={onUpdateJlptLevel}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsSection
            currentUser={currentUser}
            allUsers={users}
            friends={friends}
            pendingRequests={pendingRequests}
            badgeStats={badgeStats}
            receivedBadges={receivedBadges}
            friendsLoading={friendsLoading}
            onSendFriendRequest={sendFriendRequest}
            onRespondFriendRequest={respondFriendRequest}
            onRemoveFriend={removeFriend}
            onSendBadge={sendBadge}
            isFriend={isFriend}
          />
        )}
      </div>
    </div>
  );
}
