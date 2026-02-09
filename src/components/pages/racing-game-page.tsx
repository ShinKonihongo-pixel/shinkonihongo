// Racing Game Page - Main page for boat/horse racing game
// Orchestrates all racing game components based on game state

import { useState, useEffect } from 'react';
import { useRacingGame } from '../../hooks/use-racing-game';
import { RacingGameMenu } from '../racing-game/racing-game-menu';
import { RacingGameSetup } from '../racing-game/racing-game-setup';
import { RacingGameLobby } from '../racing-game/racing-game-lobby';
import { RacingGamePlay } from '../racing-game/racing-game-play';
import { RacingGameResults } from '../racing-game/racing-game-results';
import type { VehicleType, CreateRacingGameData, RacingGame } from '../../types/racing-game';
import type { Flashcard } from '../../types/flashcard';
// Simple user interface for racing game props
interface RacingUser {
  id: string;
  displayName?: string;
  avatar?: string;
}

// Page view states
type PageView = 'menu' | 'setup' | 'lobby' | 'play' | 'results';

interface RacingGamePageProps {
  currentUser: RacingUser;
  flashcards: Flashcard[];
  initialJoinCode?: string;
  racingType?: 'boat' | 'horse';
}

export function RacingGamePage({
  currentUser,
  flashcards,
  initialJoinCode,
  racingType = 'boat',
}: RacingGamePageProps) {
  const [view, setView] = useState<PageView>('menu');
  const [selectedRaceType, setSelectedRaceType] = useState<VehicleType>(racingType);

  const {
    game,
    gameResults,
    availableRooms,
    loading,
    error,
    selectedVehicle,
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    createGame,
    joinGame,
    leaveGame,
    startGame,
    submitAnswer,
    revealAnswer,
    nextQuestion,
    openMysteryBox,
    applySpecialFeature,
    selectVehicle,
    resetGame,
    setError,
  } = useRacingGame({
    currentUser: {
      id: currentUser.id,
      displayName: currentUser.displayName || 'Player',
      avatar: currentUser.avatar || '🎮',
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
      case 'racing':
      case 'question':
      case 'answering':
      case 'revealing':
      case 'mystery_box':
        setView('play');
        break;
      case 'finished':
        setView('results');
        break;
    }
  }, [game, gameResults, view]);

  // Handle create game from menu
  const handleCreateGame = (raceType: VehicleType) => {
    setSelectedRaceType(raceType);
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
  const handleSelectRoom = async (room: RacingGame) => {
    try {
      await joinGame(room.code);
    } catch {
      // Error handled in hook
    }
  };

  // Handle game creation
  const handleGameCreation = async (data: CreateRacingGameData) => {
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
    <div className="racing-game-page">
      {/* Error Toast */}
      {error && (
        <div className="racing-error-toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Menu View */}
      {view === 'menu' && (
        <RacingGameMenu
          availableRooms={availableRooms}
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          onSelectRoom={handleSelectRoom}
        />
      )}

      {/* Setup View */}
      {view === 'setup' && (
        <RacingGameSetup
          raceType={selectedRaceType}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={selectVehicle}
          onCreateGame={handleGameCreation}
          onCancel={handleBackFromSetup}
          loading={loading}
        />
      )}

      {/* Lobby View */}
      {view === 'lobby' && game && (
        <RacingGameLobby
          game={game}
          isHost={isHost}
          currentPlayerId={currentUser.id}
          onStart={startGame}
          onLeave={handleLeaveGame}
        />
      )}

      {/* Play View */}
      {view === 'play' && game && (
        <RacingGamePlay
          game={game}
          currentPlayer={currentPlayer}
          currentQuestion={currentQuestion}
          sortedPlayers={sortedPlayers}
          isHost={isHost}
          onSubmitAnswer={submitAnswer}
          onRevealAnswer={revealAnswer}
          onNextQuestion={nextQuestion}
          onOpenMysteryBox={openMysteryBox}
          onApplyFeature={applySpecialFeature}
          onLeave={handleLeaveGame}
        />
      )}

      {/* Results View */}
      {view === 'results' && gameResults && (
        <RacingGameResults
          results={gameResults}
          currentPlayerId={currentUser.id}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="racing-loading-overlay">
          <div className="loading-spinner" />
          <span>Đang xử lý...</span>
        </div>
      )}
    </div>
  );
}
