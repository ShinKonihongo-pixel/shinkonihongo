// Word Match Page - Main game page
// Setup is handled by Game Hub's unified modal. This page only manages: lobby → play → results
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  WordMatchLobby,
  WordMatchPlay,
  WordMatchResults,
  WordMatchGuide,
} from '../word-match';
import { useWordMatch } from '../../hooks/word-match';
import type { CreateWordMatchData, WordMatchEffectType } from '../../types/word-match';
import type { Flashcard } from '../../types/flashcard';
import type { GameSession } from '../../types/user';
import '../word-match/word-match.css';

type PageView = 'lobby' | 'play' | 'results' | 'guide';

interface WordMatchPageProps {
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

export const WordMatchPage: React.FC<WordMatchPageProps> = ({
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
    kickPlayer,
    startGame,
    addBot,
    submitMatches,
    applyEffect,
    continueGame,
    resetGame,
  } = useWordMatch({ currentUser, flashcards });

  // Auto-create room from unified setup (Game Hub modal) — guarded against StrictMode double-fire
  useEffect(() => {
    if (initialRoomConfig && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      const cfg = initialRoomConfig as unknown as CreateWordMatchData;
      createGame({
        title: (cfg.title as string) || 'Nối Từ Thách Đấu',
        totalRounds: (cfg.totalRounds as number) || 10,
        timePerRound: (cfg.timePerRound as number) || 60,
        maxPlayers: (cfg.maxPlayers as number) || 4,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-join game from QR code
  useEffect(() => {
    if (initialJoinCode && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      joinGame(initialJoinCode);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartGame = useCallback(() => {
    startGame();
    setView('play');
  }, [startGame]);

  const handleLeaveGame = useCallback(() => {
    leaveGame();
    onClose();
  }, [leaveGame, onClose]);

  const handleSubmitMatches = useCallback(
    (matches: { leftId: string; rightId: string }[]) => { submitMatches(matches); },
    [submitMatches]
  );

  const handleApplyEffect = useCallback(
    (effectType: WordMatchEffectType, targetId?: string) => { applyEffect(effectType, targetId); },
    [applyEffect]
  );

  const handleNextRound = useCallback(() => { continueGame(); }, [continueGame]);

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
      game.status === 'playing' ||
      game.status === 'result' ||
      game.status === 'wheel_spin'
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
          gameTitle: 'Word Match',
          rank: myResult.rank,
          totalPlayers: gameResults.rankings.length,
          score: myResult.score,
          correctAnswers: myResult.correctPairs,
          totalQuestions: gameResults.totalRounds,
        });
      }
    }
    if (!game || game.status !== 'finished') {
      gameSessionSaved.current = false;
    }
  }, [game, gameResults, currentUser.id, onSaveGameSession]);

  // Loading state — game is being created/joined
  if (!game && (loading || initialRoomConfig || initialJoinCode)) {
    return (
      <div className="word-match-page">
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
    <div className="word-match-page">
      {view === 'guide' && (
        <WordMatchGuide onClose={() => setView('lobby')} />
      )}

      {view === 'lobby' && game && (
        <WordMatchLobby
          game={game}
          currentPlayerId={currentUser.id}
          onStartGame={handleStartGame}
          onAddBot={addBot}
          onLeave={handleLeaveGame}
          onKickPlayer={kickPlayer}
        />
      )}

      {view === 'play' && game && (
        <WordMatchPlay
          game={game}
          currentPlayerId={currentUser.id}
          onSubmitMatches={handleSubmitMatches}
          onApplyEffect={handleApplyEffect}
          onNextRound={handleNextRound}
        />
      )}

      {view === 'results' && gameResults && (
        <WordMatchResults
          results={gameResults}
          currentPlayerId={currentUser.id}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
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
