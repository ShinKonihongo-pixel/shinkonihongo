// Image-Word Game Page
// Setup is handled by Game Hub's unified modal. This page only manages: lobby → play → results
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageWordGamePlay, ImageWordResults, ImageWordLobby } from '../image-word';
import { useImageWordMultiplayer } from '../../hooks/image-word';
import { useImageWordGame } from '../../hooks/use-image-word-game';
import type { ImageWordLesson } from '../../types/image-word';
import type { GameSession } from '../../types/user';

type PageView = 'lobby' | 'play' | 'results';

interface ImageWordPageProps {
  onClose: () => void;
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  // XP tracking
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
  initialRoomConfig?: Record<string, unknown>;
  initialJoinCode?: string;
}

export const ImageWordPage: React.FC<ImageWordPageProps> = ({
  onClose,
  currentUser = { id: 'user-1', displayName: 'Player', avatar: '👤' },
  onSaveGameSession,
  initialRoomConfig,
  initialJoinCode,
}) => {
  const [view, setView] = useState<PageView>('lobby');
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' } | null>(null);
  const gameSessionSaved = useRef(false);
  const createOnceRef = useRef(false);
  const gameStartedRef = useRef(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Multiplayer lobby/room management
  const {
    game,
    loading,
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    addBot,
    resetGame,
    error,
  } = useImageWordMultiplayer({ currentUser });

  // Single-player gameplay engine (used within multiplayer room)
  const {
    gameState,
    gameResult,
    wrongAnimation,
    startGame: startLocalGame,
    selectImage,
    selectWord,
    resetGame: resetLocalGame,
  } = useImageWordGame();

  // Auto-create room from unified setup (Game Hub modal) — guarded against StrictMode double-fire
  useEffect(() => {
    if (initialRoomConfig && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      const cfg = initialRoomConfig;
      createGame({
        title: (cfg.title as string) || 'Nối Hình - Từ',
        maxPlayers: (cfg.maxPlayers as number) || 4,
        totalPairs: (cfg.totalRounds as number) || 10,
        timeLimit: (cfg.timePerQuestion as number) || 120,
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

  // Bridge: when multiplayer game starts playing, create local game from room's pairs
  useEffect(() => {
    if (game?.status === 'playing' && !gameStartedRef.current && game.pairs.length > 0) {
      gameStartedRef.current = true;
      const fakelesson: ImageWordLesson = {
        id: game.id,
        name: game.title,
        pairs: game.pairs,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      startLocalGame(fakelesson);
    }
    if (!game || game.status === 'waiting') {
      gameStartedRef.current = false;
    }
  }, [game, startLocalGame]);

  const handleStartGame = useCallback(() => {
    startGame();
    setView('play');
  }, [startGame]);

  const handleLeaveGame = useCallback(() => {
    leavingRef.current = true;
    leaveGame();
    resetLocalGame();
    onClose();
  }, [leaveGame, resetLocalGame, onClose]);

  const handleAddBot = useCallback(() => {
    addBot();
    setNotification({ message: 'Bot đã được thêm!', type: 'info' });
  }, [addBot]);

  const handlePlayAgain = useCallback(() => {
    resetLocalGame();
    resetGame();
    onClose();
  }, [resetLocalGame, resetGame, onClose]);

  const handleExit = useCallback(() => {
    resetLocalGame();
    resetGame();
    onClose();
  }, [resetLocalGame, resetGame, onClose]);

  // Update view based on game status
  useEffect(() => {
    if (!game) return;

    if (game.status === 'finished' || (gameState?.isComplete && gameResult)) {
      setView('results');
    } else if (game.status === 'starting' || game.status === 'playing') {
      setView('play');
    } else if (game.status === 'waiting') {
      setView('lobby');
    }
  }, [game, gameState?.isComplete, gameResult]);

  // Save game session when game finishes
  useEffect(() => {
    if (gameResult && !gameSessionSaved.current && onSaveGameSession) {
      gameSessionSaved.current = true;
      onSaveGameSession({
        date: new Date().toISOString().split('T')[0],
        gameTitle: 'Nối Hình - Từ',
        rank: 1,
        totalPlayers: game ? Object.keys(game.players).length : 1,
        score: gameResult.score,
        correctAnswers: gameResult.correctMatches,
        totalQuestions: gameResult.totalPairs,
      });
    }
    if (!gameResult) {
      gameSessionSaved.current = false;
    }
  }, [gameResult, game, onSaveGameSession]);

  // Error state — creation/join failed
  if (!game && error) {
    return (
      <div className="image-word-page">
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
      <div className="image-word-page">
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
    <div className="image-word-page">
      {view === 'lobby' && game && (
        <ImageWordLobby
          game={game}
          currentPlayerId={currentUser.id}
          onStartGame={handleStartGame}
          onAddBot={handleAddBot}
          onLeave={handleLeaveGame}
          onKickPlayer={kickPlayer}
        />
      )}

      {view === 'play' && gameState && (
        <ImageWordGamePlay
          gameState={gameState}
          wrongAnimation={wrongAnimation}
          onSelectImage={selectImage}
          onSelectWord={selectWord}
          onBack={handleLeaveGame}
        />
      )}

      {view === 'results' && gameResult && (
        <ImageWordResults
          result={gameResult}
          onPlayAgain={handlePlayAgain}
          onBack={handleExit}
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
