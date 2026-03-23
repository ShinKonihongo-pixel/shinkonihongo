// Main App component with authentication and page routing

import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';

// Dev: Load seed functions to window for console access
import './scripts/seed-folders';
import type { JLPTLevel, Lesson } from './types/flashcard';
import { useSettings, useGlobalTheme, THEME_PRESETS } from './hooks/use-settings';
import { type Page } from './components/layout/header';
import { Sidebar } from './components/layout/sidebar';
import { LoginPage } from './components/pages/login-page';
import { ErrorBoundary } from './components/common/error-boundary';

// Lazy-loaded page components
const HomePage = lazy(() => import('./components/pages/home-page').then(m => ({ default: m.HomePage })));
const CardsPage = lazy(() => import('./components/pages/cards-page').then(m => ({ default: m.CardsPage })));
const StudyPage = lazy(() => import('./components/pages/study-page').then(m => ({ default: m.StudyPage })));
const SettingsPage = lazy(() => import('./components/pages/settings-page').then(m => ({ default: m.SettingsPage })));
const JLPTPage = lazy(() => import('./components/pages/jlpt/index.tsx').then(m => ({ default: m.JLPTPage })));
const ChatPage = lazy(() => import('./components/pages/chat-page').then(m => ({ default: m.ChatPage })));
const KaiwaPage = lazy(() => import('./components/pages/kaiwa/index.tsx').then(m => ({ default: m.KaiwaPage })));
const LecturePage = lazy(() => import('./components/pages/lecture-page').then(m => ({ default: m.LecturePage })));
const LectureEditorPage = lazy(() => import('./components/pages/lecture-editor').then(m => ({ default: m.LectureEditorPage })));
const ProgressPage = lazy(() => import('./components/pages/progress-page').then(m => ({ default: m.ProgressPage })));
const ClassroomPage = lazy(() => import('./components/pages/classroom-page').then(m => ({ default: m.ClassroomPage })));
const BranchManagementPage = lazy(() => import('./components/pages/branch-management-page').then(m => ({ default: m.BranchManagementPage })));
const TeacherManagementPage = lazy(() => import('./components/pages/teacher-management-page').then(m => ({ default: m.TeacherManagementPage })));
const SalaryPage = lazy(() => import('./components/pages/salary-page').then(m => ({ default: m.SalaryPage })));
const MyTeachingPage = lazy(() => import('./components/pages/my-teaching-page').then(m => ({ default: m.MyTeachingPage })));
const NotificationsPage = lazy(() => import('./components/pages/notifications-page').then(m => ({ default: m.NotificationsPage })));
const GameHubPage = lazy(() => import('./components/pages/game-hub-page').then(m => ({ default: m.GameHubPage })));
const ListeningPracticePage = lazy(() => import('./components/pages/audio-player-page/index.tsx').then(m => ({ default: m.ListeningPracticePage })));
const GrammarStudyPage = lazy(() => import('./components/pages/grammar-study-page').then(m => ({ default: m.GrammarStudyPage })));
const ReadingPracticePage = lazy(() => import('./components/pages/reading-practice/index.tsx').then(m => ({ default: m.ReadingPracticePage })));
const ExercisePage = lazy(() => import('./components/pages/exercise/index.tsx').then(m => ({ default: m.ExercisePage })));
const KanjiStudyPage = lazy(() => import('./components/pages/kanji-study-page').then(m => ({ default: m.KanjiStudyPage })));
const CenterMembersPage = lazy(() => import('./components/pages/center-members-page').then(m => ({ default: m.CenterMembersPage })));
const CenterDashboardPage = lazy(() => import('./components/pages/center-dashboard-page').then(m => ({ default: m.CenterDashboardPage })));
const PricingPage = lazy(() => import('./components/pages/pricing-page').then(m => ({ default: m.PricingPage })));
const RolePermissionsPage = lazy(() => import('./components/pages/role-permissions-page').then(m => ({ default: m.RolePermissionsPage })));
const ConjugationTrainerPage = lazy(() => import('./components/pages/conjugation-trainer-page').then(m => ({ default: m.ConjugationTrainerPage })));
const PronunciationPracticePage = lazy(() => import('./components/pages/pronunciation-practice-page').then(m => ({ default: m.PronunciationPracticePage })));
const OnboardingTour = lazy(() => import('./components/onboarding/onboarding-tour').then(m => ({ default: m.OnboardingTour })));
const AchievementToast = lazy(() => import('./components/achievements/achievement-toast').then(m => ({ default: m.AchievementToast })));
const AchievementShowcase = lazy(() => import('./components/achievements/achievement-showcase').then(m => ({ default: m.AchievementShowcase })));
const CelebrationOverlay = lazy(() => import('./components/achievements/celebration-overlay').then(m => ({ default: m.CelebrationOverlay })));
const DailyMissionsWidget = lazy(() => import('./components/achievements/daily-missions-widget').then(m => ({ default: m.DailyMissionsWidget })));
const FloatingChatPanel = lazy(() => import('./components/common/floating-chat-panel').then(m => ({ default: m.FloatingChatPanel })));
const AiTutorPanel = lazy(() => import('./components/common/ai-tutor-panel').then(m => ({ default: m.AiTutorPanel })));

import type { GameType } from './types/game-hub';
import { useProgress } from './hooks/use-progress';
import { useNotifications } from './hooks/use-notifications';
import { useOffline } from './hooks/use-offline';
import { useDailyWords } from './hooks/use-daily-words';
import { OfflineIndicator } from './components/common/offline-indicator';
import { FloatingChatButton } from './components/common/floating-chat-button';
import { JLPTLevelModal } from './components/common/jlpt-level-modal';
import { ReadingSettingsProvider } from './contexts/reading-settings-context';
import { ListeningSettingsProvider } from './contexts/listening-settings-context';
import type { UserJLPTLevel } from './types/user';
import { useUrlRouter } from './hooks/use-url-router';
import { CenterRouter } from './components/center/center-router';
import { CenterProvider } from './contexts/center-context';
import { useCenterData } from './hooks/use-center-data';

// Data contexts
import { UserDataProvider, useUserData } from './contexts/user-data-context';
import { FlashcardDataProvider, useFlashcardData } from './contexts/flashcard-data-context';
import { JLPTDataProvider, useJLPTData } from './contexts/jlpt-data-context';
import { AchievementProvider, useAchievementContextOptional } from './contexts/achievement-context';

import './App.css';

function App() {
  return (
    <UserDataProvider>
      <AppInner />
    </UserDataProvider>
  );
}

function AppInner() {
  const { currentUser, isLoggedIn, isAdmin, login, register } = useUserData();
  const urlRouter = useUrlRouter();

  // All hooks must be called before any early return (Rules of Hooks)
  const isCenterApp = urlRouter.isCenterApp && !!urlRouter.centerSlug;
  const centerSlug = urlRouter.isCenterApp ? urlRouter.centerSlug : null;
  const centerData = useCenterData(centerSlug, currentUser?.id ?? null);

  // Center router - non-app center routes (landing, join) → CenterRouter
  if (urlRouter.centerSlug && !urlRouter.isCenterApp) {
    return (
      <CenterRouter
        slug={urlRouter.centerSlug}
        isPublicLanding={urlRouter.isPublicLanding}
        isJoinPage={urlRouter.isJoinPage}
        inviteCode={urlRouter.inviteCode}
        currentUser={currentUser}
        navigate={urlRouter.navigate}
      />
    );
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <div className="app">
        <LoginPage onLogin={login} onRegister={register} />
      </div>
    );
  }

  if (isCenterApp && centerData.loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-content">
          <div className="app-loading-spinner" />
          <span className="app-loading-label">Đang tải trung tâm...</span>
        </div>
      </div>
    );
  }

  if (isCenterApp && (centerData.error || !centerData.center)) {
    return (
      <div className="center-error">
        <h2>404</h2>
        <p>{centerData.error || 'Không tìm thấy trung tâm'}</p>
        <button className="btn btn-primary" onClick={() => urlRouter.navigate('/')}>
          Về trang chủ
        </button>
      </div>
    );
  }

  if (isCenterApp && !centerData.userRole) {
    return (
      <div className="center-error">
        <h2>Chưa là thành viên</h2>
        <p>Bạn chưa tham gia trung tâm {centerData.center?.name}.</p>
        <button
          className="btn btn-primary"
          onClick={() => urlRouter.navigate(`/center/${urlRouter.centerSlug}/join`)}
        >
          Tham gia ngay
        </button>
        <button
          className="btn btn-secondary"
          style={{ marginLeft: '0.5rem' }}
          onClick={() => urlRouter.navigate('/')}
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  // Admin loads all data; regular users load only their JLPT level
  const levelFilter = isAdmin ? undefined : currentUser?.jlptLevel;

  // Wrap in data providers
  return (
    <FlashcardDataProvider levelFilter={levelFilter}>
      <JLPTDataProvider currentUserId={currentUser?.id ?? ''} levelFilter={levelFilter}>
        <AchievementProvider>
          <ReadingSettingsProvider>
            <ListeningSettingsProvider>
              <AppContentWrapper
                isCenterApp={isCenterApp}
                centerData={centerData}
              />
            </ListeningSettingsProvider>
          </ReadingSettingsProvider>
        </AchievementProvider>
      </JLPTDataProvider>
    </FlashcardDataProvider>
  );
}

interface AppContentWrapperProps {
  isCenterApp: boolean;
  centerData: ReturnType<typeof useCenterData>;
}

function AppContentWrapper({ isCenterApp, centerData }: AppContentWrapperProps) {
  const content = <AppContent />;

  // Wrap in CenterProvider when in center app mode
  if (isCenterApp && centerData.center && centerData.userRole) {
    return (
      <CenterProvider center={centerData.center} userRole={centerData.userRole}>
        {content}
      </CenterProvider>
    );
  }

  return content;
}

function AppContent() {
  // Use all 3 contexts + achievement context
  const userData = useUserData();
  const flashcardData = useFlashcardData();
  const jlptData = useJLPTData();
  const achievementCtx = useAchievementContextOptional();

  // Local navigation state
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [, setInitialFilterLevel] = useState<JLPTLevel | 'all'>('all');
  const [initialGameType, setInitialGameType] = useState<GameType | null>(null);
  const [initialGameJoinCode, setInitialGameJoinCode] = useState<string | null>(null);
  const [editingLectureId, setEditingLectureId] = useState<string | undefined>(undefined);
  const [editingLectureFolderId, setEditingLectureFolderId] = useState<string | undefined>(undefined);
  const [editingLectureLevel, setEditingLectureLevel] = useState<JLPTLevel | undefined>(undefined);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle URL parameters for game join (QR code scanning)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    const racingCode = urlParams.get('racing');
    const goldenBellCode = urlParams.get('golden-bell');
    const pictureGuessCode = urlParams.get('picture-guess');

    // Route all game join codes to Game Hub - intentional URL-based routing on mount
    /* eslint-disable react-hooks/set-state-in-effect */
    if (joinCode) {
      setInitialGameType('quiz');
      setInitialGameJoinCode(joinCode.toUpperCase());
      setCurrentPage('game-hub');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (racingCode) {
      // Legacy racing links - redirect to quiz game
      setInitialGameType('quiz');
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
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Destructure from contexts
  const {
    currentUser,
    users,
    isAdmin,
    isSuperAdmin,
    canAccessLocked,
    logout,
    register,
    updateUserRole,
    deleteUser,
    changePassword,
    updateDisplayName,
    updateAvatar,
    updateProfileBackground,
    updateJlptLevel,
    updateVipExpiration,
    studySessions,
    gameSessions,
    jlptSessions,
    userStats,
    historyLoading,
    addStudySession,
    addGameSession,
    addJLPTSession,
    friendsWithUsers,
    pendingRequests,
    friendsLoading,
    sendFriendRequest,
    respondFriendRequest,
    removeFriend,
    isFriend,
    receivedBadges,
    badgeStats,
    sendBadge,
    sendGameInvitation,
    classroomNotifications,
    markClassroomRead,
    markAllClassroomRead,
    friendNotifications,
    markFriendRead,
    markAllFriendRead,
  } = userData;

  const {
    cards,
    addCard,
    updateCard,
    deleteCard,
    getStatsByLevel,
    lessons,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessonsByLevel,
    getChildLessons,
    toggleLock,
    toggleLessonHide,
    reorderLessons,
    grammarCards,
    updateGrammarCard,
    grammarLessons,
    getGrammarLessonsByLevel,
    getGrammarChildLessons,
    kanjiCards,
    updateKanjiCard,
    kanjiLessons,
    getKanjiLessonsByLevel,
    getKanjiChildLessons,
    getPublishedExercises,
    readingPassages,
    readingFolders,
    getReadingFoldersByLevel,
    getReadingPassagesByFolder,
  } = flashcardData;

  const {
    jlptQuestions,
    jlptFolders,
    addJLPTQuestion,
    updateJLPTQuestion,
    deleteJLPTQuestion,
    addJLPTFolder,
    updateJLPTFolder,
    deleteJLPTFolder,
    getFoldersByLevelAndCategory,
    getQuestionsByFolder,
    kaiwaQuestions,
    kaiwaFolders,
    addKaiwaQuestion,
    updateKaiwaQuestion,
    deleteKaiwaQuestion,
    addKaiwaFolder,
    updateKaiwaFolder,
    deleteKaiwaFolder,
    getFoldersByLevelAndTopic,
    getQuestionsByKaiwaFolder,
    getQuestionsByLevelAndTopic,
    advancedKaiwaTopics,
    advancedKaiwaQuestions,
    addAdvancedKaiwaTopic,
    updateAdvancedKaiwaTopic,
    deleteAdvancedKaiwaTopic,
    addAdvancedKaiwaQuestion,
    updateAdvancedKaiwaQuestion,
    deleteAdvancedKaiwaQuestion,
    getAdvancedKaiwaQuestionsByTopic,
    customTopics,
    customTopicQuestions,
    getCustomTopicQuestionsByTopic,
  } = jlptData;

  // JLPT level modal state - show if logged in but no level set
  const [showJlptLevelModal, setShowJlptLevelModal] = useState(false);
  const [jlptLevelSkipped, setJlptLevelSkipped] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show JLPT level modal on first login - derived state sync
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentUser && !currentUser.jlptLevel && !jlptLevelSkipped) {
      setShowJlptLevelModal(true);
    } else {
      setShowJlptLevelModal(false);
    }
  }, [currentUser, jlptLevelSkipped]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Show onboarding tour on first login (after JLPT modal dismissed)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentUser && !showJlptLevelModal) {
      const seen = localStorage.getItem('shinko_onboarding_seen');
      if (!seen) setShowOnboarding(true);
    }
  }, [currentUser, showJlptLevelModal]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Reset to home page when user logs in (unless joining via QR code)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentUser && !initialGameJoinCode) {
      setCurrentPage('home');
    } else if (currentUser && initialGameJoinCode) {
      setCurrentPage('game-hub');
    }
  }, [currentUser, initialGameJoinCode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { settings, updateSetting, resetSettings } = useSettings();
  const { theme, applyPreset, resetTheme } = useGlobalTheme();

  // Daily words learning - filtered by user's JLPT level
  const dailyWords = useDailyWords({
    allCards: cards,
    targetCount: settings.dailyWordsTarget,
    enabled: settings.dailyWordsEnabled,
    userJlptLevel: currentUser?.jlptLevel,
  });

  // Check if user can see hidden lessons (creator or super_admin)
  const canSeeHiddenLesson = useCallback((lesson: Lesson): boolean => {
    if (isSuperAdmin) return true;
    return lesson.createdBy === currentUser?.id;
  }, [isSuperAdmin, currentUser?.id]);

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
  }, [getLessonsByLevel, canAccessLocked, canSeeHiddenLesson]);

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
  }, [getChildLessons, canAccessLocked, canSeeHiddenLesson]);

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

  return (
    <div className={`app app-with-sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={currentUser}
        onLogout={logout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        dailyWordsNotification={{
          enabled: dailyWords.enabled,
          isCompleted: dailyWords.isCompleted,
          progress: dailyWords.progress,
          streak: dailyWords.streak,
          showNotification: dailyWords.showNotification,
          onDismiss: dailyWords.dismissNotification,
          onOpenModal: dailyWords.openModal,
        }}
      />

      <div className="main-wrapper">
        {/* Offline status indicator */}
        <OfflineIndicator
          isOnline={offline.isOnline}
          isSyncing={offline.isSyncing}
          offlineCardCount={offline.offlineCardCount}
        />

        <main className="main-content">
        <ErrorBoundary>
        <Suspense fallback={<div className="app-loading-screen app-loading-inline"><div className="app-loading-content"><div className="app-loading-spinner" /><span className="app-loading-label">Đang tải...</span></div></div>}>
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
            onNavigate={(page) => setCurrentPage(page as Page)}
            userName={currentUser?.displayName || currentUser?.username}
            progress={progress}
            dailyWords={dailyWords}
            currentUserId={currentUser?.id}
            onShowTour={() => setShowOnboarding(true)}
            studySessions={studySessions}
            gameSessions={gameSessions}
            jlptSessions={jlptSessions}
            missions={achievementCtx ? {
              missions: achievementCtx.missions,
              allCompleted: achievementCtx.allMissionsCompleted,
              bonusClaimed: achievementCtx.bonusXpClaimed,
              onClaimBonus: achievementCtx.claimMissionBonus,
            } : undefined}
            onShowAchievements={achievementCtx?.openShowcase}
            userJlptLevel={currentUser?.jlptLevel}
            onSpeak={(text) => {
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'ja-JP';
              utterance.rate = 0.9;
              speechSynthesis.speak(utterance);
            }}
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
            onAddLesson={async (name, level, parentId) => {
              await addLesson(name, level, parentId ?? null, currentUser.id);
            }}
            onUpdateLesson={updateLesson}
            onDeleteLesson={deleteLesson}
            currentUser={currentUser}
            jlptQuestions={jlptQuestions}
            jlptFolders={jlptFolders}
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
            onAddKaiwaQuestion={async (data) => {
              const result = await addKaiwaQuestion(data, currentUser.id);
              if (!result) throw new Error('Failed to add kaiwa question');
              return result;
            }}
            onUpdateKaiwaQuestion={updateKaiwaQuestion}
            onDeleteKaiwaQuestion={deleteKaiwaQuestion}
            onAddKaiwaFolder={async (name, level, topic) => {
              const result = await addKaiwaFolder(name, level as any, topic, currentUser.id);
              if (!result) throw new Error('Failed to add kaiwa folder');
              return result;
            }}
            onUpdateKaiwaFolder={updateKaiwaFolder}
            onDeleteKaiwaFolder={deleteKaiwaFolder}
            getFoldersByLevelAndTopic={getFoldersByLevelAndTopic as any}
            getQuestionsByKaiwaFolder={getQuestionsByKaiwaFolder}
            // Advanced Kaiwa Topics props
            advancedKaiwaTopics={advancedKaiwaTopics}
            advancedKaiwaQuestions={advancedKaiwaQuestions}
            onAddAdvancedKaiwaTopic={addAdvancedKaiwaTopic}
            onUpdateAdvancedKaiwaTopic={updateAdvancedKaiwaTopic}
            onDeleteAdvancedKaiwaTopic={deleteAdvancedKaiwaTopic}
            onAddAdvancedKaiwaQuestion={addAdvancedKaiwaQuestion}
            onUpdateAdvancedKaiwaQuestion={updateAdvancedKaiwaQuestion}
            onDeleteAdvancedKaiwaQuestion={deleteAdvancedKaiwaQuestion}
            // User management props
            users={users}
            onUpdateUserRole={updateUserRole}
            onDeleteUser={deleteUser}
            onUpdateVipExpiration={updateVipExpiration}
            onRegister={register}
            // Lesson locking/hiding props
            onToggleLock={toggleLock}
            onToggleHide={toggleLessonHide}
            onReorderLessons={reorderLessons}
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
            getLessonsByLevel={filteredGetLessonsByLevel}
            getChildLessons={filteredGetChildLessons}
            updateCard={updateCard}
            onGoHome={() => setCurrentPage('home')}
            settings={settings}
            onUpdateSetting={updateSetting}
            onSaveStudySession={addStudySession}
          />
        )}

        {currentPage === 'listening' && (
          <ListeningPracticePage />
        )}

        {currentPage === 'grammar-study' && (
          <GrammarStudyPage
            grammarCards={grammarCards}
            lessons={grammarLessons}
            getLessonsByLevel={getGrammarLessonsByLevel}
            getChildLessons={getGrammarChildLessons}
            onGoHome={() => setCurrentPage('home')}
            settings={settings}
            onUpdateGrammarCard={updateGrammarCard}
          />
        )}

        {currentPage === 'kanji-study' && (
          <KanjiStudyPage
            kanjiCards={kanjiCards}
            lessons={kanjiLessons}
            getLessonsByLevel={getKanjiLessonsByLevel}
            getChildLessons={getKanjiChildLessons}
            onGoHome={() => setCurrentPage('home')}
            onUpdateKanjiCard={updateKanjiCard}
          />
        )}

        {currentPage === 'reading' && (
          <ReadingPracticePage
            passages={readingPassages}
            folders={readingFolders}
            getFoldersByLevel={getReadingFoldersByLevel}
            getPassagesByFolder={getReadingPassagesByFolder}
            onGoHome={() => setCurrentPage('home')}
          />
        )}

        {currentPage === 'exercises' && (
          <ExercisePage
            exercises={getPublishedExercises()}
            flashcards={cards}
            onGoHome={() => setCurrentPage('home')}
          />
        )}

        {currentPage === 'progress' && (
          <ProgressPage
            progress={progress}
            stats={userStats}
            onStartStudy={() => setCurrentPage('study')}
          />
        )}

        {(currentPage === 'settings' || currentPage === 'profile') && (
          <SettingsPage
            settings={settings}
            onUpdateSetting={updateSetting}
            onReset={resetSettings}
            initialTab={currentPage === 'profile' ? 'profile' : undefined}
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
            onUpdateJlptLevel={async (level) => {
              if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
              return updateJlptLevel(currentUser.id, level);
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
            kanjiCards={kanjiCards}
            jlptQuestions={jlptQuestions}
            getLessonsByLevel={filteredGetLessonsByLevel}
            getChildLessons={filteredGetChildLessons}
            settings={settings}
            friends={friendsWithUsers}
            onInviteFriend={sendGameInvitation}
            initialGame={initialGameType}
            initialJoinCode={initialGameJoinCode}
            onCollapseSidebar={() => setSidebarCollapsed(true)}
            onExpandSidebar={() => setSidebarCollapsed(false)}
            onSaveGameSession={addGameSession}
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
            getFoldersByLevelAndTopic={getFoldersByLevelAndTopic as any}
            getQuestionsByFolder={getQuestionsByKaiwaFolder}
            getQuestionsByLevelAndTopic={getQuestionsByLevelAndTopic as any}
            // Advanced session props
            advancedTopics={advancedKaiwaTopics}
            advancedQuestions={advancedKaiwaQuestions}
            getAdvancedQuestionsByTopic={getAdvancedKaiwaQuestionsByTopic}
            // Custom topics props
            customTopics={customTopics}
            customTopicQuestions={customTopicQuestions}
            getCustomTopicQuestionsByTopic={getCustomTopicQuestionsByTopic}
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

        {/* daily-words page removed - now uses modal from homepage/notification */}

        {/* Center pages - only when inside center app */}
        {currentPage === 'center-members' && currentUser && (
          <CenterMembersPage users={users} />
        )}

        {currentPage === 'center-dashboard' && currentUser && (
          <CenterDashboardPage currentUser={currentUser} users={users} onNavigate={setCurrentPage} />
        )}

        {currentPage === 'pricing' && (
          <PricingPage
            isVip={canAccessLocked}
            onUpgrade={() => {
              setCurrentPage('settings');
            }}
          />
        )}

        {currentPage === 'permissions' && currentUser && currentUser.role === 'super_admin' && (
          <RolePermissionsPage />
        )}

        {currentPage === 'conjugation' && (
          <ConjugationTrainerPage />
        )}

        {currentPage === 'pronunciation' && (
          <PronunciationPracticePage />
        )}
        </Suspense>
        </ErrorBoundary>
        </main>
      </div>

      {/* Floating Chat Buttons and Panels - hidden on game-hub */}
      {currentUser && currentPage !== 'game-hub' && (
        <>
          {/* AI Tutor button (left of chat button) */}
          <button
            className="floating-ai-btn"
            onClick={() => { setIsAiChatOpen(!isAiChatOpen); if (isChatOpen) setIsChatOpen(false); }}
            title="AI Gia sư"
            style={{
              position: 'fixed', bottom: 20, right: 76, zIndex: 1000,
              width: 46, height: 46, borderRadius: '50%',
              background: isAiChatOpen ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #6d28d9, #9333ea)',
              border: 'none', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
              fontSize: '1.2rem', transition: 'all 0.2s',
            }}
          >
            🤖
          </button>

          {/* User chat button */}
          <FloatingChatButton
            onClick={() => { setIsChatOpen(!isChatOpen); if (isAiChatOpen) setIsAiChatOpen(false); }}
            isActive={isChatOpen}
          />

          {/* User chat panel */}
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <FloatingChatPanel
                currentUser={currentUser}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
              />
            </Suspense>
          </ErrorBoundary>

          {/* AI Tutor panel */}
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <AiTutorPanel
                isOpen={isAiChatOpen}
                onClose={() => setIsAiChatOpen(false)}
                userJlptLevel={currentUser.jlptLevel}
              />
            </Suspense>
          </ErrorBoundary>
        </>
      )}

      {/* Onboarding Tour - First-time user introduction */}
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingTour onComplete={() => {
            localStorage.setItem('shinko_onboarding_seen', 'true');
            setShowOnboarding(false);
          }} />
        </Suspense>
      )}

      {/* Achievement system global UI */}
      {achievementCtx && (
        <Suspense fallback={null}>
          <AchievementToast toast={achievementCtx.pendingToast} onDismiss={achievementCtx.dismissToast} />
          <CelebrationOverlay reason={achievementCtx.celebration} onDismiss={achievementCtx.dismissCelebration} />
          <AchievementShowcase
            achievements={achievementCtx.achievements}
            isOpen={achievementCtx.showShowcase}
            onClose={achievementCtx.closeShowcase}
          />
        </Suspense>
      )}

      {/* JLPT Level Selection Modal - First login prompt */}
      {showJlptLevelModal && currentUser && (
        <JLPTLevelModal
          onSelect={async (level: UserJLPTLevel) => {
            await updateJlptLevel(currentUser.id, level);
            setShowJlptLevelModal(false);
          }}
          onSkip={() => {
            setJlptLevelSkipped(true);
            setShowJlptLevelModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
