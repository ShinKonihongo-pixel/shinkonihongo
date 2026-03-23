// Game Hub Page - Unified game center orchestrating all mini-games
// Manages game selection and routes to appropriate game pages
// Uses lazy loading for game pages to improve initial load performance

import { useState, useCallback, lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
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
  KANJI_DROP_SETUP_CONFIG,
  QUIZ_BATTLE_SETUP_CONFIG,
} from '../game-hub/room-setup/game-configs';
import { GameCreate } from '../quiz-game/game-create';
import { KanjiBattleSetup } from '../kanji-battle/kanji-battle-setup';
import { FloatingMusicPlayer } from '../game-hub/floating-music-player';
import '../game-hub/game-hub.css';
import '../game-hub/game-room-setup.css';
import '../game-hub/race-game-v2.css';
import '../game-hub/game-modals.css';

// Modal-specific error boundary that captures and displays the error without crashing the page
class ModalErrorBoundary extends Component<
  { children: ReactNode; onClose: () => void; gameKey: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onClose: () => void; gameKey: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ModalErrorBoundary]', error.message, error.stack, errorInfo.componentStack);
  }
  componentDidUpdate(prevProps: { gameKey: string }) {
    if (prevProps.gameKey !== this.props.gameKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rm-overlay" onClick={this.props.onClose}>
          <div className="rm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 0.75rem', color: '#f87171' }}>Lỗi hiển thị modal</h3>
              <p style={{ margin: '0 0 0.5rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                {this.state.error?.message || 'Lỗi không xác định'}
              </p>
              <pre style={{
                margin: '0 0 1rem', padding: '0.5rem', borderRadius: '6px',
                background: 'rgba(0,0,0,0.3)', color: '#fca5a5', fontSize: '0.7rem',
                textAlign: 'left', overflow: 'auto', maxHeight: '120px', whiteSpace: 'pre-wrap',
              }}>
                {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
              </pre>
              <button
                onClick={this.props.onClose}
                style={{
                  padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none',
                  background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                  color: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
const KanjiDropPage = lazy(() => import('./kanji-drop-page').then(m => ({ default: m.KanjiDropPage })));
const QuizBattlePage = lazy(() => import('./quiz-battle-page').then(m => ({ default: m.QuizBattlePage })));

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
  kanjiCards?: import('../../types/kanji').KanjiCard[];
  jlptQuestions: JLPTQuestion[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  settings: AppSettings;
  friends?: FriendWithUser[];
  onInviteFriend?: (gameId: string, gameCode: string, gameTitle: string, friendId: string) => Promise<boolean>;
  // Initial game selection (from URL params)
  initialGame?: GameType | null;
  initialJoinCode?: string | null;
  // Collapse/expand sidebar when entering/leaving game
  onCollapseSidebar?: () => void;
  onExpandSidebar?: () => void;
  // Save game session for XP tracking
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
}

export function GameHubPage({
  currentUser,
  flashcards,
  kanjiCards = [],
  jlptQuestions,
  getLessonsByLevel,
  getChildLessons,
  settings,
  friends = [],
  onInviteFriend,
  initialGame,
  initialJoinCode,
  onCollapseSidebar,
  onExpandSidebar,
  onSaveGameSession,
}: GameHubPageProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(initialGame || null);
  const [joinCode, setJoinCode] = useState<string | null>(initialJoinCode || null);
  const [showMusicPlayer, setShowMusicPlayer] = useState(true);
  const [setupModalGame, setSetupModalGame] = useState<GameType | null>(null);
  const [pendingRoomConfig, setPendingRoomConfig] = useState<{ gameType: GameType; data: Record<string, unknown> } | null>(null);
  const [returnToWaitingRoom, setReturnToWaitingRoom] = useState(false);

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
    setReturnToWaitingRoom(false);
    onExpandSidebar?.();
  }, [onExpandSidebar]);

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
            userRole={currentUser?.role}
            getAvailableQuestionCount={(level) =>
              flashcards.filter(c => c.jlptLevel === level).length
            }
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
            getAvailableQuestionCount={(level) =>
              flashcards.filter(c => c.jlptLevel === level).length
            }
            getLessonsByLevel={getLessonsByLevel}
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
            userRole={currentUser?.role}
          />
        );
      case 'kanji-battle':
        return (
          <KanjiBattleSetup
            onCreateGame={handleKanjiBattleCreate}
            onBack={closeSetupModal}
          />
        );
      case 'kanji-drop':
        return (
          <GameRoomSetup
            gameType="kanji-drop"
            config={KANJI_DROP_SETUP_CONFIG}
            onCreateRoom={handleStandardRoomCreate('kanji-drop')}
            onBack={closeSetupModal}
            getAvailableQuestionCount={(level) =>
              kanjiCards.filter(c => c.jlptLevel === level).length
            }
            getLessonsByLevel={getLessonsByLevel}
          />
        );
      case 'quiz-battle':
        return (
          <GameRoomSetup
            gameType="quiz-battle"
            config={QUIZ_BATTLE_SETUP_CONFIG}
            onCreateRoom={handleStandardRoomCreate('quiz-battle')}
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
          userRole={currentUser?.role}
          initialView={returnToWaitingRoom ? 'waiting-room' : 'games'}
        />
        <ModalErrorBoundary gameKey={setupModalGame ?? ''} onClose={closeSetupModal}>
          {renderSetupModal()}
        </ModalErrorBoundary>
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
          onGoHome={handleBackToHub}
          initialJoinCode={joinCode}
          onJoinCodeUsed={() => setJoinCode(null)}
          settings={settings}
          friends={friends}
          onInviteFriend={onInviteFriend}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'quiz' ? pendingRoomConfig.data : undefined}
          userRole={currentUser.role}
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
          onGoHome={handleBackToHub}
        />
      )}

      {selectedGame === 'picture-guess' && (
        <PictureGuessPage
          onClose={handleBackToHub}
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🖼️',
            role: currentUser.role,
          }}
          flashcards={flashcards}
          initialJoinCode={joinCode || undefined}
          onSaveGameSession={onSaveGameSession}
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
          flashcards={flashcards}
          initialJoinCode={joinCode || undefined}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'bingo' ? pendingRoomConfig.data : undefined}
          onGoHome={handleBackToHub}
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
          initialJoinCode={joinCode || undefined}
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
          initialJoinCode={joinCode || undefined}
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
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🖼️',
            role: currentUser.role,
          }}
          initialJoinCode={joinCode || undefined}
          onSaveGameSession={onSaveGameSession}
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
            role: currentUser.role,
          }}
          initialJoinCode={joinCode || undefined}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'word-scramble' ? pendingRoomConfig.data : undefined}
        />
      )}

      {selectedGame === 'kanji-drop' && (
        <KanjiDropPage
          onClose={handleBackToHub}
          kanjiCards={kanjiCards}
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🀄',
            role: currentUser.role,
          }}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'kanji-drop' ? pendingRoomConfig.data : undefined}
          initialJoinCode={joinCode || undefined}
        />
      )}

      {selectedGame === 'quiz-battle' && (
        <QuizBattlePage
          onClose={handleBackToHub}
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '⚔️',
            role: currentUser.role,
            jlptLevel: currentUser.jlptLevel,
          }}
          jlptQuestions={jlptQuestions}
          onSaveGameSession={onSaveGameSession}
          initialRoomConfig={pendingRoomConfig?.gameType === 'quiz-battle' ? pendingRoomConfig.data : undefined}
          initialJoinCode={joinCode || undefined}
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
