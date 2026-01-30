// Word Match Page - Main game page
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  WordMatchMenu,
  WordMatchSetup,
  WordMatchLobby,
  WordMatchPlay,
  WordMatchResults,
  WordMatchGuide,
} from '../word-match';
import { useWordMatch } from '../../hooks/use-word-match';
import type { CreateWordMatchData, WordMatchEffectType } from '../../types/word-match';
import type { Flashcard } from '../../types/flashcard';
import type { GameSession } from '../../types/user';

type PageView = 'menu' | 'setup' | 'lobby' | 'play' | 'results' | 'guide';

interface WordMatchPageProps {
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

export const WordMatchPage: React.FC<WordMatchPageProps> = ({
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
    addBot,
    submitMatches,
    applyEffect,
    continueGame,
    resetGame,
  } = useWordMatch({ currentUser, flashcards });

  // Handle create game
  const handleCreateGame = useCallback(
    (data: CreateWordMatchData) => {
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

  // Handle submit matches
  const handleSubmitMatches = useCallback(
    (matches: { leftId: string; rightId: string }[]) => {
      submitMatches(matches);
    },
    [submitMatches]
  );

  // Handle apply effect
  const handleApplyEffect = useCallback(
    (effectType: WordMatchEffectType, targetId?: string) => {
      applyEffect(effectType, targetId);
    },
    [applyEffect]
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

  // Update view based on game status
  React.useEffect(() => {
    if (!game) return;

    if (game.status === 'finished' && gameResults) {
      setView('results');
    } else if (
      game.status === 'playing' ||
      game.status === 'result' ||
      game.status === 'wheel_spin'
    ) {
      setView('play');
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
          gameTitle: 'Word Match',
          rank: myResult.rank,
          totalPlayers: gameResults.rankings.length,
          score: myResult.score,
          correctAnswers: myResult.correctPairs,
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
        return <WordMatchGuide onClose={() => setView('menu')} />;

      case 'setup':
        return (
          <WordMatchSetup
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
          <WordMatchLobby
            game={game}
            currentPlayerId={currentUser.id}
            onStartGame={handleStartGame}
            onAddBot={addBot}
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
          <WordMatchPlay
            game={game}
            currentPlayerId={currentUser.id}
            onSubmitMatches={handleSubmitMatches}
            onApplyEffect={handleApplyEffect}
            onNextRound={handleNextRound}
          />
        );

      case 'results':
        if (!gameResults) {
          setView('menu');
          return null;
        }
        return (
          <WordMatchResults
            results={gameResults}
            currentPlayerId={currentUser.id}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        );

      default:
        return (
          <WordMatchMenu
            onCreateGame={() => setView('setup')}
            onJoinGame={handleJoinGame}
            onShowGuide={() => setView('guide')}
            onClose={onClose}
          />
        );
    }
  };

  return (
    <div className="word-match-page">
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
