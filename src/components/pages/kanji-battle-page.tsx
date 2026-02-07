// Kanji Battle Page - Main game page
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  KanjiBattleMenu,
  KanjiBattleSetup,
  KanjiBattleLobby,
  KanjiBattlePlay,
  KanjiBattleResults,
  KanjiBattleGuide,
} from '../kanji-battle';
import { useKanjiBattle } from '../../hooks/use-kanji-battle';
import type { CreateKanjiBattleData, KanjiBattleSkillType, StrokeMatchResult } from '../../types/kanji-battle';
import type { GameSession } from '../../types/user';

type PageView = 'menu' | 'setup' | 'lobby' | 'play' | 'results' | 'guide';

interface KanjiBattlePageProps {
  onClose: () => void;
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  initialView?: PageView;
  // XP tracking
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
}

export const KanjiBattlePage: React.FC<KanjiBattlePageProps> = ({
  onClose,
  currentUser = { id: 'user-1', displayName: 'Player', avatar: '👤' },
  initialView = 'menu',
  onSaveGameSession,
}) => {
  const [view, setView] = useState<PageView>(initialView);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' } | null>(null);
  const gameSessionSaved = useRef(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const {
    game,
    gameResults,
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

  const handleCreateGame = useCallback(
    (data: CreateKanjiBattleData) => {
      createGame(data);
      setView('lobby');
    },
    [createGame]
  );

  const handleJoinGame = useCallback(
    (code: string) => {
      joinGame(code);
      setNotification({ message: 'Chức năng tham gia phòng đang phát triển!', type: 'warning' });
    },
    [joinGame]
  );

  const handleStartGame = useCallback(() => {
    startGame();
    setView('play');
  }, [startGame]);

  const handleLeaveGame = useCallback(() => {
    leaveGame();
    setView('menu');
  }, [leaveGame]);

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
    setView('menu');
  }, [resetGame]);

  const handleExit = useCallback(() => {
    resetGame();
    onClose();
  }, [resetGame, onClose]);

  const handleAddBot = useCallback(() => {
    setNotification({ message: 'Bot sẽ tự động được thêm sau vài giây!', type: 'info' });
  }, []);

  // Update view based on game status
  React.useEffect(() => {
    if (!game) return;

    if (game.status === 'finished' && gameResults) {
      setView('results');
    } else if (
      game.status === 'playing' ||
      game.status === 'result' ||
      game.status === 'skill_phase'
    ) {
      setView('play');
    }
  }, [game?.status, gameResults]);

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

  const renderContent = () => {
    switch (view) {
      case 'guide':
        return <KanjiBattleGuide onClose={() => setView('menu')} />;

      case 'setup':
        return (
          <KanjiBattleSetup
            onCreateGame={handleCreateGame}
            onBack={() => setView('menu')}
          />
        );

      case 'lobby':
        if (!game) { setView('menu'); return null; }
        return (
          <KanjiBattleLobby
            game={game}
            currentPlayerId={currentUser.id}
            onStartGame={handleStartGame}
            onAddBot={handleAddBot}
            onLeave={handleLeaveGame}
            onKickPlayer={kickPlayer}
          />
        );

      case 'play':
        if (!game) { setView('menu'); return null; }
        return (
          <KanjiBattlePlay
            game={game}
            currentPlayerId={currentUser.id}
            onSubmitAnswer={handleSubmitAnswer}
            onSubmitDrawing={handleSubmitDrawing}
            onUseHint={handleUseHint}
            onSelectSkill={handleSelectSkill}
            onNextRound={handleNextRound}
          />
        );

      case 'results':
        if (!gameResults) { setView('menu'); return null; }
        return (
          <KanjiBattleResults
            results={gameResults}
            currentPlayerId={currentUser.id}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        );

      default:
        return (
          <KanjiBattleMenu
            onCreateGame={() => setView('setup')}
            onJoinGame={handleJoinGame}
            onShowGuide={() => setView('guide')}
            onClose={onClose}
          />
        );
    }
  };

  return (
    <div className="speed-quiz-page">
      {renderContent()}
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
