// Kanji Battle Page - Main game page
// Setup is handled by Game Hub's unified modal. This page only manages: lobby → play → results
/* eslint-disable react-hooks/rules-of-hooks */
// NOTE: React Compiler false positives - setState calls in useCallback are valid
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  KanjiBattleLobby,
  KanjiBattlePlay,
  KanjiBattleResults,
  KanjiBattleGuide,
} from '../kanji-battle';
import { useKanjiBattle } from '../../hooks/use-kanji-battle';
import type { CreateKanjiBattleData, KanjiBattleSkillType, StrokeMatchResult } from '../../types/kanji-battle';
import type { GameSession } from '../../types/user';

type PageView = 'lobby' | 'play' | 'results' | 'guide';

interface KanjiBattlePageProps {
  onClose: () => void;
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  initialView?: string;
  // XP tracking
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
  initialRoomConfig?: Record<string, unknown>;
  initialJoinCode?: string;
}

export const KanjiBattlePage: React.FC<KanjiBattlePageProps> = ({
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
    submitAnswer,
    submitDrawing,
    useHint,
    continueGame,
    useSkill,
    resetGame,
  } = useKanjiBattle({ currentUser });

  // Auto-create room from unified setup (Game Hub modal) — guarded against StrictMode double-fire
  useEffect(() => {
    if (initialRoomConfig && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      const cfg = initialRoomConfig as unknown as CreateKanjiBattleData;
      createGame({
        title: cfg.title || 'Đại Chiến Kanji',
        totalRounds: cfg.totalRounds || 15,
        timePerQuestion: cfg.timePerQuestion || 15,
        maxPlayers: cfg.maxPlayers || 10,
        skillsEnabled: cfg.skillsEnabled ?? true,
        gameMode: cfg.gameMode || 'read',
        selectedLevels: cfg.selectedLevels || ['N5'],
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
    leaveGame();
    onClose();
  }, [leaveGame, onClose]);

  const handleSubmitAnswer = useCallback(
    (answer: string) => { submitAnswer(answer); },
    [submitAnswer]
  );

  const handleSubmitDrawing = useCallback(
    (strokeResults: StrokeMatchResult[], drawingTimeMs: number) => {
      submitDrawing(strokeResults, drawingTimeMs);
    },
    [submitDrawing]
  );

  const handleUseHint = useCallback(() => { useHint(); }, [useHint]);

  const handleSelectSkill = useCallback(
    (skillType: KanjiBattleSkillType, targetId?: string) => { useSkill(skillType, targetId); },
    [useSkill]
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

  const handleAddBot = useCallback(() => {
    setNotification({ message: 'Bot sẽ tự động được thêm sau vài giây!', type: 'info' });
  }, []);

  // Update view based on game status
  useEffect(() => {
    if (!game) return;

    if (game.status === 'finished' && gameResults) {
      setView('results');
    } else if (
      game.status === 'playing' ||
      game.status === 'result' ||
      game.status === 'skill_phase'
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
          gameTitle: 'Đại Chiến Kanji',
          rank: myResult.rank,
          totalPlayers: gameResults.totalPlayers,
          score: myResult.score,
          correctAnswers: myResult.correctAnswers,
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
      <div className="speed-quiz-page">
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
    <div className="speed-quiz-page">
      {view === 'guide' && (
        <KanjiBattleGuide onClose={() => setView('lobby')} />
      )}

      {view === 'lobby' && game && (
        <KanjiBattleLobby
          game={game}
          currentPlayerId={currentUser.id}
          onStartGame={handleStartGame}
          onAddBot={handleAddBot}
          onLeave={handleLeaveGame}
          onKickPlayer={kickPlayer}
        />
      )}

      {view === 'play' && game && (
        <KanjiBattlePlay
          game={game}
          currentPlayerId={currentUser.id}
          onSubmitAnswer={handleSubmitAnswer}
          onSubmitDrawing={handleSubmitDrawing}
          onUseHint={handleUseHint}
          onSelectSkill={handleSelectSkill}
          onNextRound={handleNextRound}
        />
      )}

      {view === 'results' && gameResults && (
        <KanjiBattleResults
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
