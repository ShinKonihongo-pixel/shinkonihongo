// Main App component with authentication and page routing

import { useState, useMemo, useEffect } from 'react';
import type { JLPTLevel, Lesson } from './types/flashcard';
import { useFlashcards } from './hooks/use-flashcards';
import { useLessons } from './hooks/use-lessons';
import { useSettings, useGlobalTheme, THEME_PRESETS } from './hooks/use-settings';
import { useAuth } from './hooks/use-auth';
import { Header, type Page } from './components/layout/header';
import { LoginPage } from './components/pages/login-page';
import { HomePage } from './components/pages/home-page';
import { CardsPage } from './components/pages/cards-page';
import { StudyPage } from './components/pages/study-page';
import { QuizGamePage } from './components/pages/quiz-game-page';
import { SettingsPage } from './components/pages/settings-page';
import { AdminPage } from './components/pages/admin-page';
import { JLPTPage } from './components/pages/jlpt-page';
import { ChatPage } from './components/pages/chat-page';
import { useJLPTQuestions } from './hooks/use-jlpt-questions';
import { useUserHistory } from './hooks/use-user-history';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [initialFilterLevel, setInitialFilterLevel] = useState<JLPTLevel | 'all'>('all');
  const [initialJoinCode, setInitialJoinCode] = useState<string | null>(null);

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
  } = useAuth();

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

  // Check if user is VIP (can see locked lessons)
  const isVip = currentUser?.role === 'vip_user';
  const canSeeLocked = isAdmin || isVip;

  // Filter locked lessons for non-admin and non-VIP users
  const filteredGetLessonsByLevel = useMemo(() => {
    return (level: JLPTLevel): Lesson[] => {
      const lessonList = getLessonsByLevel(level);
      if (canSeeLocked) return lessonList;
      return lessonList.filter(l => !l.isLocked);
    };
  }, [getLessonsByLevel, canSeeLocked]);

  const filteredGetChildLessons = useMemo(() => {
    return (parentId: string): Lesson[] => {
      const lessonList = getChildLessons(parentId);
      if (canSeeLocked) return lessonList;
      return lessonList.filter(l => !l.isLocked);
    };
  }, [getChildLessons, canSeeLocked]);

  const statsByLevel = getStatsByLevel();

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <div className="app">
        <LoginPage onLogin={login} onRegister={register} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={currentUser}
        onLogout={logout}
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
            getLessonsByLevel={filteredGetLessonsByLevel}
            getChildLessons={filteredGetChildLessons}
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

        {currentPage === 'admin' && isAdmin && currentUser && (
          <AdminPage
            users={users}
            currentUserRole={currentUser.role}
            currentUserId={currentUser.id}
            onUpdateUserRole={updateUserRole}
            onDeleteUser={deleteUser}
            onRegister={register}
            onToggleLock={toggleLock}
            getLessonsByLevel={getLessonsByLevel}
            getChildLessons={getChildLessons}
          />
        )}

        {currentPage === 'jlpt' && (
          <JLPTPage
            questions={jlptQuestions}
            onSaveJLPTSession={addJLPTSession}
          />
        )}

        {currentPage === 'chat' && currentUser && (
          <ChatPage currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}

export default App;
