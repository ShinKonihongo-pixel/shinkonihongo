// Refactored Settings Page - thin wrapper orchestrating modular components
import type { SettingsPageProps } from './settings/settings-types';
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

export type { SettingsPageProps } from './settings/settings-types';

export function SettingsPage(props: SettingsPageProps) {
  const {
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
  } = props;

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
        <SettingsTabs
          initialTab={initialTab}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingRequestsCount={pendingRequests.length}
        />

        {activeTab === 'general' && (
          <div className="settings-tab-content">
            <SettingsSubTabs
              activeSubTab={generalSubTab}
              onSubTabChange={setGeneralSubTab}
            />

            {generalSubTab === 'flashcard' && (
              <FlashcardSettings
                settings={settings}
                onUpdateSetting={onUpdateSetting}
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
                onUpdateSetting={onUpdateSetting}
              />
            )}

            {generalSubTab === 'grammar' && (
              <GrammarSettings
                settings={settings}
                onUpdateSetting={onUpdateSetting}
              />
            )}

            {generalSubTab === 'game' && (
              <GameSettings
                settings={settings}
                onUpdateSetting={onUpdateSetting}
                flashcards={flashcards}
                lessons={lessons}
              />
            )}

            {generalSubTab === 'kaiwa' && (
              <KaiwaSettings
                settings={settings}
                onUpdateSetting={onUpdateSetting}
              />
            )}

            {generalSubTab === 'listening' && (
              <ListeningSettings />
            )}

            {generalSubTab === 'system' && (
              <SystemSettings
                settings={settings}
                onUpdateSetting={onUpdateSetting}
                onReset={onReset}
                currentUser={currentUser}
                theme={theme}
                themePresets={themePresets}
                onApplyThemePreset={onApplyThemePreset}
                onResetTheme={onResetTheme}
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
            allUsers={allUsers}
            friends={friends}
            pendingRequests={pendingRequests}
            badgeStats={badgeStats}
            receivedBadges={receivedBadges}
            friendsLoading={friendsLoading}
            onSendFriendRequest={onSendFriendRequest}
            onRespondFriendRequest={onRespondFriendRequest}
            onRemoveFriend={onRemoveFriend}
            onSendBadge={onSendBadge}
            isFriend={isFriend}
          />
        )}
      </div>
    </div>
  );
}
