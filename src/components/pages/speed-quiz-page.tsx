// Speed Quiz Page - Main game page
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  SpeedQuizMenu,
  SpeedQuizSetup,
  SpeedQuizLobby,
  SpeedQuizPlay,
  SpeedQuizResults,
  SpeedQuizGuide,
} from '../speed-quiz';
import { useSpeedQuiz } from '../../hooks/use-speed-quiz';
import type { CreateSpeedQuizData, SpeedQuizSkillType } from '../../types/speed-quiz';
import type { Flashcard } from '../../types/flashcard';
import type { GameSession } from '../../types/user';

type PageView = 'menu' | 'setup' | 'lobby' | 'play' | 'results' | 'guide';

interface SpeedQuizPageProps {
  onClose: () => void;
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards?: Flashcard[];
  initialView?: PageView;
  // XP tracking
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
}

export const SpeedQuizPage: React.FC<SpeedQuizPageProps> = ({
  onClose,
  currentUser = { id: 'user-1', displayName: 'Player', avatar: '👤' },
  flashcards = [],
  initialView = 'menu',
  onSaveGameSession,
}) => {
  const [view, setView] = useState<PageView>(initialView);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' } | null>(null);
  const gameSessionSaved = useRef(false);

  // Auto-hide notification after 3 seconds
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
    useHint,
    continueGame,
    useSkill,
    resetGame,
  } = useSpeedQuiz({ currentUser, flashcards });

  // Handle create game
  const handleCreateGame = useCallback(
    (data: CreateSpeedQuizData) => {
      createGame(data);
      setView('lobby');
    },
    [createGame]
  );

  // Handle join game
  const handleJoinGame = useCallback(
    (code: string) => {
      joinGame(code);
      setNotification({ message: 'Chức năng tham gia phòng đang phát triển!', type: 'warning' });
    },
    [joinGame]
  );

  // Handle start game
  const handleStartGame = useCallback(() => {
    startGame();
    setView('play');
  }, [startGame]);

  // Handle leave game
  const handleLeaveGame = useCallback(() => {
    leaveGame();
    setView('menu');
  }, [leaveGame]);

  // Handle submit answer
  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      submitAnswer(answer);
    },
    [submitAnswer]
  );

  // Handle use hint
  const handleUseHint = useCallback(() => {
    useHint();
  }, [useHint]);

  // Handle select skill
  const handleSelectSkill = useCallback(
    (skillType: SpeedQuizSkillType, targetId?: string) => {
      useSkill(skillType, targetId);
    },
    [useSkill]
  );

  // Handle next round
  const handleNextRound = useCallback(() => {
    continueGame();
  }, [continueGame]);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    resetGame();
    setView('menu');
  }, [resetGame]);

  // Handle exit
  const handleExit = useCallback(() => {
    resetGame();
    onClose();
  }, [resetGame, onClose]);

  // Handle add bot - simplified version
  const handleAddBot = useCallback(() => {
    // Bot auto-adding is handled in the hook
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
    } else if (game.status === 'waiting' || game.status === 'starting') {
      // Stay in lobby
    }
  }, [game?.status, gameResults]);

  // Save game session when game finishes (for XP tracking)
  useEffect(() => {
    if (game?.status === 'finished' && !gameSessionSaved.current && onSaveGameSession && gameResults) {
      gameSessionSaved.current = true;

      // Find current player's result from rankings
      const myResult = gameResults.rankings.find(p => p.odinhId === currentUser.id);
      if (myResult) {
        onSaveGameSession({
          date: new Date().toISOString().split('T')[0],
          gameTitle: 'Speed Quiz',
          rank: myResult.rank,
          totalPlayers: gameResults.totalPlayers,
          score: myResult.score,
          correctAnswers: myResult.correctAnswers,
          totalQuestions: gameResults.totalRounds,
        });
      }
    }

    // Reset flag when game changes (new game)
    if (!game || game.status !== 'finished') {
      gameSessionSaved.current = false;
    }
  }, [game, gameResults, currentUser.id, onSaveGameSession]);

  // Render based on view
  const renderContent = () => {
    switch (view) {
      case 'guide':
        return <SpeedQuizGuide onClose={() => setView('menu')} />;

      case 'setup':
        return (
          <SpeedQuizSetup
            onCreateGame={handleCreateGame}
            onBack={() => setView('menu')}
          />
        );

      case 'lobby':
        if (!game) {
          setView('menu');
          return null;
        }
        return (
          <SpeedQuizLobby
            game={game}
            currentPlayerId={currentUser.id}
            onStartGame={handleStartGame}
            onAddBot={handleAddBot}
            onLeave={handleLeaveGame}
            onKickPlayer={kickPlayer}
          />
        );

      case 'play':
        if (!game) {
          setView('menu');
          return null;
        }
        return (
          <SpeedQuizPlay
            game={game}
            currentPlayerId={currentUser.id}
            onSubmitAnswer={handleSubmitAnswer}
            onUseHint={handleUseHint}
            onSelectSkill={handleSelectSkill}
            onNextRound={handleNextRound}
          />
        );

      case 'results':
        if (!gameResults) {
          setView('menu');
          return null;
        }
        return (
          <SpeedQuizResults
            results={gameResults}
            currentPlayerId={currentUser.id}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        );

      default:
        return (
          <SpeedQuizMenu
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
      {/* Inline notification toast */}
      {notification && (
        <div className={`game-notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="notification-text">{notification.message}</span>
          <button
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
