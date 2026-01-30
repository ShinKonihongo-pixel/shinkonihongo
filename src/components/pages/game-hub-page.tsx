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
import { GameSelector } from '../game-hub/game-selector';
import { FloatingMusicPlayer } from '../game-hub/floating-music-player';

// Lazy load game pages for code splitting
const QuizGamePage = lazy(() => import('./quiz-game-page').then(m => ({ default: m.QuizGamePage })));
const GoldenBellPage = lazy(() => import('./golden-bell-page').then(m => ({ default: m.GoldenBellPage })));
const PictureGuessPage = lazy(() => import('./picture-guess-page').then(m => ({ default: m.PictureGuessPage })));
const BingoPage = lazy(() => import('./bingo-page').then(m => ({ default: m.BingoPage })));
const SpeedQuizPage = lazy(() => import('./speed-quiz-page').then(m => ({ default: m.SpeedQuizPage })));
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

  // Handle game selection - also collapse sidebar
  const handleSelectGame = useCallback((game: GameType) => {
    setSelectedGame(game);
    setJoinCode(null);
    onCollapseSidebar?.();
  }, [onCollapseSidebar]);

  // Handle quick join with code - also collapse sidebar
  const handleQuickJoin = useCallback((gameType: GameType, code: string) => {
    setSelectedGame(gameType);
    setJoinCode(code);
    onCollapseSidebar?.();
  }, [onCollapseSidebar]);

  // Return to game selector
  const handleBackToHub = useCallback(() => {
    setSelectedGame(null);
    setJoinCode(null);
  }, []);

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
        />
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
        />
      )}

      {selectedGame === 'picture-guess' && (
        <PictureGuessPage
          currentUser={currentUser}
          flashcards={flashcards}
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
        />
      )}

      {selectedGame === 'speed-quiz' && (
        <SpeedQuizPage
          onClose={handleBackToHub}
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '⚡',
            role: currentUser.role,
          }}
          flashcards={flashcards}
          initialView={joinCode ? 'menu' : 'setup'}
          onSaveGameSession={onSaveGameSession}
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
