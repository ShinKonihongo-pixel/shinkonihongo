// Bingo Page - Main page for Bingo game
// Complete game flow: Menu -> Setup -> Lobby -> Play -> Results

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBingoGame } from '../../hooks/use-bingo-game';
import {
  BingoGameMenu,
  BingoGameSetup,
  BingoGameLobby,
  BingoGamePlay,
  BingoGameResults,
  BingoGameGuide,
} from '../bingo-game';
import type { CreateBingoGameData } from '../../types/bingo-game';
import type { GameSession } from '../../types/user';

interface BingoUser {
  id: string;
  displayName?: string;
  avatar?: string;
  role?: string;
}

type PageView = 'menu' | 'setup' | 'lobby' | 'play' | 'results';

interface BingoPageProps {
  currentUser: BingoUser;
  initialJoinCode?: string;
  initialView?: PageView;
  // XP tracking
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
}

export function BingoPage({
  currentUser,
  initialJoinCode,
  initialView = 'menu',
  onSaveGameSession,
}: BingoPageProps) {
  const [view, setView] = useState<PageView>(initialView);
  const [showGuide, setShowGuide] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const gameSessionSaved = useRef(false);

  const {
    game,
    gameResults,
    availableRooms,
    loading,
    error,
    isHost,
    currentPlayer,
    sortedPlayers,
    isSkillPhase,
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    drawNumber,
    claimBingo,
    useSkill,
    skipSkill,
    resetGame,
    setError,
  } = useBingoGame({
    currentUser: {
      id: currentUser.id,
      displayName: currentUser.displayName || 'Player',
      avatar: currentUser.avatar || '🎯',
    },
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
        setCountdown(3);
        break;
      case 'playing':
      case 'skill_phase':
        setView('play');
        setShowCountdown(false);
        break;
      case 'finished':
        setView('results');
        break;
    }
  }, [game, gameResults, view]);

  // Countdown effect
  useEffect(() => {
    if (!showCountdown) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown]);

  // Save game session when game finishes (for XP tracking)
  useEffect(() => {
    if (game?.status === 'finished' && !gameSessionSaved.current && onSaveGameSession && gameResults) {
      gameSessionSaved.current = true;

      // Find current player's result from rankings
      const myResult = gameResults.rankings.find(p => p.odinhId === currentUser.id);
      if (myResult) {
        onSaveGameSession({
          date: new Date().toISOString().split('T')[0],
          gameTitle: 'Bingo',
          rank: myResult.rank,
          totalPlayers: gameResults.totalPlayers,
          score: myResult.completedRows * 100 + myResult.markedCount * 10,
          correctAnswers: myResult.completedRows,
          totalQuestions: gameResults.totalTurns,
        });
      }
    }

    // Reset flag when game changes (new game)
    if (!game || game.status !== 'finished') {
      gameSessionSaved.current = false;
    }
  }, [game, gameResults, currentUser.id, onSaveGameSession]);

  // Handlers
  const handleCreateGame = useCallback(() => {
    setView('setup');
  }, []);

  const handleSetupComplete = useCallback(async (data: CreateBingoGameData) => {
    await createGame(data);
    setView('lobby');
  }, [createGame]);

  const handleStartGame = useCallback(async () => {
    await startGame();
  }, [startGame]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setView('menu');
  }, [resetGame]);

  const handleLeave = useCallback(() => {
    leaveGame();
    setView('menu');
  }, [leaveGame]);

  // Render countdown
  if (showCountdown) {
    return (
      <div className="bingo-page">
        <div className="bingo-countdown">
          <div className="countdown-circle">
            <span className="countdown-number">{countdown}</span>
          </div>
          <h2>Chuẩn Bị!</h2>
        </div>
      </div>
    );
  }

  // Render Guide overlay
  const guideOverlay = showGuide ? (
    <BingoGameGuide onClose={() => setShowGuide(false)} />
  ) : null;

  // Render Menu
  if (view === 'menu') {
    return (
      <div className="bingo-page">
        <div className="bingo-header">
          <div className="header-icon">🎱</div>
          <h1>Bingo</h1>
          <p>Bốc số may mắn - Ai BINGO trước thắng!</p>
        </div>
        <BingoGameMenu
          availableRooms={availableRooms}
          loading={loading}
          error={error}
          onCreateGame={handleCreateGame}
          onJoinGame={joinGame}
          onShowGuide={() => setShowGuide(true)}
        />
        {guideOverlay}
      </div>
    );
  }

  // Render Setup
  if (view === 'setup') {
    return (
      <div className="bingo-page">
        <BingoGameSetup
          loading={loading}
          error={error}
          onCreateGame={handleSetupComplete}
          onCancel={() => setView('menu')}
        />
        {guideOverlay}
      </div>
    );
  }

  // Render Lobby
  if (view === 'lobby' && game) {
    return (
      <div className="bingo-page">
        <BingoGameLobby
          game={game}
          isHost={isHost}
          currentPlayerId={currentUser.id}
          loading={loading}
          onStartGame={handleStartGame}
          onLeaveGame={handleLeave}
          onKickPlayer={kickPlayer}
        />
        {guideOverlay}
      </div>
    );
  }

  // Render Play
  if (view === 'play' && game) {
    return (
      <div className="bingo-page playing">
        <BingoGamePlay
          game={game}
          currentPlayer={currentPlayer}
          sortedPlayers={sortedPlayers}
          isHost={isHost}
          isSkillPhase={isSkillPhase}
          onDrawNumber={drawNumber}
          onClaimBingo={claimBingo}
          onUseSkill={useSkill}
          onSkipSkill={skipSkill}
          onLeave={handleLeave}
          onShowGuide={() => setShowGuide(true)}
        />
        {guideOverlay}
      </div>
    );
  }

  // Render Results
  if (view === 'results' && gameResults) {
    return (
      <div className="bingo-page">
        <BingoGameResults
          results={gameResults}
          onPlayAgain={handlePlayAgain}
          onGoHome={handlePlayAgain}
        />
        {guideOverlay}
      </div>
    );
  }

  // Loading state
  return (
    <div className="bingo-page">
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Đang tải...</p>
      </div>
    </div>
  );
}
