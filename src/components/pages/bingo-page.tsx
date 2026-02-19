// Bingo Page — manages game state and renders lobby/play/results
// Entry: always via initialRoomConfig (create) or initialJoinCode (join)
// No intermediate menu — goes directly to lobby

import { useState, useEffect, useRef } from 'react';
import { useBingoGame } from '../../hooks/use-bingo-game';
import {
  BingoGameLobby,
  BingoGamePlay,
  BingoGameResults,
  BingoGameGuide,
} from '../bingo-game';
import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import type { GameSession } from '../../types/user';
import '../bingo-game/bingo-game.css';

interface BingoUser {
  id: string;
  displayName?: string;
  avatar?: string;
  role?: string;
}

type PageView = 'lobby' | 'play' | 'results';

interface BingoPageProps {
  currentUser: BingoUser;
  flashcards: Flashcard[];
  initialJoinCode?: string;
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
  initialRoomConfig?: Record<string, unknown>;
  onGoHome?: () => void;
}

export function BingoPage({
  currentUser,
  flashcards,
  initialJoinCode,
  onSaveGameSession,
  initialRoomConfig,
  onGoHome,
}: BingoPageProps) {
  const [view, setView] = useState<PageView>('lobby');
  const [showGuide, setShowGuide] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const gameSessionSaved = useRef(false);
  const createOnceRef = useRef(false);

  const {
    game,
    gameResults,
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
    startQuestion,
    submitAnswer,
    revealAndSpin,
    completeSpin,
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
      role: currentUser.role,
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

  // Auto-create room from Game Hub unified setup (guarded against StrictMode double-fire)
  useEffect(() => {
    if (initialRoomConfig && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      const cfg = initialRoomConfig;
      createGame({
        title: (cfg.title as string) || 'Bingo Vui Vẻ',
        maxPlayers: (cfg.maxPlayers as number) || 10,
        skillsEnabled: (cfg.skills as boolean) ?? true,
        timePerQuestion: (cfg.timePerQuestion as number) || 15,
        jlptLevel: (cfg.jlptLevel as JLPTLevel) || 'N5',
        selectedLessons: (cfg.selectedLessons as string[]) || [],
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update view based on game state
  useEffect(() => {
    if (!game) {
      if (gameResults) {
        setView('results');
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
      case 'question_phase':
      case 'spin_phase':
      case 'skill_phase':
        setView('play');
        setShowCountdown(false);
        break;
      case 'finished':
        setView('results');
        break;
    }
  }, [game, gameResults]);

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

  // Save game session when game finishes (XP tracking)
  useEffect(() => {
    if (game?.status === 'finished' && !gameSessionSaved.current && onSaveGameSession && gameResults) {
      gameSessionSaved.current = true;
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
    if (!game || game.status !== 'finished') {
      gameSessionSaved.current = false;
    }
  }, [game, gameResults, currentUser.id, onSaveGameSession]);

  const handleLeaveGame = () => {
    leaveGame();
    onGoHome?.();
  };

  const handlePlayAgain = () => {
    resetGame();
  };

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

  return (
    <div className="bingo-page">
      {/* Error Toast */}
      {error && (
        <div className="golden-bell-error-toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Loading state while creating/joining */}
      {!game && loading && (
        <div className="game-loading-fallback">
          <div className="loading-spinner" />
          <p>Đang tạo phòng...</p>
        </div>
      )}

      {/* Lobby View */}
      {view === 'lobby' && game && (
        <BingoGameLobby
          game={game}
          isHost={isHost}
          currentPlayerId={currentUser.id}
          loading={loading}
          onStartGame={startGame}
          onLeaveGame={handleLeaveGame}
          onKickPlayer={kickPlayer}
        />
      )}

      {/* Play View */}
      {view === 'play' && game && (
        <div className="bingo-page playing">
          <BingoGamePlay
            game={game}
            currentPlayer={currentPlayer}
            sortedPlayers={sortedPlayers}
            isHost={isHost}
            isSkillPhase={isSkillPhase}
            onStartQuestion={startQuestion}
            onSubmitAnswer={submitAnswer}
            onRevealAndSpin={revealAndSpin}
            onCompleteSpin={completeSpin}
            onClaimBingo={claimBingo}
            onUseSkill={useSkill}
            onSkipSkill={skipSkill}
            onLeave={handleLeaveGame}
            onShowGuide={() => setShowGuide(true)}
          />
        </div>
      )}

      {/* Results View */}
      {view === 'results' && gameResults && (
        <BingoGameResults
          results={gameResults}
          onPlayAgain={handlePlayAgain}
          onGoHome={() => onGoHome?.()}
        />
      )}

      {guideOverlay}
    </div>
  );
}
