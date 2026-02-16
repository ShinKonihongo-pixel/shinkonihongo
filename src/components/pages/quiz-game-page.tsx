// Quiz Game page — manages game state and renders lobby/play/results
// Entry: always via initialRoomConfig (create) or initialJoinCode (join via QR/code)
// No intermediate room list — goes directly to lobby (Phòng chờ)

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Flashcard } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { CreateGameData } from '../../types/quiz-game';
import type { AppSettings } from '../../hooks/use-settings';
import type { FriendWithUser } from '../../types/friendship';
import type { GameSession, UserRole } from '../../types/user';
import { useQuizGame } from '../../hooks/use-quiz-game';
import { GameLobby } from '../quiz-game/game-lobby';
import { GamePlay } from '../quiz-game/game-play';
import { GameResults } from '../quiz-game/game-results';
import { GameFriendInvite } from '../quiz-game/game-friend-invite';
import '../quiz-game/quiz-game.css';

interface QuizGamePageProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  onGoHome: () => void;
  initialJoinCode?: string | null;
  onJoinCodeUsed?: () => void;
  settings: AppSettings;
  friends?: FriendWithUser[];
  onInviteFriend?: (gameId: string, gameCode: string, gameTitle: string, friendId: string) => Promise<boolean>;
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
  initialRoomConfig?: Record<string, unknown>;
  userRole?: UserRole;
}

type GameView = 'lobby' | 'play' | 'results';

export function QuizGamePage({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  flashcards,
  jlptQuestions,
  onGoHome,
  initialJoinCode,
  onJoinCodeUsed,
  settings,
  friends = [],
  onInviteFriend,
  onSaveGameSession,
  initialRoomConfig,
  userRole,
}: QuizGamePageProps) {
  const [showFriendInvite, setShowFriendInvite] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const gameSessionSaved = useRef(false);

  const {
    game,
    gameResults,
    loading,
    error,
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    createGame,
    joinGame,
    leaveGame,
    kickPlayer,
    startGame,
    submitAnswer,
    revealAnswer,
    nextRound,
    continueFromPowerUp,
    continueFromLeaderboard,
    usePowerUp,
    updateHostMessage,
    resetGame,
  } = useQuizGame({
    playerId: currentUserId,
    playerName: currentUserName,
    playerAvatar: currentUserAvatar,
    playerRole: userRole,
  });

  // Auto-create room from hub modal (guard against React StrictMode double-fire)
  const createOnceRef = useRef(false);
  useEffect(() => {
    if (initialRoomConfig && !game && !createOnceRef.current) {
      createOnceRef.current = true;
      createGame(initialRoomConfig as unknown as CreateGameData, flashcards, jlptQuestions);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-join game when initialJoinCode is provided (from QR code scan)
  useEffect(() => {
    if (initialJoinCode && !game) {
      joinGame(initialJoinCode).then((success) => {
        if (!success) {
          setJoinError('Không thể tham gia game. Mã có thể không hợp lệ hoặc game đã kết thúc.');
        }
        onJoinCodeUsed?.();
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save game session when game finishes (for XP tracking)
  useEffect(() => {
    if (game?.status === 'finished' && !gameSessionSaved.current && onSaveGameSession && gameResults) {
      gameSessionSaved.current = true;
      const myResult = gameResults.rankings.find(r => r.playerId === currentUserId);
      if (myResult) {
        onSaveGameSession({
          date: new Date().toISOString().split('T')[0],
          gameTitle: gameResults.gameTitle || 'Quiz Game',
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
  }, [game, gameResults, currentUserId, onSaveGameSession]);

  // Track if player was ever in a game (to distinguish "deleted/kicked" from "loading")
  const wasInGame = useRef(false);
  if (game) wasInGame.current = true;

  // Guard: skip kicked modal when player voluntarily leaves
  const leavingVoluntarily = useRef(false);

  // Kicked/deleted notification state
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);

  // Auto-navigate when game deleted or player kicked (skip if voluntary leave)
  useEffect(() => {
    if (!wasInGame.current || game || leavingVoluntarily.current) return;
    if (error === 'Game đã bị xóa') {
      setKickedMessage('Phòng chơi đã bị huỷ bởi host.');
    } else if (error === 'Bạn đã bị kick khỏi phòng') {
      setKickedMessage('Bạn đã bị kick khỏi phòng bởi host.');
    }
  }, [game, error]);

  // Auto-dismiss kicked modal after 3s
  useEffect(() => {
    if (!kickedMessage) return;
    const timer = setTimeout(() => {
      setKickedMessage(null);
      onGoHome();
    }, 3000);
    return () => clearTimeout(timer);
  }, [kickedMessage, onGoHome]);

  // Determine current view based on game state
  const getCurrentView = (): GameView => {
    if (!game) return 'lobby'; // loading/creating/joining state
    if (game.status === 'finished') return 'results';
    if (game.status === 'waiting') return 'lobby';
    return 'play';
  };

  const currentView = getCurrentView();

  const handleLeaveGame = useCallback(async () => {
    leavingVoluntarily.current = true;
    await leaveGame();
    resetGame();
    onGoHome();
  }, [leaveGame, resetGame, onGoHome]);

  // Lobby view — shows game info when game exists
  if (currentView === 'lobby' && game) {
    return (
      <>
        <GameLobby
          game={game}
          isHost={isHost}
          currentPlayerId={currentUserId}
          onStartGame={startGame}
          onKickPlayer={kickPlayer}
          onLeaveGame={handleLeaveGame}
          onUpdateHostMessage={updateHostMessage}
          onInviteFriends={() => setShowFriendInvite(true)}
          hasFriends={friends.length > 0}
          error={error}
        />
        {onInviteFriend && (
          <GameFriendInvite
            isOpen={showFriendInvite}
            onClose={() => setShowFriendInvite(false)}
            friends={friends}
            gameCode={game.code}
            gameTitle={game.title}
            gameId={game.id}
            onInviteFriend={onInviteFriend}
          />
        )}
      </>
    );
  }

  // Play view
  if (currentView === 'play' && game && currentQuestion) {
    return (
      <GamePlay
        game={game}
        currentPlayer={currentPlayer}
        currentQuestion={currentQuestion}
        sortedPlayers={sortedPlayers}
        isHost={isHost}
        onSubmitAnswer={submitAnswer}
        onRevealAnswer={revealAnswer}
        onNextRound={nextRound}
        onContinueFromPowerUp={continueFromPowerUp}
        onContinueFromLeaderboard={continueFromLeaderboard}
        onUsePowerUp={usePowerUp}
        onLeaveGame={handleLeaveGame}
        gameQuestionFontSize={settings.gameQuestionFontSize}
        gameAnswerFontSize={settings.gameAnswerFontSize}
      />
    );
  }

  // Results view
  if (currentView === 'results' && game) {
    return (
      <GameResults
        game={game}
        gameResults={gameResults}
        currentPlayerId={currentUserId}
        onPlayAgain={onGoHome}
        onGoHome={onGoHome}
      />
    );
  }

  // Kicked/deleted notification — full-screen overlay with auto-dismiss
  if (kickedMessage) {
    return (
      <div className="quiz-game-page">
        <div className="kicked-overlay">
          <div className="kicked-modal">
            <span className="kicked-icon">🚪</span>
            <p className="kicked-message">{kickedMessage}</p>
            <p className="kicked-hint">Tự động quay lại sau 3 giây...</p>
            <button className="btn btn-outline" onClick={() => { setKickedMessage(null); onGoHome(); }}>
              Quay lại ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading/error state — waiting for room creation or join
  return (
    <div className="quiz-game-page">
      <div className="loading-state">
        {(error || joinError) ? (
          <>
            <p className="error-message">{error || joinError}</p>
            <button className="btn btn-outline" onClick={onGoHome}>← Quay lại</button>
          </>
        ) : loading ? (
          <p>Đang {initialJoinCode ? 'tham gia' : 'tạo'} phòng...</p>
        ) : (
          <p>Đang tải...</p>
        )}
      </div>
    </div>
  );
}
