// Golden Bell Page - Main page for the elimination quiz game
// Orchestrates all Golden Bell components based on game state

import { useState, useEffect } from 'react';
import { useGoldenBell } from '../../hooks/use-golden-bell';
import { GoldenBellMenu } from '../golden-bell/golden-bell-menu';
import { GoldenBellSetup } from '../golden-bell/golden-bell-setup';
import { GoldenBellLobby } from '../golden-bell/golden-bell-lobby';
import { GoldenBellPlay } from '../golden-bell/golden-bell-play';
import { GoldenBellResultsView } from '../golden-bell/golden-bell-results';
import type { CreateGoldenBellData, GoldenBellGame } from '../../types/golden-bell';
import type { Flashcard } from '../../types/flashcard';

// Simple user interface for props
interface GoldenBellUser {
  id: string;
  displayName?: string;
  avatar?: string;
  role?: string;
}

// Page view states
type PageView = 'menu' | 'setup' | 'lobby' | 'play' | 'results';

interface GoldenBellPageProps {
  currentUser: GoldenBellUser;
  flashcards: Flashcard[];
  initialJoinCode?: string;
}

export function GoldenBellPage({
  currentUser,
  flashcards,
  initialJoinCode,
}: GoldenBellPageProps) {
  const [view, setView] = useState<PageView>('menu');

  const {
    game,
    gameResults,
    availableRooms,
    loading,
    error,
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    aliveCount,
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    submitAnswer,
    revealAnswer,
    nextQuestion,
    resetGame,
    setError,
  } = useGoldenBell({
    currentUser: {
      id: currentUser.id,
      displayName: currentUser.displayName || 'Player',
      avatar: currentUser.avatar || '🔔',
    },
    flashcards,
  });

  // Handle initial join code from URL
  useEffect(() => {
    if (initialJoinCode && !game) {
      joinGame(initialJoinCode).catch(() => {
        setError('Không thể tham gia phòng với mã này');
      });
    }
  }, [initialJoinCode, game, joinGame, setError]);

  // Update view based on game state
  useEffect(() => {
    if (!game) {
      if (gameResults) {
        setView('results');
      } else if (view === 'lobby' || view === 'play') {
        setView('menu');
      }
      return;
    }

    switch (game.status) {
      case 'waiting':
        setView('lobby');
        break;
      case 'starting':
      case 'question':
      case 'answering':
      case 'revealing':
        setView('play');
        break;
      case 'finished':
        setView('results');
        break;
    }
  }, [game, gameResults, view]);

  // Handle create game from menu
  const handleCreateGame = () => {
    setView('setup');
  };

  // Handle join game from menu
  const handleJoinGame = async (code: string) => {
    try {
      await joinGame(code);
    } catch {
      // Error handled in hook
    }
  };

  // Handle room selection
  const handleSelectRoom = async (room: GoldenBellGame) => {
    try {
      await joinGame(room.code);
    } catch {
      // Error handled in hook
    }
  };

  // Handle game creation
  const handleGameCreation = async (data: CreateGoldenBellData) => {
    try {
      await createGame(data);
    } catch {
      // Error handled in hook
    }
  };

  // Handle back from setup
  const handleBackFromSetup = () => {
    setView('menu');
  };

  // Handle leave game
  const handleLeaveGame = () => {
    leaveGame();
    setView('menu');
  };

  // Handle play again
  const handlePlayAgain = () => {
    resetGame();
    setView('menu');
  };

  // Handle go home
  const handleGoHome = () => {
    resetGame();
    setView('menu');
  };

  return (
    <div className="golden-bell-page">
      {/* Error Toast */}
      {error && (
        <div className="golden-bell-error-toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Menu View */}
      {view === 'menu' && (
        <GoldenBellMenu
          availableRooms={availableRooms}
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          onSelectRoom={handleSelectRoom}
        />
      )}

      {/* Setup View */}
      {view === 'setup' && (
        <GoldenBellSetup
          onCreateGame={handleGameCreation}
          onBack={handleBackFromSetup}
          loading={loading}
        />
      )}

      {/* Lobby View */}
      {view === 'lobby' && game && (
        <GoldenBellLobby
          game={game}
          isHost={isHost}
          currentPlayerId={currentUser.id}
          onStart={startGame}
          onLeave={handleLeaveGame}
          onKickPlayer={kickPlayer}
        />
      )}

      {/* Play View */}
      {view === 'play' && game && (
        <GoldenBellPlay
          game={game}
          currentPlayer={currentPlayer}
          currentQuestion={currentQuestion}
          sortedPlayers={sortedPlayers}
          aliveCount={aliveCount}
          isHost={isHost}
          onSubmitAnswer={submitAnswer}
          onRevealAnswer={revealAnswer}
          onNextQuestion={nextQuestion}
          onLeave={handleLeaveGame}
        />
      )}

      {/* Results View */}
      {view === 'results' && gameResults && (
        <GoldenBellResultsView
          results={gameResults}
          currentPlayerId={currentUser.id}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="golden-bell-loading-overlay">
          <div className="loading-spinner bell-spinner" />
          <span>Đang xử lý...</span>
        </div>
      )}
    </div>
  );
}
