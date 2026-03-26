// App-level navigation state + URL bridge effects
// Extracted from App.tsx AppContent to reduce monolith complexity

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';
import { ROUTES, URL_TO_PAGE } from '../routes';
import type { Page } from '../components/layout/header';
import type { JLPTLevel } from '../types/flashcard';
import type { GameType } from '../types/game-hub';

export interface AppNavigationState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  initialGameType: GameType | null;
  initialGameJoinCode: string | null;
  editingLectureId: string | undefined;
  setEditingLectureId: (id: string | undefined) => void;
  editingLectureFolderId: string | undefined;
  setEditingLectureFolderId: (id: string | undefined) => void;
  editingLectureLevel: JLPTLevel | undefined;
  setEditingLectureLevel: (level: JLPTLevel | undefined) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export function useAppNavigation(): AppNavigationState {
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Handle URL parameters for game join (QR code scanning) — runs once on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const joinCode = params.get('join');
    const racingCode = params.get('racing');
    const goldenBellCode = params.get('golden-bell');
    const pictureGuessCode = params.get('picture-guess');

    /* eslint-disable react-hooks/set-state-in-effect */
    if (joinCode) {
      setInitialGameType('quiz');
      setInitialGameJoinCode(joinCode.toUpperCase());
      setCurrentPage('game-hub');
      navigate(ROUTES['game-hub'], { replace: true });
    } else if (racingCode) {
      setInitialGameType('quiz');
      setInitialGameJoinCode(racingCode.toUpperCase());
      setCurrentPage('game-hub');
      navigate(ROUTES['game-hub'], { replace: true });
    } else if (goldenBellCode) {
      setInitialGameType('golden-bell');
      setInitialGameJoinCode(goldenBellCode.toUpperCase());
      setCurrentPage('game-hub');
      navigate(ROUTES['game-hub'], { replace: true });
    } else if (pictureGuessCode) {
      setInitialGameType('picture-guess');
      setInitialGameJoinCode(pictureGuessCode.toUpperCase());
      setCurrentPage('game-hub');
      navigate(ROUTES['game-hub'], { replace: true });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bridge: URL → state (browser back/forward or deep link)
  useEffect(() => {
    if (location.pathname.startsWith('/center/')) return;
    const page = URL_TO_PAGE[location.pathname];
    if (page && page !== currentPage) {
      setCurrentPage(page as Page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Bridge: state → URL (when code calls setCurrentPage)
  useEffect(() => {
    if (location.pathname.startsWith('/center/')) return;
    const targetUrl = ROUTES[currentPage];
    if (targetUrl && targetUrl !== location.pathname) {
      navigate(targetUrl, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Analytics: track page views
  useEffect(() => {
    trackPageView(currentPage);
  }, [currentPage]);

  // Global search keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Expose setInitialFilterLevel for HomePage callbacks
  void setInitialFilterLevel; // Used indirectly by page render callbacks

  return {
    currentPage, setCurrentPage,
    initialGameType, initialGameJoinCode,
    editingLectureId, setEditingLectureId,
    editingLectureFolderId, setEditingLectureFolderId,
    editingLectureLevel, setEditingLectureLevel,
    isChatOpen, setIsChatOpen,
    isAiChatOpen, setIsAiChatOpen,
    sidebarCollapsed, setSidebarCollapsed,
    isSearchOpen, setIsSearchOpen,
  };
}
