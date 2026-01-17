// Horse Racing Page - Professional horse racing game with track theme
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

interface HorseRacingUser {
  id: string;
  displayName?: string;
  avatar?: string;
}

type PageView = 'menu' | 'setup' | 'lobby' | 'play' | 'results';

interface HorseRacingPageProps {
  currentUser: HorseRacingUser;
  flashcards: Flashcard[];
  initialJoinCode?: string;
}

export function HorseRacingPage({
  currentUser,
  flashcards,
  initialJoinCode,
}: HorseRacingPageProps) {
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
      avatar: currentUser.avatar || '🏇',
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
    // Force horse type
    await createGame({ ...data, raceType: 'horse' });
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
      <div className="horse-racing-page">
        <div className="horse-racing-header">
          <div className="header-icon">🏇</div>
          <h1>Đua Ngựa</h1>
          <p>Phi nước đại cùng kiến thức tiếng Nhật!</p>
        </div>
        <RacingGameMenu
          raceType="horse"
          availableRooms={availableRooms.filter(r => r.settings.raceType === 'horse')}
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
      <div className="horse-racing-page">
        <RacingGameSetup
          raceType="horse"
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
      <div className="horse-racing-page">
        <RacingGameLobby
          game={game}
          isHost={isHost}
          selectedVehicle={selectedVehicle}
          loading={loading}
          onSelectVehicle={selectVehicle}
          onStartGame={handleStartGame}
          onLeaveGame={handleLeave}
        />
      </div>
    );
  }

  // Render Play
  if (view === 'play' && game) {
    // Countdown
    if (showCountdown) {
      return (
        <div className="horse-racing-page racing-active">
          <RaceCountdown
            raceType="horse"
            onComplete={handleCountdownComplete}
          />
        </div>
      );
    }

    // Mystery Box
    if (game.status === 'mystery_box' && currentQuestion?.isMysteryBox) {
      return (
        <div className="horse-racing-page racing-active">
          <RaceMysteryBox
            question={currentQuestion}
            raceType="horse"
            onOpenBox={openMysteryBox}
            onApplyFeature={applySpecialFeature}
          />
        </div>
      );
    }

    // Main Racing UI
    return (
      <div className="horse-racing-page racing-active">
        {/* Race Track */}
        <RaceTrack
          raceType="horse"
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
            raceType="horse"
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
            raceType="horse"
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
      <div className="horse-racing-page">
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
    <div className="horse-racing-page">
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Đang tải...</p>
      </div>
    </div>
  );
}
