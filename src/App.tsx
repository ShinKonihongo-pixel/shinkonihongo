// Main App component with authentication and page routing

import { useState, useMemo, useEffect } from 'react';
import type { JLPTLevel, Lesson } from './types/flashcard';
import { useFlashcards } from './hooks/use-flashcards';
import { useLessons } from './hooks/use-lessons';
import { useSettings, useGlobalTheme, THEME_PRESETS } from './hooks/use-settings';
import { useAuth } from './hooks/use-auth';
import { type Page } from './components/layout/header';
import { Sidebar } from './components/layout/sidebar';
import { LoginPage } from './components/pages/login-page';
import { HomePage } from './components/pages/home-page';
import { CardsPage } from './components/pages/cards-page';
import { StudyPage } from './components/pages/study-page';
// QuizGamePage imported by GameHubPage
import { SettingsPage } from './components/pages/settings-page';
import { JLPTPage } from './components/pages/jlpt-page';
import { ChatPage } from './components/pages/chat-page';
import { KaiwaPage } from './components/pages/kaiwa-page';
import { LecturePage } from './components/pages/lecture-page';
import { LectureEditorPage } from './components/pages/lecture-editor-page';
import { ProgressPage } from './components/pages/progress-page';
import { ClassroomPage } from './components/pages/classroom-page';
import { BranchManagementPage } from './components/pages/branch-management-page';
import { TeacherManagementPage } from './components/pages/teacher-management-page';
import { SalaryPage } from './components/pages/salary-page';
import { MyTeachingPage } from './components/pages/my-teaching-page';
import { NotificationsPage } from './components/pages/notifications-page';
import { GameHubPage } from './components/pages/game-hub-page';
import type { GameType } from './types/game-hub';
import { useJLPTQuestions } from './hooks/use-jlpt-questions';
import { useKaiwaQuestions } from './hooks/use-kaiwa-questions';
import { useUserHistory } from './hooks/use-user-history';
import { useProgress } from './hooks/use-progress';
import { useNotifications } from './hooks/use-notifications';
import { useOffline } from './hooks/use-offline';
import { useFriendships, useBadges, useGameInvitations, useFriendNotifications } from './hooks/use-friendships';
import { useClassroomNotifications } from './hooks/use-classrooms';
import { OfflineIndicator } from './components/common/offline-indicator';
import { FloatingChatButton } from './components/common/floating-chat-button';
import { FloatingChatPanel } from './components/common/floating-chat-panel';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [initialFilterLevel, setInitialFilterLevel] = useState<JLPTLevel | 'all'>('all');
  // Game Hub state - unified game join handling
  const [initialGameType, setInitialGameType] = useState<GameType | null>(null);
  const [initialGameJoinCode, setInitialGameJoinCode] = useState<string | null>(null);
  const [editingLectureId, setEditingLectureId] = useState<string | undefined>(undefined);
  const [editingLectureFolderId, setEditingLectureFolderId] = useState<string | undefined>(undefined);
  const [editingLectureLevel, setEditingLectureLevel] = useState<JLPTLevel | undefined>(undefined);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle URL parameters for game join (QR code scanning)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    const racingCode = urlParams.get('racing');
    const goldenBellCode = urlParams.get('golden-bell');
    const pictureGuessCode = urlParams.get('picture-guess');

    // Route all game join codes to Game Hub
    if (joinCode) {
      setInitialGameType('quiz');
      setInitialGameJoinCode(joinCode.toUpperCase());
      setCurrentPage('game-hub');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (racingCode) {
      // Default to boat-racing for legacy racing links
      setInitialGameType('boat-racing');
      setInitialGameJoinCode(racingCode.toUpperCase());
      setCurrentPage('game-hub');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (goldenBellCode) {
      setInitialGameType('golden-bell');
      setInitialGameJoinCode(goldenBellCode.toUpperCase());
      setCurrentPage('game-hub');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (pictureGuessCode) {
      setInitialGameType('picture-guess');
      setInitialGameJoinCode(pictureGuessCode.toUpperCase());
      setCurrentPage('game-hub');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Auth
  const {
    currentUser,
    users,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    register,
    updateUserRole,
    deleteUser,
    changePassword,
    updateDisplayName,
    updateAvatar,
    updateProfileBackground,
    updateVipExpiration,
  } = useAuth();

  // Reset to home page when user logs in (unless joining via QR code)
  useEffect(() => {
    if (isLoggedIn && !initialGameJoinCode) {
      setCurrentPage('home');
    } else if (isLoggedIn && initialGameJoinCode) {
      setCurrentPage('game-hub');
    }
  }, [isLoggedIn, initialGameJoinCode]);

  // User history
  const {
    studySessions,
    gameSessions,
    jlptSessions,
    stats: userStats,
    loading: historyLoading,
    addStudySession,
    addGameSession: _addGameSession, // TODO: integrate with quiz game page
    addJLPTSession,
  } = useUserHistory(currentUser?.id);

  const {
    cards,
    addCard,
    updateCard,
    deleteCard,
    getStatsByLevel,
  } = useFlashcards();

  const {
    lessons,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessonsByLevel,
    getChildLessons,
    toggleLock,
    toggleHide: toggleLessonHide,
  } = useLessons();

  const { settings, updateSetting, resetSettings } = useSettings();
  const { theme, applyPreset, resetTheme } = useGlobalTheme();

  const {
    questions: jlptQuestions,
    addJLPTQuestion,
    updateJLPTQuestion,
    deleteJLPTQuestion,
    addJLPTFolder,
    updateJLPTFolder,
    deleteJLPTFolder,
    getFoldersByLevelAndCategory,
    getQuestionsByFolder,
  } = useJLPTQuestions();

  const {
    questions: kaiwaQuestions,
    folders: kaiwaFolders,
    addKaiwaQuestion,
    updateKaiwaQuestion,
    deleteKaiwaQuestion,
    addKaiwaFolder,
    updateKaiwaFolder,
    deleteKaiwaFolder,
    getFoldersByLevelAndTopic,
    getQuestionsByFolder: getQuestionsByKaiwaFolder,
    getQuestionsByLevelAndTopic,
  } = useKaiwaQuestions();

  // Check if user is VIP (can access locked lessons)
  const isVip = currentUser?.role === 'vip_user';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canAccessLocked = isAdmin || isVip;

  // Check if user can see hidden lessons (creator or super_admin)
  const canSeeHiddenLesson = (lesson: Lesson): boolean => {
    if (isSuperAdmin) return true;
    return lesson.createdBy === currentUser?.id;
  };

  // For admin/study pages, filter locked/hidden lessons for non-authorized users
  const filteredGetLessonsByLevel = useMemo(() => {
    return (level: JLPTLevel): Lesson[] => {
      const lessonList = getLessonsByLevel(level);
      return lessonList.filter(l => {
        // Filter hidden lessons - only show to creator or super_admin
        if (l.isHidden && !canSeeHiddenLesson(l)) return false;
        // Filter locked lessons - only show to VIP/admin
        if (l.isLocked && !canAccessLocked) return false;
        return true;
      });
    };
  }, [getLessonsByLevel, canAccessLocked, isSuperAdmin, currentUser?.id]);

  const filteredGetChildLessons = useMemo(() => {
    return (parentId: string): Lesson[] => {
      const lessonList = getChildLessons(parentId);
      return lessonList.filter(l => {
        // Filter hidden lessons - only show to creator or super_admin
        if (l.isHidden && !canSeeHiddenLesson(l)) return false;
        // Filter locked lessons - only show to VIP/admin
        if (l.isLocked && !canAccessLocked) return false;
        return true;
      });
    };
  }, [getChildLessons, canAccessLocked, isSuperAdmin, currentUser?.id]);

  const statsByLevel = getStatsByLevel();

  // Progress tracking
  const progress = useProgress(
    studySessions,
    gameSessions,
    jlptSessions,
    userStats,
    cards,
    settings.weeklyCardsTarget || 50,
    settings.weeklyMinutesTarget || 60
  );

  // Notifications (runs in background, checking for due cards)
  useNotifications(cards);

  // Offline support
  const offline = useOffline(cards, lessons);

  // Friendships & Badges
  const {
    friendsWithUsers,
    pendingRequests,
    loading: friendsLoading,
    sendRequest: sendFriendRequest,
    respondToRequest: respondFriendRequest,
    removeFriend,
    isFriend,
  } = useFriendships(currentUser?.id ?? null, users);

  const {
    receivedBadges,
    badgeStats,
    sendBadge,
  } = useBadges(currentUser?.id ?? null, users);

  const {
    sendInvitation: sendGameInvitation,
  } = useGameInvitations(currentUser?.id ?? null);

  // Notifications hooks
  const {
    notifications: classroomNotifications,
    markAsRead: markClassroomRead,
    markAllAsRead: markAllClassroomRead,
  } = useClassroomNotifications(currentUser?.id ?? null);

  const {
    notifications: friendNotifications,
    markAsRead: markFriendRead,
    markAllAsRead: markAllFriendRead,
  } = useFriendNotifications(currentUser?.id ?? null);

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <div className="app">
        <LoginPage onLogin={login} onRegister={register} />
      </div>
    );
  }

  return (
    <div className={`app app-with-sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={currentUser}
        onLogout={logout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="main-wrapper">
        {/* Offline status indicator */}
        <OfflineIndicator
          isOnline={offline.isOnline}
          isSyncing={offline.isSyncing}
          offlineCardCount={offline.offlineCardCount}
        />

        <main className="main-content">
        {currentPage === 'home' && (
          <HomePage
            statsByLevel={statsByLevel}
            cards={cards}
            onStartStudy={() => {
              setInitialFilterLevel('all');
              setCurrentPage('study');
            }}
            onStudyByLevel={(level: JLPTLevel) => {
              setInitialFilterLevel(level);
              setCurrentPage('study');
            }}
            onCustomStudy={(selection) => {
              const level = selection.levels.length === 1 ? selection.levels[0] : 'all';
              setInitialFilterLevel(level);
              setCurrentPage('study');
            }}
            getLessonsByLevel={getLessonsByLevel}
            getChildLessons={getChildLessons}
            canAccessLocked={canAccessLocked}
            onPracticeJLPT={() => setCurrentPage('jlpt')}
            onNavigate={(page) => setCurrentPage(page as Page)}
            userName={currentUser?.displayName || currentUser?.username}
            progress={progress}
          />
        )}

        {currentPage === 'cards' && isAdmin && currentUser && (
          <CardsPage
            cards={cards}
            onAddCard={addCard}
            onUpdateCard={updateCard}
            onDeleteCard={deleteCard}
            lessons={lessons}
            getLessonsByLevel={filteredGetLessonsByLevel}
            getChildLessons={filteredGetChildLessons}
            onAddLesson={addLesson}
            onUpdateLesson={updateLesson}
            onDeleteLesson={deleteLesson}
            currentUser={currentUser}
            jlptQuestions={jlptQuestions}
            onAddJLPTQuestion={async (data) => { await addJLPTQuestion(data, currentUser.id); }}
            onUpdateJLPTQuestion={updateJLPTQuestion}
            onDeleteJLPTQuestion={deleteJLPTQuestion}
            onAddJLPTFolder={async (name, level, category) => { await addJLPTFolder(name, level, category, currentUser.id); }}
            onUpdateJLPTFolder={updateJLPTFolder}
            onDeleteJLPTFolder={deleteJLPTFolder}
            getFoldersByLevelAndCategory={getFoldersByLevelAndCategory}
            getQuestionsByFolder={getQuestionsByFolder}
            // Kaiwa question management props
            kaiwaQuestions={kaiwaQuestions}
            kaiwaFolders={kaiwaFolders}
            onAddKaiwaQuestion={async (data) => { return await addKaiwaQuestion(data, currentUser.id); }}
            onUpdateKaiwaQuestion={updateKaiwaQuestion}
            onDeleteKaiwaQuestion={deleteKaiwaQuestion}
            onAddKaiwaFolder={async (name, level, topic) => { return await addKaiwaFolder(name, level, topic, currentUser.id); }}
            onUpdateKaiwaFolder={updateKaiwaFolder}
            onDeleteKaiwaFolder={deleteKaiwaFolder}
            getFoldersByLevelAndTopic={getFoldersByLevelAndTopic}
            getQuestionsByKaiwaFolder={getQuestionsByKaiwaFolder}
            // User management props
            users={users}
            onUpdateUserRole={updateUserRole}
            onDeleteUser={deleteUser}
            onUpdateVipExpiration={updateVipExpiration}
            onRegister={register}
            // Lesson locking/hiding props
            onToggleLock={toggleLock}
            onToggleHide={toggleLessonHide}
            // Lecture management props
            onNavigateToLectureEditor={(lectureId, folderId, level) => {
              setEditingLectureId(lectureId);
              setEditingLectureFolderId(folderId);
              setEditingLectureLevel(level);
              setCurrentPage('lecture-editor');
            }}
          />
        )}

        {currentPage === 'study' && (
          <StudyPage
            cards={cards}
            updateCard={updateCard}
            onGoHome={() => setCurrentPage('home')}
            initialFilterLevel={initialFilterLevel}
            settings={settings}
            onSaveStudySession={addStudySession}
          />
        )}

        {currentPage === 'progress' && (
          <ProgressPage
            progress={progress}
            onStartStudy={() => setCurrentPage('study')}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSetting={updateSetting}
            onReset={resetSettings}
            currentUser={currentUser}
            onUpdateDisplayName={async (name) => {
              if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
              return updateDisplayName(currentUser.id, name);
            }}
            onChangePassword={async (oldPwd, newPwd) => {
              if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
              // Verify old password by checking against users list
              const user = users.find(u => u.id === currentUser.id);
              if (!user || user.password !== oldPwd) {
                return { success: false, error: 'Mật khẩu hiện tại không đúng' };
              }
              return changePassword(currentUser.id, newPwd);
            }}
            onUpdateAvatar={async (avatar) => {
              if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
              return updateAvatar(currentUser.id, avatar);
            }}
            onUpdateProfileBackground={async (bg) => {
              if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
              return updateProfileBackground(currentUser.id, bg);
            }}
            studySessions={studySessions}
            gameSessions={gameSessions}
            jlptSessions={jlptSessions}
            stats={userStats}
            historyLoading={historyLoading}
            // Theme settings (super_admin only)
            theme={theme}
            themePresets={THEME_PRESETS}
            onApplyThemePreset={applyPreset}
            onResetTheme={resetTheme}
            // Export/Import
            flashcards={cards}
            lessons={lessons}
            onImportData={async (data) => {
              // Import flashcards (add new ones)
              for (const card of data.flashcards) {
                await addCard({
                  vocabulary: card.vocabulary,
                  kanji: card.kanji,
                  sinoVietnamese: card.sinoVietnamese,
                  meaning: card.meaning,
                  examples: card.examples,
                  jlptLevel: card.jlptLevel,
                  lessonId: card.lessonId,
                });
              }
            }}
            // Friends & Badges
            allUsers={users}
            friends={friendsWithUsers}
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

        {/* Game Hub - Unified game center */}
        {currentPage === 'game-hub' && (
          <GameHubPage
            currentUser={currentUser}
            flashcards={cards}
            jlptQuestions={jlptQuestions}
            getLessonsByLevel={filteredGetLessonsByLevel}
            getChildLessons={filteredGetChildLessons}
            settings={settings}
            friends={friendsWithUsers}
            onInviteFriend={sendGameInvitation}
            initialGame={initialGameType}
            initialJoinCode={initialGameJoinCode}
            onCollapseSidebar={() => setSidebarCollapsed(true)}
          />
        )}

        {currentPage === 'jlpt' && (
          <JLPTPage
            questions={jlptQuestions}
            onSaveJLPTSession={addJLPTSession}
          />
        )}

        {currentPage === 'kaiwa' && currentUser && canAccessLocked && (
          <KaiwaPage
            settings={settings}
            defaultQuestions={kaiwaQuestions}
            kaiwaFolders={kaiwaFolders}
            getFoldersByLevelAndTopic={getFoldersByLevelAndTopic}
            getQuestionsByFolder={getQuestionsByKaiwaFolder}
            getQuestionsByLevelAndTopic={getQuestionsByLevelAndTopic}
          />
        )}

        {currentPage === 'lectures' && (
          <LecturePage
            onNavigateToEditor={(lectureId) => {
              setEditingLectureId(lectureId);
              setEditingLectureFolderId(undefined);
              setEditingLectureLevel(undefined);
              setCurrentPage('lecture-editor');
            }}
          />
        )}

        {currentPage === 'lecture-editor' && isAdmin && (
          <LectureEditorPage
            lectureId={editingLectureId}
            initialFolderId={editingLectureFolderId}
            initialLevel={editingLectureLevel}
            onBack={() => {
              setEditingLectureId(undefined);
              setEditingLectureFolderId(undefined);
              setEditingLectureLevel(undefined);
              setCurrentPage('cards');
            }}
          />
        )}

        {currentPage === 'chat' && currentUser && (
          <ChatPage currentUser={currentUser} />
        )}

        {currentPage === 'classroom' && currentUser && (
          <ClassroomPage users={users} />
        )}

        {currentPage === 'branches' && currentUser && (currentUser.role === 'director' || currentUser.role === 'branch_admin' || currentUser.role === 'super_admin') && (
          <BranchManagementPage users={users} />
        )}

        {currentPage === 'teachers' && currentUser && (currentUser.role === 'director' || currentUser.role === 'branch_admin' || currentUser.role === 'super_admin') && (
          <TeacherManagementPage users={users} />
        )}

        {currentPage === 'salary' && currentUser && (currentUser.role === 'director' || currentUser.role === 'branch_admin' || currentUser.role === 'super_admin') && (
          <SalaryPage users={users} />
        )}

        {currentPage === 'my-teaching' && currentUser && (currentUser.role === 'main_teacher' || currentUser.role === 'part_time_teacher' || currentUser.role === 'assistant') && (
          <MyTeachingPage />
        )}

        {currentPage === 'notifications' && currentUser && (
          <NotificationsPage
            classroomNotifications={classroomNotifications}
            friendNotifications={friendNotifications}
            onMarkClassroomRead={markClassroomRead}
            onMarkAllClassroomRead={markAllClassroomRead}
            onMarkFriendRead={markFriendRead}
            onMarkAllFriendRead={markAllFriendRead}
            onNavigate={setCurrentPage}
          />
        )}
        </main>
      </div>

      {/* Floating AI Chat Button and Panel - hidden on game-hub */}
      {currentUser && currentPage !== 'game-hub' && (
        <>
          <FloatingChatButton
            onClick={() => setIsChatOpen(!isChatOpen)}
            isActive={isChatOpen}
          />
          <FloatingChatPanel
            currentUser={currentUser}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </>
      )}
    </div>
  );
}

export default App;
