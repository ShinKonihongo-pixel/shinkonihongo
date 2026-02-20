// Picture Guess Page - Main game page
// Setup is handled by Game Hub's unified modal. This page only manages: lobby → play → results
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PictureGuessLobby } from '../picture-guess/picture-guess-lobby';
import { PictureGuessPlay } from '../picture-guess/picture-guess-play';
import { PictureGuessResultsView } from '../picture-guess/picture-guess-results';
import { usePictureGuess } from '../../hooks/picture-guess';
import type { CreatePictureGuessData } from '../../types/picture-guess';
import type { JLPTLevel, Flashcard } from '../../types/flashcard';
import type { GameSession } from '../../types/user';
import '../picture-guess/picture-guess.css';

type PageView = 'lobby' | 'play' | 'results';

interface PictureGuessPageProps {
  onClose: () => void;
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards?: Flashcard[];
  initialView?: string;
  // XP tracking
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
  initialRoomConfig?: Record<string, unknown>;
  initialJoinCode?: string;
}

export const PictureGuessPage: React.FC<PictureGuessPageProps> = ({
  onClose,
  currentUser = { id: 'user-1', displayName: 'Player', avatar: '👤' },
  flashcards = [],
  onSaveGameSession,
  initialRoomConfig,
  initialJoinCode,
}) => {
  const [view, setView] = useState<PageView>('lobby');
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' } | null>(null);
  const gameSessionSaved = useRef(false);
  const createOnceRef = useRef(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const {
    game,
    gameResults,
    loading,
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
    isHost,
    currentPlayer,
    currentPuzzle,
    sortedPlayers,
    error,
  } = usePictureGuess({ currentUser, flashcards });

  // Auto-create room from unified setup (Game Hub modal) — guarded against StrictMode double-fire
  useEffect(() => {
    if (initialRoomConfig && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      const cfg = initialRoomConfig;
      createGame({
        title: (cfg.title as string) || 'Đuổi Hình Bắt Chữ',
        mode: 'multiplayer',
        jlptLevel: (cfg.jlptLevel as JLPTLevel) || 'N5',
        contentSource: 'flashcard',
        puzzleCount: (cfg.totalRounds as number) || 10,
        timePerPuzzle: (cfg.timePerQuestion as number) || 30,
        maxPlayers: (cfg.maxPlayers as number) || 10,
        allowHints: (cfg.hints as boolean) ?? true,
        speedBonus: (cfg.speedBonus as boolean) ?? true,
        penaltyWrongAnswer: (cfg.penaltyWrongAnswer as boolean) ?? false,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-join game from QR code
  useEffect(() => {
    if (initialJoinCode && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      joinGame(initialJoinCode).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartGame = useCallback(() => {
    startGame();
    setView('play');
  }, [startGame]);

  const handleLeaveGame = useCallback(() => {
    leavingRef.current = true;
    leaveGame();
    onClose();
  }, [leaveGame, onClose]);

  const handleAddBot = useCallback(() => {
    setNotification({ message: 'Bot sẽ tự động được thêm sau vài giây!', type: 'info' });
  }, []);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    onClose();
  }, [resetGame, onClose]);

  const handleExit = useCallback(() => {
    resetGame();
    onClose();
  }, [resetGame, onClose]);

  // Update view based on game status
  useEffect(() => {
    if (!game) return;

    if (game.status === 'finished' && gameResults) {
      setView('results');
    } else if (
      game.status === 'starting' ||
      game.status === 'showing' ||
      game.status === 'guessing' ||
      game.status === 'revealed'
    ) {
      setView('play');
    } else if (game.status === 'waiting') {
      setView('lobby');
    }
  }, [game, gameResults]);

  // Save game session when game finishes
  useEffect(() => {
    if (game?.status === 'finished' && !gameSessionSaved.current && onSaveGameSession && gameResults) {
      gameSessionSaved.current = true;
      const myResult = gameResults.rankings.find(p => p.odinhId === currentUser.id);
      if (myResult) {
        onSaveGameSession({
          date: new Date().toISOString().split('T')[0],
          gameTitle: 'Đuổi Hình Bắt Chữ',
          rank: myResult.rank,
          totalPlayers: gameResults.rankings.length,
          score: myResult.score,
          correctAnswers: myResult.correctGuesses,
          totalQuestions: gameResults.totalPuzzles,
        });
      }
    }
    if (!game || game.status !== 'finished') {
      gameSessionSaved.current = false;
    }
  }, [game, gameResults, currentUser.id, onSaveGameSession]);

  // Error state — creation/join failed
  if (!game && error) {
    return (
      <div className="picture-guess-page">
        <div className="game-loading-fallback">
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button onClick={onClose} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>Quay lại</button>
        </div>
      </div>
    );
  }

  // Loading state — game is being created/joined (skip if user is leaving)
  if (!game && !leavingRef.current && (loading || initialRoomConfig || initialJoinCode)) {
    return (
      <div className="picture-guess-page">
        <div className="game-loading-fallback">
          <div className="loading-spinner" />
          <p>Đang tạo phòng...</p>
        </div>
      </div>
    );
  }

  // No game and no pending creation → go back to hub
  if (!game && !loading) {
    onClose();
    return null;
  }

  return (
    <div className="picture-guess-page">
      {view === 'lobby' && game && (
        <PictureGuessLobby
          game={game}
          currentPlayerId={currentUser.id}
          onStartGame={handleStartGame}
          onAddBot={handleAddBot}
          onLeave={handleLeaveGame}
        />
      )}

      {view === 'play' && game && (
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
          onLeave={handleLeaveGame}
        />
      )}

      {view === 'results' && gameResults && (
        <PictureGuessResultsView
          results={gameResults}
          currentUserId={currentUser.id}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleExit}
        />
      )}

      {notification && (
        <div className={`game-notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="notification-text">{notification.message}</span>
          <button className="notification-close" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}
    </div>
  );
};
