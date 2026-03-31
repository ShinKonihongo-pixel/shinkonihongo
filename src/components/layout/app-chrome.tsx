// AppChrome — app shell with sidebar, offline indicator, floating panels,
// achievements, global search, and JLPT level prompt.
// Wraps the main content area (children = page content from Outlet)

import { useState, useEffect, Suspense, type ReactNode } from 'react';
import { useNavigation } from '../../contexts/navigation-context';
import { useAuthData } from '../../contexts/auth-context';
import { useFlashcardData } from '../../contexts/flashcard-data-context';
import { useAchievementContextOptional } from '../../contexts/achievement-context';
import { useSettings } from '../../hooks/use-settings';
import { useOffline } from '../../hooks/use-offline';
import { useDailyWords } from '../../hooks/use-daily-words';
import { useNotifications } from '../../hooks/use-notifications';
import { identifyUser, resetAnalytics } from '../../lib/analytics';
import { Sidebar } from './sidebar';
import { OfflineIndicator } from '../common/offline-indicator';
import { GlobalSearch } from '../common/global-search';
import { JLPTLevelModal } from '../common/jlpt-level-modal';
import { ErrorBoundary } from '../common/error-boundary';
import { LoadingIndicator } from '../ui/loading-indicator';
import { FloatingPanels } from './floating-panels';
import { AchievementOverlays } from './achievement-overlays';
import type { Page } from './header';
import type { UserJLPTLevel } from '../../types/user';

export function AppChrome({ children }: { children: ReactNode }) {
  const nav = useNavigation();
  const { currentUser, logout, updateJlptLevel } = useAuthData();
  const { cards, lessons, grammarCards, kanjiCards, readingPassages } = useFlashcardData();
  const achievementCtx = useAchievementContextOptional();
  const { settings } = useSettings();

  // Shared hooks used by both chrome and page content
  const dailyWords = useDailyWords({
    allCards: cards,
    targetCount: settings.dailyWordsTarget,
    enabled: settings.dailyWordsEnabled,
    userJlptLevel: currentUser?.jlptLevel,
  });
  const offline = useOffline(cards, lessons);
  useNotifications(cards);

  // JLPT level modal — prompt on first login if no level set
  const [showJlptLevelModal, setShowJlptLevelModal] = useState(false);
  const [jlptLevelSkipped, setJlptLevelSkipped] = useState(false);

  useEffect(() => {
    if (currentUser && !currentUser.jlptLevel && !jlptLevelSkipped) {
      setShowJlptLevelModal(true);
    } else {
      setShowJlptLevelModal(false);
    }
  }, [currentUser, jlptLevelSkipped]);

  // Analytics: identify user on login, reset on logout
  useEffect(() => {
    if (currentUser) {
      identifyUser(currentUser.id, { role: currentUser.role, jlptLevel: currentUser.jlptLevel });
    } else {
      resetAnalytics();
    }
  }, [currentUser]);

  // Content protection — block copy/print/save/view-source shortcuts + context menu
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      // Ctrl/Cmd + C (copy), S (save), U (view source), P (print)
      if ((e.ctrlKey || e.metaKey) && ['c', 's', 'u', 'p'].includes(e.key.toLowerCase())) {
        // Allow copy inside inputs/textareas
        if (e.key.toLowerCase() === 'c' && (e.target as HTMLElement)?.tagName?.match(/^(INPUT|TEXTAREA)$/)) return;
        e.preventDefault();
      }
      // F12 + Ctrl+Shift+I/J (dev tools) — temporarily allowed for debugging
      // TODO: Re-enable before production deploy
    };
    const blockContext = (e: MouseEvent) => e.preventDefault();
    const blockDrag = (e: DragEvent) => e.preventDefault();

    document.addEventListener('keydown', blockKeys);
    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('dragstart', blockDrag);
    return () => {
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('dragstart', blockDrag);
    };
  }, []);

  return (
    <div className={`app app-with-sidebar ${nav.sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <a href="#main-content" className="skip-link">Chuyển đến nội dung chính</a>
      <Sidebar
        currentPage={nav.currentPage}
        onNavigate={nav.setCurrentPage}
        currentUser={currentUser}
        onLogout={logout}
        isCollapsed={nav.sidebarCollapsed}
        onToggleCollapse={() => nav.setSidebarCollapsed(!nav.sidebarCollapsed)}
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
        <OfflineIndicator
          isOnline={offline.isOnline}
          isSyncing={offline.isSyncing}
          offlineCardCount={offline.offlineCardCount}
        />
        <main id="main-content" className="main-content">
          <ErrorBoundary>
            <Suspense fallback={<LoadingIndicator inline label="Đang tải..." />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating chat & AI tutor panels */}
      {currentUser && (
        <FloatingPanels
          currentUser={currentUser}
          currentPage={nav.currentPage}
          isChatOpen={nav.isChatOpen}
          setIsChatOpen={nav.setIsChatOpen}
          isAiChatOpen={nav.isAiChatOpen}
          setIsAiChatOpen={nav.setIsAiChatOpen}
        />
      )}

      {/* Achievement system overlays */}
      <AchievementOverlays ctx={achievementCtx} />

      {/* JLPT Level Selection Modal — first login prompt */}
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

      {/* Global Search (Cmd+K) */}
      <GlobalSearch
        cards={cards}
        grammarCards={grammarCards}
        kanjiCards={kanjiCards}
        lessons={lessons}
        readingPassages={readingPassages}
        onNavigate={(page) => nav.setCurrentPage(page as Page)}
        isOpen={nav.isSearchOpen}
        onClose={() => nav.setIsSearchOpen(false)}
      />
    </div>
  );
}
