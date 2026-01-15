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
import { QuizGamePage } from './components/pages/quiz-game-page';
import { SettingsPage } from './components/pages/settings-page';
import { JLPTPage } from './components/pages/jlpt-page';
import { ChatPage } from './components/pages/chat-page';
import { KaiwaPage } from './components/pages/kaiwa-page';
import { LecturePage } from './components/pages/lecture-page';
import { LectureEditorPage } from './components/pages/lecture-editor-page';
import { ProgressPage } from './components/pages/progress-page';
import { useJLPTQuestions } from './hooks/use-jlpt-questions';
import { useKaiwaQuestions } from './hooks/use-kaiwa-questions';
import { useUserHistory } from './hooks/use-user-history';
import { useProgress } from './hooks/use-progress';
import { useNotifications } from './hooks/use-notifications';
import { useOffline } from './hooks/use-offline';
import { OfflineIndicator } from './components/common/offline-indicator';
import { FloatingChatButton } from './components/common/floating-chat-button';
import { FloatingChatPanel } from './components/common/floating-chat-panel';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [initialFilterLevel, setInitialFilterLevel] = useState<JLPTLevel | 'all'>('all');
  const [initialJoinCode, setInitialJoinCode] = useState<string | null>(null);
  const [editingLectureId, setEditingLectureId] = useState<string | undefined>(undefined);
  const [editingLectureFolderId, setEditingLectureFolderId] = useState<string | undefined>(undefined);
  const [editingLectureLevel, setEditingLectureLevel] = useState<JLPTLevel | undefined>(undefined);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle URL parameters for quiz game join (QR code scanning)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    if (joinCode) {
      setInitialJoinCode(joinCode.toUpperCase());
      setCurrentPage('quiz');
      // Clean URL without reload
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
    if (isLoggedIn && !initialJoinCode) {
      setCurrentPage('home');
    } else if (isLoggedIn && initialJoinCode) {
      setCurrentPage('quiz');
    }
  }, [isLoggedIn, initialJoinCode]);

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
            onManageCards={() => setCurrentPage('cards')}
            onStudyByLevel={(level) => {
              setInitialFilterLevel(level);
              setCurrentPage('study');
            }}
            onStudyByCategory={(level) => {
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
            isAdmin={isAdmin}
            jlptQuestionCount={jlptQuestions.length}
            onPracticeJLPT={() => setCurrentPage('jlpt')}
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
            onAddKaiwaQuestion={async (data) => { await addKaiwaQuestion(data, currentUser.id); }}
            onUpdateKaiwaQuestion={updateKaiwaQuestion}
            onDeleteKaiwaQuestion={deleteKaiwaQuestion}
            onAddKaiwaFolder={async (name, level, topic) => { await addKaiwaFolder(name, level, topic, currentUser.id); }}
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
          />
        )}

        {currentPage === 'quiz' && currentUser && (
          <QuizGamePage
            currentUserId={currentUser.id}
            currentUserName={currentUser.username}
            flashcards={cards}
            jlptQuestions={jlptQuestions}
            getLessonsByLevel={filteredGetLessonsByLevel}
            getChildLessons={filteredGetChildLessons}
            onGoHome={() => setCurrentPage('home')}
            initialJoinCode={initialJoinCode}
            onJoinCodeUsed={() => setInitialJoinCode(null)}
            settings={settings}
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
        </main>
      </div>

      {/* Floating AI Chat Button and Panel */}
      {currentUser && (
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
