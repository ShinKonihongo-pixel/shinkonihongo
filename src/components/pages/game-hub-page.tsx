// Game Hub Page - Unified game center orchestrating all mini-games
// Manages game selection and routes to appropriate game pages
// Uses lazy loading for game pages to improve initial load performance

import { useState, useCallback, lazy, Suspense } from 'react';
import type { GameType } from '../../types/game-hub';
import type { CurrentUser, GameSession } from '../../types/user';
import type { Flashcard, JLPTLevel, Lesson } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { AppSettings } from '../../hooks/use-settings';
import type { FriendWithUser } from '../../types/friendship';
import type { GameRoomConfig } from '../game-hub/room-setup/types';
import type { CreateGameData } from '../../types/quiz-game';
import type { CreateKanjiBattleData } from '../../types/kanji-battle';
import { GameSelector } from '../game-hub/game-selector';
import { GameRoomSetup } from '../game-hub/room-setup/game-room-setup';
import {
  GOLDEN_BELL_SETUP_CONFIG,
  PICTURE_GUESS_SETUP_CONFIG,
  BINGO_SETUP_CONFIG,
  WORD_MATCH_SETUP_CONFIG,
  IMAGE_WORD_SETUP_CONFIG,
  WORD_SCRAMBLE_SETUP_CONFIG,
} from '../game-hub/room-setup/game-configs';
import { GameCreate } from '../quiz-game/game-create';
import { KanjiBattleSetup } from '../kanji-battle/kanji-battle-setup';
import { FloatingMusicPlayer } from '../game-hub/floating-music-player';

// Lazy load game pages for code splitting
const QuizGamePage = lazy(() => import('./quiz-game-page').then(m => ({ default: m.QuizGamePage })));
const GoldenBellPage = lazy(() => import('./golden-bell-page').then(m => ({ default: m.GoldenBellPage })));
const PictureGuessPage = lazy(() => import('./picture-guess-page').then(m => ({ default: m.PictureGuessPage })));
const BingoPage = lazy(() => import('./bingo-page').then(m => ({ default: m.BingoPage })));
const KanjiBattlePage = lazy(() => import('./kanji-battle-page').then(m => ({ default: m.KanjiBattlePage })));
const WordMatchPage = lazy(() => import('./word-match-page').then(m => ({ default: m.WordMatchPage })));
const AIChallengePage = lazy(() => import('./ai-challenge-page').then(m => ({ default: m.AIChallengePage })));
const ImageWordPage = lazy(() => import('./image-word-page').then(m => ({ default: m.ImageWordPage })));
const WordScramblePage = lazy(() => import('./word-scramble-page').then(m => ({ default: m.WordScramblePage })));

// Loading fallback component
function GameLoadingFallback() {
  return (
    <div className="game-loading-fallback">
      <div className="loading-spinner" />
      <p>Đang tải game...</p>
    </div>
  );
}

interface GameHubPageProps {
  currentUser: CurrentUser | null;
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  settings: AppSettings;
  friends?: FriendWithUser[];
  onInviteFriend?: (gameId: string, gameCode: string, gameTitle: string, friendId: string) => Promise<boolean>;
  // Initial game selection (from URL params)
  initialGame?: GameType | null;
  initialJoinCode?: string | null;
  // Collapse sidebar when entering game
  onCollapseSidebar?: () => void;
  // Save game session for XP tracking
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
}

export function GameHubPage({
  currentUser,
  flashcards,
  jlptQuestions,
  getLessonsByLevel,
  getChildLessons,
  settings,
  friends = [],
  onInviteFriend,
  initialGame,
  initialJoinCode,
  onCollapseSidebar,
  onSaveGameSession,
}: GameHubPageProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(initialGame || null);
  const [joinCode, setJoinCode] = useState<string | null>(initialJoinCode || null);
  const [showMusicPlayer, setShowMusicPlayer] = useState(true);
  const [setupModalGame, setSetupModalGame] = useState<GameType | null>(null);
  const [pendingRoomConfig, setPendingRoomConfig] = useState<{ gameType: GameType; data: Record<string, unknown> } | null>(null);

  // Handle game selection - also collapse sidebar
  const handleSelectGame = useCallback((game: GameType) => {
    setSelectedGame(game);
    setJoinCode(null);
    setPendingRoomConfig(null);
    onCollapseSidebar?.();
  }, [onCollapseSidebar]);

  // Handle quick join with code - also collapse sidebar
  const handleQuickJoin = useCallback((gameType: GameType, code: string) => {
    setSelectedGame(gameType);
    setJoinCode(code);
    setPendingRoomConfig(null);
    onCollapseSidebar?.();
  }, [onCollapseSidebar]);

  // Return to game selector
  const handleBackToHub = useCallback(() => {
    setSelectedGame(null);
    setJoinCode(null);
    setPendingRoomConfig(null);
  }, []);

  // Close setup modal
  const closeSetupModal = useCallback(() => {
    setSetupModalGame(null);
  }, []);

  // Handle room creation from standard GameRoomSetup modal (6 games)
  const handleStandardRoomCreate = useCallback((gameType: GameType) => {
    return (roomConfig: GameRoomConfig) => {
      setPendingRoomConfig({ gameType, data: roomConfig as unknown as Record<string, unknown> });
      setSetupModalGame(null);
      setSelectedGame(gameType);
      onCollapseSidebar?.();
    };
  }, [onCollapseSidebar]);

  // Handle Quiz game creation from GameCreate modal
  const handleQuizCreate = useCallback(async (data: CreateGameData) => {
    setPendingRoomConfig({ gameType: 'quiz', data: data as unknown as Record<string, unknown> });
    setSetupModalGame(null);
    setSelectedGame('quiz');
    onCollapseSidebar?.();
  }, [onCollapseSidebar]);

  // Handle Kanji Battle creation from KanjiBattleSetup modal
  const handleKanjiBattleCreate = useCallback((data: CreateKanjiBattleData) => {
    setPendingRoomConfig({ gameType: 'kanji-battle', data: data as unknown as Record<string, unknown> });
    setSetupModalGame(null);
    setSelectedGame('kanji-battle');
    onCollapseSidebar?.();
  }, [onCollapseSidebar]);

  // Render per-game setup modal
  const renderSetupModal = () => {
    if (!setupModalGame) return null;

    switch (setupModalGame) {
      case 'golden-bell':
        return (
          <GameRoomSetup
            gameType="golden-bell"
            config={GOLDEN_BELL_SETUP_CONFIG}
            onCreateRoom={handleStandardRoomCreate('golden-bell')}
            onBack={closeSetupModal}
          />
        );
      case 'picture-guess':
        return (
          <GameRoomSetup
            gameType="picture-guess"
            config={PICTURE_GUESS_SETUP_CONFIG}
            onCreateRoom={handleStandardRoomCreate('picture-guess')}
            onBack={closeSetupModal}
          />
        );
      case 'bingo':
        return (
          <GameRoomSetup
            gameType="bingo"
            config={BINGO_SETUP_CONFIG}
            onCreateRoom={handleStandardRoomCreate('bingo')}
            onBack={closeSetupModal}
          />
        );
      case 'word-match':
        return (
          <GameRoomSetup
            gameType="word-match"
            config={WORD_MATCH_SETUP_CONFIG}
            onCreateRoom={handleStandardRoomCreate('word-match')}
            onBack={closeSetupModal}
          />
        );
      case 'image-word':
        return (
          <GameRoomSetup
            gameType="image-word"
            config={IMAGE_WORD_SETUP_CONFIG}
            onCreateRoom={handleStandardRoomCreate('image-word')}
            onBack={closeSetupModal}
          />
        );
      case 'word-scramble':
        return (
          <GameRoomSetup
            gameType="word-scramble"
            config={WORD_SCRAMBLE_SETUP_CONFIG}
            onCreateRoom={handleStandardRoomCreate('word-scramble')}
            onBack={closeSetupModal}
          />
        );
      case 'quiz':
        return (
          <GameCreate
            flashcards={flashcards}
            jlptQuestions={jlptQuestions}
            getLessonsByLevel={getLessonsByLevel}
            getChildLessons={getChildLessons}
            onCreateGame={handleQuizCreate}
            onCancel={closeSetupModal}
            loading={false}
            error={null}
            gameSettings={settings}
          />
        );
      case 'kanji-battle':
        return (
          <KanjiBattleSetup
            onCreateGame={handleKanjiBattleCreate}
            onBack={closeSetupModal}
          />
        );
      default:
        return null;
    }
  };

  // Not logged in
  if (!currentUser) {
    return (
      <div className="game-hub-page">
        <div className="game-hub-login-prompt">
          <span className="prompt-icon">🎮</span>
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập để chơi game</p>
        </div>
      </div>
    );
  }

  // Show game selector if no game selected
  if (!selectedGame) {
    return (
      <div className="game-hub-page">
        <GameSelector
          onSelectGame={handleSelectGame}
          onQuickJoin={handleQuickJoin}
          onSetupGame={setSetupModalGame}
        />
        {renderSetupModal()}
      </div>
    );
  }

  // Render selected game
  return (
    <div className="game-hub-page game-active">
      {/* Render appropriate game with lazy loading */}
      <Suspense fallback={<GameLoadingFallback />}>
      {selectedGame === 'quiz' && (
        <QuizGamePage
          currentUserId={currentUser.id}
          currentUserName={currentUser.displayName || currentUser.username}
          currentUserAvatar={currentUser.avatar}
          flashcards={flashcards}
          jlptQuestions={jlptQuestions}
          getLessonsByLevel={getLessonsByLevel}
          getChildLessons={getChildLessons}
          onGoHome={handleBackToHub}
          initialJoinCode={joinCode}
          onJoinCodeUsed={() => setJoinCode(null)}
          settings={settings}
          friends={friends}
          onInviteFriend={onInviteFriend}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'quiz' ? pendingRoomConfig.data : undefined}
        />
      )}

      {selectedGame === 'golden-bell' && (
        <GoldenBellPage
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🔔',
            role: currentUser.role,
          }}
          flashcards={flashcards}
          initialJoinCode={joinCode || undefined}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'golden-bell' ? pendingRoomConfig.data : undefined}
        />
      )}

      {selectedGame === 'picture-guess' && (
        <PictureGuessPage
          currentUser={currentUser}
          flashcards={flashcards}
          initialRoomConfig={pendingRoomConfig?.gameType === 'picture-guess' ? pendingRoomConfig.data : undefined}
        />
      )}

      {selectedGame === 'bingo' && (
        <BingoPage
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🎱',
            role: currentUser.role,
          }}
          initialJoinCode={joinCode || undefined}
          initialView={joinCode ? 'menu' : 'setup'}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'bingo' ? pendingRoomConfig.data : undefined}
        />
      )}

      {selectedGame === 'kanji-battle' && (
        <KanjiBattlePage
          onClose={handleBackToHub}
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '⚔️',
            role: currentUser.role,
          }}
          initialView={joinCode ? 'menu' : 'setup'}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'kanji-battle' ? pendingRoomConfig.data : undefined}
        />
      )}

      {selectedGame === 'word-match' && (
        <WordMatchPage
          onClose={handleBackToHub}
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🔗',
            role: currentUser.role,
          }}
          flashcards={flashcards}
          initialView={joinCode ? 'menu' : 'setup'}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'word-match' ? pendingRoomConfig.data : undefined}
        />
      )}

      {selectedGame === 'ai-challenge' && (
        <AIChallengePage
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🧠',
            role: currentUser.role === 'super_admin' ? 'superadmin' : currentUser.role as 'vip' | 'admin' | 'user',
          }}
          flashcards={flashcards}
          onClose={handleBackToHub}
        />
      )}

      {selectedGame === 'image-word' && (
        <ImageWordPage
          onClose={handleBackToHub}
          initialView="lessons"
          initialRoomConfig={pendingRoomConfig?.gameType === 'image-word' ? pendingRoomConfig.data : undefined}
        />
      )}

      {selectedGame === 'word-scramble' && (
        <WordScramblePage
          onClose={handleBackToHub}
          flashcards={flashcards}
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🔀',
            role: currentUser.role === 'super_admin' ? 'super_admin' : currentUser.role as 'user' | 'vip' | 'admin',
          }}
          initialRoomConfig={pendingRoomConfig?.gameType === 'word-scramble' ? pendingRoomConfig.data : undefined}
        />
      )}
      </Suspense>

      {/* Floating Music Player - Always available when playing games */}
      {showMusicPlayer && (
        <FloatingMusicPlayer onClose={() => setShowMusicPlayer(false)} />
      )}
    </div>
  );
}
