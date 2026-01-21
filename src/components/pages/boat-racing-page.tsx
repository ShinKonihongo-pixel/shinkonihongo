// Boat Racing Page - Professional boat racing game with water theme
// Complete game flow: Menu -> Setup -> Lobby -> Race -> Results

import { useState, useEffect, useCallback } from 'react';
import { useRacingGame } from '../../hooks/use-racing-game';
import { RacingGameMenu } from '../racing-game/racing-game-menu';
import { RacingGameSetup } from '../racing-game/racing-game-setup';
import { RacingGameLobby } from '../racing-game/racing-game-lobby';
import { RacingGameResults } from '../racing-game/racing-game-results';
import {
  RaceCountdown,
  RaceTrack,
  RaceQuestion,
  RaceMysteryBox,
  RacePlayerStats,
} from '../racing-game/shared';
import type { CreateRacingGameData } from '../../types/racing-game';
import type { Flashcard } from '../../types/flashcard';

interface BoatRacingUser {
  id: string;
  displayName?: string;
  avatar?: string;
  role?: string;
}

type PageView = 'menu' | 'setup' | 'lobby' | 'play' | 'results';

interface BoatRacingPageProps {
  currentUser: BoatRacingUser;
  flashcards: Flashcard[];
  initialJoinCode?: string;
}

export function BoatRacingPage({
  currentUser,
  flashcards,
  initialJoinCode,
}: BoatRacingPageProps) {
  const [view, setView] = useState<PageView>('menu');
  const [showCountdown, setShowCountdown] = useState(false);

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
    kickPlayer,
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
      avatar: currentUser.avatar || '🚣',
    },
    flashcards,
  });

  // Handle initial join code
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
        setShowCountdown(true);
        setView('play');
        break;
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

  // Handlers
  const handleCreateGame = useCallback(() => {
    setView('setup');
  }, []);

  const handleSetupComplete = useCallback(async (data: CreateRacingGameData) => {
    // Force boat type
    await createGame({ ...data, raceType: 'boat' });
    setView('lobby');
  }, [createGame]);

  const handleStartGame = useCallback(async () => {
    await startGame();
  }, [startGame]);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
  }, []);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setView('menu');
  }, [resetGame]);

  const handleLeave = useCallback(() => {
    leaveGame();
    setView('menu');
  }, [leaveGame]);

  // Get current player position
  const currentPosition = currentPlayer
    ? sortedPlayers.findIndex(p => p.odinhId === currentPlayer.odinhId) + 1
    : 0;

  // Render Menu
  if (view === 'menu') {
    return (
      <div className="boat-racing-page">
        <div className="boat-racing-header">
          <div className="header-icon">🚣</div>
          <h1>Đua Thuyền</h1>
          <p>Vượt sóng cùng kiến thức tiếng Nhật!</p>
        </div>
        <RacingGameMenu
          raceType="boat"
          availableRooms={availableRooms.filter(r => r.settings.raceType === 'boat')}
          loading={loading}
          error={error}
          onCreateGame={handleCreateGame}
          onJoinGame={joinGame}
        />
      </div>
    );
  }

  // Render Setup
  if (view === 'setup') {
    return (
      <div className="boat-racing-page">
        <RacingGameSetup
          raceType="boat"
          selectedVehicle={selectedVehicle}
          loading={loading}
          error={error}
          onSelectVehicle={selectVehicle}
          onCreateGame={handleSetupComplete}
          onCancel={() => setView('menu')}
        />
      </div>
    );
  }

  // Render Lobby
  if (view === 'lobby' && game) {
    return (
      <div className="boat-racing-page">
        <RacingGameLobby
          game={game}
          isHost={isHost}
          currentPlayerId={currentUser.id}
          selectedVehicle={selectedVehicle}
          loading={loading}
          onSelectVehicle={selectVehicle}
          onStartGame={handleStartGame}
          onLeaveGame={handleLeave}
          onKickPlayer={kickPlayer}
        />
      </div>
    );
  }

  // Render Play
  if (view === 'play' && game) {
    // Countdown
    if (showCountdown) {
      return (
        <div className="boat-racing-page racing-active">
          <RaceCountdown
            raceType="boat"
            onComplete={handleCountdownComplete}
          />
        </div>
      );
    }

    // Mystery Box
    if (game.status === 'mystery_box' && currentQuestion?.isMysteryBox) {
      return (
        <div className="boat-racing-page racing-active">
          <RaceMysteryBox
            question={currentQuestion}
            raceType="boat"
            onOpenBox={openMysteryBox}
            onApplyFeature={applySpecialFeature}
          />
        </div>
      );
    }

    // Main Racing UI
    return (
      <div className="boat-racing-page racing-active">
        {/* Race Track */}
        <RaceTrack
          raceType="boat"
          players={sortedPlayers}
          currentPlayerId={currentPlayer?.odinhId}
          trackLength={game.settings.trackLength}
          currentQuestion={game.currentQuestionIndex + 1}
          totalQuestions={game.questions.length}
        />

        {/* Question Section */}
        {currentQuestion && (game.status === 'question' || game.status === 'answering' || game.status === 'revealing') && (
          <RaceQuestion
            question={currentQuestion}
            raceType="boat"
            status={game.status}
            isHost={isHost}
            hasAnswered={currentPlayer?.currentAnswer !== undefined}
            onSubmitAnswer={submitAnswer}
            onRevealAnswer={revealAnswer}
            onNextQuestion={nextQuestion}
          />
        )}

        {/* Player Stats */}
        {currentPlayer && (
          <RacePlayerStats
            player={currentPlayer}
            raceType="boat"
            position={currentPosition}
            totalPlayers={sortedPlayers.length}
          />
        )}
      </div>
    );
  }

  // Render Results
  if (view === 'results' && gameResults) {
    return (
      <div className="boat-racing-page">
        <RacingGameResults
          results={gameResults}
          onPlayAgain={handlePlayAgain}
          onGoHome={handlePlayAgain}
        />
      </div>
    );
  }

  // Loading state
  return (
    <div className="boat-racing-page">
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Đang tải...</p>
      </div>
    </div>
  );
}
