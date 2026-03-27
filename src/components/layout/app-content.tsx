// AppContent — conditional page rendering based on currentPage state
// All pages are zero-prop; they consume contexts directly.
// This file handles: lazy loading, page routing via currentPage, role guards, login redirect.

import { lazy, useEffect } from 'react';
import { useNavigation } from '../../contexts/navigation-context';
import { useUserData } from '../../contexts/user-data-context';
import { canAccessPage } from '../../utils/role-permissions';

// Lazy-loaded page components
const HomePage = lazy(() => import('../pages/home-page').then(m => ({ default: m.HomePage })));
const CardsPage = lazy(() => import('../pages/cards-page').then(m => ({ default: m.CardsPage })));
const StudyPage = lazy(() => import('../pages/study-page').then(m => ({ default: m.StudyPage })));
const SettingsPage = lazy(() => import('../pages/settings-page').then(m => ({ default: m.SettingsPage })));
const JLPTPage = lazy(() => import('../pages/jlpt/index.tsx').then(m => ({ default: m.JLPTPage })));
const ChatPage = lazy(() => import('../pages/chat-page').then(m => ({ default: m.ChatPage })));
const KaiwaPage = lazy(() => import('../pages/kaiwa/index.tsx').then(m => ({ default: m.KaiwaPage })));
const LecturePage = lazy(() => import('../pages/lecture-page').then(m => ({ default: m.LecturePage })));
const LectureEditorPage = lazy(() => import('../pages/lecture-editor').then(m => ({ default: m.LectureEditorPage })));
const ProgressPage = lazy(() => import('../pages/progress-page').then(m => ({ default: m.ProgressPage })));
const ClassroomPage = lazy(() => import('../pages/classroom-page').then(m => ({ default: m.ClassroomPage })));
const BranchManagementPage = lazy(() => import('../pages/branch-management-page').then(m => ({ default: m.BranchManagementPage })));
const TeacherManagementPage = lazy(() => import('../pages/teacher-management-page').then(m => ({ default: m.TeacherManagementPage })));
const SalaryPage = lazy(() => import('../pages/salary-page').then(m => ({ default: m.SalaryPage })));
const MyTeachingPage = lazy(() => import('../pages/my-teaching-page').then(m => ({ default: m.MyTeachingPage })));
const NotificationsPage = lazy(() => import('../pages/notifications-page').then(m => ({ default: m.NotificationsPage })));
const GameHubPage = lazy(() => import('../pages/game-hub-page').then(m => ({ default: m.GameHubPage })));
const ListeningPracticePage = lazy(() => import('../pages/audio-player-page/index.tsx').then(m => ({ default: m.ListeningPracticePage })));
const GrammarStudyPage = lazy(() => import('../pages/grammar-study-page').then(m => ({ default: m.GrammarStudyPage })));
const ReadingPracticePage = lazy(() => import('../pages/reading-practice/index.tsx').then(m => ({ default: m.ReadingPracticePage })));
const ExercisePage = lazy(() => import('../pages/exercise/index.tsx').then(m => ({ default: m.ExercisePage })));
const KanjiStudyPage = lazy(() => import('../pages/kanji-study-page').then(m => ({ default: m.KanjiStudyPage })));
const CenterMembersPage = lazy(() => import('../pages/center-members-page').then(m => ({ default: m.CenterMembersPage })));
const CenterDashboardPage = lazy(() => import('../pages/center-dashboard-page').then(m => ({ default: m.CenterDashboardPage })));
const PricingPage = lazy(() => import('../pages/pricing-page').then(m => ({ default: m.PricingPage })));
const RolePermissionsPage = lazy(() => import('../pages/role-permissions-page').then(m => ({ default: m.RolePermissionsPage })));
const ConjugationTrainerPage = lazy(() => import('../pages/conjugation-trainer-page').then(m => ({ default: m.ConjugationTrainerPage })));
const PronunciationPracticePage = lazy(() => import('../pages/pronunciation-practice-page').then(m => ({ default: m.PronunciationPracticePage })));
const AnalyticsDashboardPage = lazy(() => import('../pages/analytics-dashboard-page').then(m => ({ default: m.AnalyticsDashboardPage })));

export function AppContent() {
  const { currentPage, setCurrentPage, initialGameJoinCode } = useNavigation();
  const { currentUser, canAccessLocked } = useUserData();

  // Reset to home page when user logs in (unless joining via QR code)
  useEffect(() => {
    if (currentUser && !initialGameJoinCode) setCurrentPage('home');
    else if (currentUser && initialGameJoinCode) setCurrentPage('game-hub');
  }, [currentUser, initialGameJoinCode, setCurrentPage]);

  return (
    <>
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'cards' && currentUser && canAccessPage('cards', currentUser.role) && <CardsPage />}
      {currentPage === 'study' && <StudyPage />}
      {currentPage === 'listening' && <ListeningPracticePage />}
      {currentPage === 'grammar-study' && <GrammarStudyPage />}
      {currentPage === 'kanji-study' && <KanjiStudyPage />}
      {currentPage === 'reading' && <ReadingPracticePage />}
      {currentPage === 'exercises' && <ExercisePage />}
      {currentPage === 'progress' && <ProgressPage />}
      {(currentPage === 'settings' || currentPage === 'profile') && <SettingsPage />}
      {currentPage === 'game-hub' && <GameHubPage />}
      {currentPage === 'jlpt' && <JLPTPage />}
      {currentPage === 'kaiwa' && currentUser && canAccessLocked && <KaiwaPage />}
      {currentPage === 'lectures' && <LecturePage />}
      {currentPage === 'lecture-editor' && currentUser && canAccessPage('lecture-editor', currentUser.role) && <LectureEditorPage />}
      {currentPage === 'chat' && currentUser && <ChatPage />}
      {currentPage === 'classroom' && currentUser && <ClassroomPage />}
      {currentPage === 'branches' && currentUser && canAccessPage('branches', currentUser.role) && <BranchManagementPage />}
      {currentPage === 'teachers' && currentUser && canAccessPage('teachers', currentUser.role) && <TeacherManagementPage />}
      {currentPage === 'salary' && currentUser && canAccessPage('salary', currentUser.role) && <SalaryPage />}
      {currentPage === 'my-teaching' && currentUser && canAccessPage('my-teaching', currentUser.role) && <MyTeachingPage />}
      {currentPage === 'notifications' && currentUser && <NotificationsPage />}
      {currentPage === 'center-members' && currentUser && <CenterMembersPage />}
      {currentPage === 'center-dashboard' && currentUser && <CenterDashboardPage />}
      {currentPage === 'pricing' && <PricingPage />}
      {currentPage === 'permissions' && currentUser && canAccessPage('permissions', currentUser.role) && <RolePermissionsPage />}
      {currentPage === 'conjugation' && <ConjugationTrainerPage />}
      {currentPage === 'pronunciation' && <PronunciationPracticePage />}
      {currentPage === 'analytics' && <AnalyticsDashboardPage />}
    </>
  );
}
