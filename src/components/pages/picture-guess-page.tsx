// Picture Guess Page - Main page orchestrating all game components
// Manages view state and routes to appropriate game phase

import { useState, useCallback } from 'react';
import { usePictureGuess } from '../../hooks/use-picture-guess';
import { PictureGuessMenu } from '../picture-guess/picture-guess-menu';
import { PictureGuessSetup } from '../picture-guess/picture-guess-setup';
import { PictureGuessLobby } from '../picture-guess/picture-guess-lobby';
import { PictureGuessPlay } from '../picture-guess/picture-guess-play';
import { PictureGuessResultsView } from '../picture-guess/picture-guess-results';
import type { CreatePictureGuessData } from '../../types/picture-guess';
import type { CurrentUser } from '../../types/user';
import type { Flashcard } from '../../types/flashcard';

// View state for page routing
type ViewState = 'menu' | 'setup-single' | 'setup-multi' | 'lobby' | 'playing' | 'results';

interface PictureGuessPageProps {
  currentUser: CurrentUser | null;
  flashcards: Flashcard[];
}

export function PictureGuessPage({ currentUser, flashcards }: PictureGuessPageProps) {
  const [view, setView] = useState<ViewState>('menu');

  // Initialize hook with current user
  const {
    game,
    gameResults,
    loading,
    error,
    isHost,
    currentPlayer,
    currentPuzzle,
    sortedPlayers,
    createGame,
    joinGame,
    leaveGame,
    startGame,
    useHint,
    getHintContent,
    submitGuess,
    revealAnswer,
    nextPuzzle,
    resetGame,
  } = usePictureGuess({
    currentUser: currentUser ? {
      id: currentUser.id,
      displayName: currentUser.displayName || currentUser.username,
      avatar: currentUser.avatar || '🎮',
    } : {
      id: 'guest',
      displayName: 'Guest',
      avatar: '👤',
    },
    flashcards,
  });

  // Handle creating a game
  const handleCreate = useCallback(async (data: CreatePictureGuessData) => {
    await createGame(data);
    setView('lobby');
  }, [createGame]);

  // Handle joining a game
  const handleJoin = useCallback(async (code: string) => {
    try {
      await joinGame(code);
      setView('lobby');
    } catch {
      // Error is handled by hook
    }
  }, [joinGame]);

  // Handle starting the game
  const handleStart = useCallback(() => {
    startGame();
    setView('playing');
  }, [startGame]);

  // Handle leaving the game
  const handleLeave = useCallback(() => {
    leaveGame();
    setView('menu');
  }, [leaveGame]);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    resetGame();
    setView('menu');
  }, [resetGame]);

  // Determine current view based on game state
  const getCurrentView = (): ViewState => {
    if (gameResults) return 'results';
    if (game) {
      if (game.status === 'waiting') return 'lobby';
      if (game.status !== 'finished') return 'playing';
      return 'results';
    }
    return view;
  };

  const currentView = getCurrentView();

  // No user logged in
  if (!currentUser) {
    return (
      <div className="picture-guess-page">
        <div className="pg-login-prompt">
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập để chơi Đuổi Hình Bắt Chữ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="picture-guess-page">
      {/* Menu View */}
      {currentView === 'menu' && (
        <PictureGuessMenu
          onStartSingle={() => setView('setup-single')}
          onCreateMultiplayer={() => setView('setup-multi')}
          onJoinGame={handleJoin}
          loading={loading}
          error={error}
        />
      )}

      {/* Setup View - Single Player */}
      {currentView === 'setup-single' && (
        <PictureGuessSetup
          mode="single"
          onBack={() => setView('menu')}
          onCreate={handleCreate}
          loading={loading}
        />
      )}

      {/* Setup View - Multiplayer */}
      {currentView === 'setup-multi' && (
        <PictureGuessSetup
          mode="multiplayer"
          onBack={() => setView('menu')}
          onCreate={handleCreate}
          loading={loading}
        />
      )}

      {/* Lobby View */}
      {currentView === 'lobby' && game && (
        <PictureGuessLobby
          game={game}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onStart={handleStart}
          onLeave={handleLeave}
        />
      )}

      {/* Playing View */}
      {currentView === 'playing' && game && (
        <PictureGuessPlay
          game={game}
          currentPlayer={currentPlayer}
          currentPuzzle={currentPuzzle}
          sortedPlayers={sortedPlayers}
          isHost={isHost}
          onUseHint={useHint}
          getHintContent={getHintContent}
          onSubmitGuess={submitGuess}
          onRevealAnswer={revealAnswer}
          onNextPuzzle={nextPuzzle}
          onLeave={handleLeave}
        />
      )}

      {/* Results View */}
      {currentView === 'results' && gameResults && (
        <PictureGuessResultsView
          results={gameResults}
          currentUserId={currentUser.id}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handlePlayAgain}
        />
      )}
    </div>
  );
}
