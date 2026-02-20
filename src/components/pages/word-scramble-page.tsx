// Word Scramble Page - Main game page
// Setup is handled by Game Hub's unified modal. This page only manages: lobby → play → results
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Flashcard } from '../../types/flashcard';
import type { GameSession } from '../../types/user';
import type {
  Question,
  Player,
  PlayerRole,
  GameState,
  CreateWordScrambleData,
} from './word-scramble/word-scramble-types';
import { useWordScrambleMultiplayer } from '../../hooks/word-scramble';
import { useWordScrambleGame } from './word-scramble/use-word-scramble-game';
import { useGameTimer } from './word-scramble/use-game-timer';
import { PlayingScreen } from './word-scramble/playing-screen';
import { ResultScreen } from './word-scramble/result-screen';
import { WordScrambleLobby } from '../word-scramble/word-scramble-lobby';
import './word-scramble/word-scramble.css';

type PageView = 'lobby' | 'play' | 'results';

interface WordScramblePageProps {
  onClose: () => void;
  flashcards: Flashcard[];
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

export const WordScramblePage: React.FC<WordScramblePageProps> = ({
  onClose,
  flashcards,
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
    isHost,
  } = useWordScrambleMultiplayer({ currentUser, flashcards });

  // Single-player gameplay engine (used within multiplayer room)
  const {
    config,
    gameState,
    setGameState,
    handleLetterClick,
    handleAutoFill,
    getCurrentPenalty,
    checkAnswer,
    nextQuestion,
    resetGame: resetLocalGame,
  } = useWordScrambleGame({ flashcards, currentUser });

  // Timer hook
  useGameTimer({
    gameState,
    timePerQuestion: game?.settings.timePerQuestion ?? config.timePerQuestion,
    onTimerTick: setGameState,
  });

  // Auto-create room from unified setup (Game Hub modal) — guarded against StrictMode double-fire
  useEffect(() => {
    if (initialRoomConfig && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      const cfg = initialRoomConfig;
      createGame({
        title: (cfg.title as string) || 'Sắp Xếp Từ',
        maxPlayers: (cfg.maxPlayers as number) || 4,
        totalQuestions: (cfg.totalRounds as number) || 10,
        timePerQuestion: (cfg.timePerQuestion as number) || 30,
        jlptLevel: (cfg.jlptLevel as string) || 'N5',
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

  // Bridge: when multiplayer game starts playing, create local GameState from room's questions
  useEffect(() => {
    if (game?.status === 'playing' && !gameStartedRef.current && game.questions.length > 0) {
      gameStartedRef.current = true;

      // Convert room questions to local Question format
      const questions: Question[] = game.questions.map(q => ({
        word: {
          id: '',
          vocabulary: q.vocabulary,
          reading: q.reading || '',
          meaning: q.meaning || '',
          jlptLevel: q.jlptLevel || 'N5',
        } as Flashcard,
        scrambledLetters: q.scrambledLetters,
        originalPositions: q.originalPositions,
      }));

      const localPlayer: Player = {
        id: currentUser.id,
        name: currentUser.displayName,
        avatar: currentUser.avatar,
        score: 0,
        correctAnswers: 0,
        isCurrentUser: true,
        role: (currentUser.role || 'user') as PlayerRole,
      };

      setGameState({
        phase: 'playing',
        currentQuestionIndex: 0,
        questions,
        score: 0,
        totalTime: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        questionStartTime: Date.now(),
        timeRemaining: game.settings.timePerQuestion,
        selectedLetters: [],
        hints: { hint1Shown: false, hint2Shown: false, hint3Shown: false, hint1Content: '', hint2Content: '', hint3Content: '' },
        isCorrect: null,
        showResult: false,
        streak: 0,
        maxStreak: 0,
        players: [localPlayer],
        autoFillUsed: 0,
        autoFilledPositions: [],
        isSoloMode: true,
      });
    }
    if (!game || game.status === 'waiting') {
      gameStartedRef.current = false;
    }
  }, [game, currentUser, setGameState]);

  const handleStartGame = useCallback(() => {
    startGame();
    setView('play');
  }, [startGame]);

  const handleLeaveGame = useCallback(() => {
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

    if (game.status === 'finished' || gameState.phase === 'result') {
      setView('results');
    } else if (game.status === 'starting' || game.status === 'playing') {
      setView('play');
    } else if (game.status === 'waiting') {
      setView('lobby');
    }
  }, [game, gameState.phase]);

  // Save game session when local game finishes
  useEffect(() => {
    if (gameState.phase === 'result' && !gameSessionSaved.current && onSaveGameSession) {
      gameSessionSaved.current = true;
      const me = gameState.players.find(p => p.isCurrentUser);
      onSaveGameSession({
        date: new Date().toISOString().split('T')[0],
        gameTitle: 'Sắp Xếp Từ',
        rank: me ? gameState.players.indexOf(me) + 1 : 1,
        totalPlayers: game ? Object.keys(game.players).length : gameState.players.length,
        score: me?.score || gameState.score,
        correctAnswers: gameState.correctAnswers,
        totalQuestions: gameState.questions.length,
      });
    }
    if (gameState.phase !== 'result') {
      gameSessionSaved.current = false;
    }
  }, [gameState, game, onSaveGameSession]);

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex] || null;

  // Loading state — game is being created/joined
  if (!game && (loading || initialRoomConfig || initialJoinCode)) {
    return (
      <div className="ws-page">
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
    <div className="ws-page">
      {view === 'lobby' && game && (
        <WordScrambleLobby
          game={game}
          currentPlayerId={currentUser.id}
          onStartGame={handleStartGame}
          onAddBot={handleAddBot}
          onLeave={handleLeaveGame}
          onKickPlayer={kickPlayer}
        />
      )}

      {view === 'play' && gameState.phase === 'playing' && (
        <PlayingScreen
          currentQuestion={currentQuestion}
          gameState={gameState}
          timePerQuestion={game?.settings.timePerQuestion ?? config.timePerQuestion}
          currentPenalty={getCurrentPenalty()}
          onLetterClick={handleLetterClick}
          onAutoFill={handleAutoFill}
          onCheckAnswer={checkAnswer}
          onNextQuestion={nextQuestion}
          onResetGame={handleLeaveGame}
          onSetGameState={setGameState}
        />
      )}

      {view === 'results' && gameState.phase === 'result' && (
        <ResultScreen
          gameState={gameState}
          onClose={handleExit}
          onResetGame={handlePlayAgain}
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

// Re-export types for external use
export type { WordScramblePageProps };
