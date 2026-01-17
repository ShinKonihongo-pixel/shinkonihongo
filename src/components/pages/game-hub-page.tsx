// Game Hub Page - Unified game center orchestrating all mini-games
// Manages game selection and routes to appropriate game pages

import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { GameType } from '../../types/game-hub';
import type { CurrentUser } from '../../types/user';
import type { Flashcard, JLPTLevel, Lesson } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { AppSettings } from '../../hooks/use-settings';
import type { FriendWithUser } from '../../types/friendship';
import { GameSelector } from '../game-hub/game-selector';

// Import individual game pages
import { QuizGamePage } from './quiz-game-page';
import { BoatRacingPage } from './boat-racing-page';
import { HorseRacingPage } from './horse-racing-page';
import { GoldenBellPage } from './golden-bell-page';
import { PictureGuessPage } from './picture-guess-page';

interface GameHubPageProps {
  currentUser: CurrentUser | null;
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  settings: AppSettings;
  friends?: FriendWithUser[];
  onInviteFriend?: (gameId: string, gameCode: string, gameTitle: string, friendId: string) => Promise<boolean>;
  // Initial game selection (from URL params)
  initialGame?: GameType | null;
  initialJoinCode?: string | null;
}

export function GameHubPage({
  currentUser,
  flashcards,
  jlptQuestions,
  getLessonsByLevel,
  getChildLessons,
  settings,
  friends = [],
  onInviteFriend,
  initialGame,
  initialJoinCode,
}: GameHubPageProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(initialGame || null);
  const [joinCode, setJoinCode] = useState<string | null>(initialJoinCode || null);

  // Handle game selection
  const handleSelectGame = useCallback((game: GameType) => {
    setSelectedGame(game);
    setJoinCode(null);
  }, []);

  // Handle quick join with code
  const handleQuickJoin = useCallback((gameType: GameType, code: string) => {
    setSelectedGame(gameType);
    setJoinCode(code);
  }, []);

  // Return to game selector
  const handleBackToHub = useCallback(() => {
    setSelectedGame(null);
    setJoinCode(null);
  }, []);

  // Not logged in
  if (!currentUser) {
    return (
      <div className="game-hub-page">
        <div className="game-hub-login-prompt">
          <span className="prompt-icon">🎮</span>
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập để chơi game</p>
        </div>
      </div>
    );
  }

  // Show game selector if no game selected
  if (!selectedGame) {
    return (
      <div className="game-hub-page">
        <GameSelector
          onSelectGame={handleSelectGame}
          onQuickJoin={handleQuickJoin}
        />
      </div>
    );
  }

  // Render selected game with back button
  return (
    <div className="game-hub-page game-active">
      {/* Floating back button */}
      <button className="game-hub-back-btn" onClick={handleBackToHub}>
        <ArrowLeft size={20} />
        <span>Game Center</span>
      </button>

      {/* Render appropriate game */}
      {selectedGame === 'quiz' && (
        <QuizGamePage
          currentUserId={currentUser.id}
          currentUserName={currentUser.displayName || currentUser.username}
          currentUserAvatar={currentUser.avatar}
          flashcards={flashcards}
          jlptQuestions={jlptQuestions}
          getLessonsByLevel={getLessonsByLevel}
          getChildLessons={getChildLessons}
          onGoHome={handleBackToHub}
          initialJoinCode={joinCode}
          onJoinCodeUsed={() => setJoinCode(null)}
          settings={settings}
          friends={friends}
          onInviteFriend={onInviteFriend}
        />
      )}

      {selectedGame === 'boat-racing' && (
        <BoatRacingPage
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🚣',
          }}
          flashcards={flashcards}
          initialJoinCode={joinCode || undefined}
        />
      )}

      {selectedGame === 'horse-racing' && (
        <HorseRacingPage
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🏇',
          }}
          flashcards={flashcards}
          initialJoinCode={joinCode || undefined}
        />
      )}

      {selectedGame === 'golden-bell' && (
        <GoldenBellPage
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🔔',
          }}
          flashcards={flashcards}
          initialJoinCode={joinCode || undefined}
        />
      )}

      {selectedGame === 'picture-guess' && (
        <PictureGuessPage
          currentUser={currentUser}
          flashcards={flashcards}
        />
      )}
    </div>
  );
}
