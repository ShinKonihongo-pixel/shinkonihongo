// Game Tab - Orchestrator with State Management and View Routing

import { useState, useEffect, useCallback } from 'react';
import {
  getGameVisibilitySettings,
  toggleGameVisibility,
  showAllGames,
  type GameVisibilitySettings,
} from '../../../services/game-visibility-storage';
import type { GameType } from '../../../types/game-hub';
import { PictureGuessPuzzleEditor } from '../../picture-guess/picture-guess-puzzle-editor';
import { BingoGameManager } from '../../bingo-game/bingo-game-manager';
import { KanjiBattleManager } from '../../kanji-battle/kanji-battle-manager';
import { WordMatchManager } from '../../word-match/word-match-manager';
import { ImageWordManagementPage } from '../../pages/image-word-management-page';
import { DashboardView } from './dashboard-view';
import { GlobalSettingsPanel } from './global-settings-panel';
import { QuizGameSettingsPanel } from './quiz-game-settings-panel';
import { AIChallengeSettingsPanel } from './ai-challenge-settings-panel';
import { KanjiDropManager } from '../../kanji-drop/kanji-drop-manager';
import { ALL_GAMES, type GameSection, type DashboardStats } from './game-tab-types';

export function GameTab() {
  const [activeSection, setActiveSection] = useState<GameSection>('dashboard');
  const [visibilitySettings, setVisibilitySettings] = useState<GameVisibilitySettings>({ hiddenGames: [], updatedAt: 0 });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalGamesPlayed: 591,
    activeRooms: 3,
    playersOnline: 12,
    avgSessionTime: '8 phút',
    popularGame: 'Kanji Battle',
    todayGames: 24,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load visibility settings on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibilitySettings(getGameVisibilitySettings());
  }, []);

  // Show toast notification
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Toggle game visibility
  const handleToggleVisibility = useCallback((gameId: GameType, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHiddenState = toggleGameVisibility(gameId);
    setVisibilitySettings(getGameVisibilitySettings());

    const game = ALL_GAMES.find(g => g.id === gameId);
    if (game) {
      showToast(newHiddenState ? `Đã ẩn "${game.title}"` : `Đã hiện "${game.title}"`);
    }
  }, [showToast]);

  // Show all games
  const handleShowAllGames = useCallback(() => {
    showAllGames();
    setVisibilitySettings(getGameVisibilitySettings());
    showToast('Đã hiện tất cả games');
  }, [showToast]);

  // Simulate data refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setDashboardStats(prev => ({
        ...prev,
        playersOnline: Math.floor(Math.random() * 20) + 5,
        activeRooms: Math.floor(Math.random() * 5),
      }));
      setIsRefreshing(false);
      showToast('Đã cập nhật dữ liệu');
    }, 1000);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardStats(prev => ({
        ...prev,
        playersOnline: Math.max(0, prev.playersOnline + Math.floor(Math.random() * 5) - 2),
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dashboard view
  if (activeSection === 'dashboard') {
    return (
      <DashboardView
        visibilitySettings={visibilitySettings}
        dashboardStats={dashboardStats}
        isRefreshing={isRefreshing}
        toastMessage={toastMessage}
        onSectionChange={setActiveSection}
        onToggleVisibility={handleToggleVisibility}
        onShowAllGames={handleShowAllGames}
        onRefresh={handleRefresh}
      />
    );
  }

  // Global Settings View
  if (activeSection === 'global-settings') {
    return <GlobalSettingsPanel onBack={() => setActiveSection('dashboard')} />;
  }

  // Picture Guess Editor
  if (activeSection === 'picture-guess') {
    return <PictureGuessPuzzleEditor onClose={() => setActiveSection('dashboard')} />;
  }

  // Bingo Manager
  if (activeSection === 'bingo') {
    return <BingoGameManager onClose={() => setActiveSection('dashboard')} />;
  }

  // Kanji Battle Manager
  if (activeSection === 'kanji-battle') {
    return <KanjiBattleManager onClose={() => setActiveSection('dashboard')} />;
  }

  // Word Match Manager
  if (activeSection === 'word-match') {
    return <WordMatchManager onClose={() => setActiveSection('dashboard')} />;
  }

  // Image Word Manager
  if (activeSection === 'image-word') {
    return <ImageWordManagementPage onBack={() => setActiveSection('dashboard')} />;
  }

  // Quiz Game (Đại Chiến Tiếng Nhật) Manager
  if (activeSection === 'quiz') {
    return <QuizGameSettingsPanel onBack={() => setActiveSection('dashboard')} />;
  }

  // AI Challenge Settings
  if (activeSection === 'ai-challenge') {
    return <AIChallengeSettingsPanel onBack={() => setActiveSection('dashboard')} />;
  }

  // Kanji Drop Manager
  if (activeSection === 'kanji-drop') {
    return <KanjiDropManager onClose={() => setActiveSection('dashboard')} />;
  }

  return null;
}
