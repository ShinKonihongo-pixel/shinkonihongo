// Main Quiz Game page that manages game state and renders appropriate UI

import { useState, useEffect, useRef } from 'react';
import type { Flashcard, JLPTLevel, Lesson } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { CreateGameData } from '../../types/quiz-game';
import type { AppSettings } from '../../hooks/use-settings';
import type { FriendWithUser } from '../../types/friendship';
import type { GameSession } from '../../types/user';
import { useQuizGame } from '../../hooks/use-quiz-game';
import { GameCreate } from '../quiz-game/game-create';
import { GameLobby } from '../quiz-game/game-lobby';
import { GamePlay } from '../quiz-game/game-play';
import { GameResults } from '../quiz-game/game-results';
import { GameFriendInvite } from '../quiz-game/game-friend-invite';
import { GameAvatarPicker } from '../quiz-game/game-avatar-picker';

interface QuizGamePageProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onGoHome: () => void;
  initialJoinCode?: string | null;
  onJoinCodeUsed?: () => void;
  settings: AppSettings;
  // Friends integration
  friends?: FriendWithUser[];
  onInviteFriend?: (gameId: string, gameCode: string, gameTitle: string, friendId: string) => Promise<boolean>;
  // XP tracking
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
  initialRoomConfig?: Record<string, unknown>;
}

type GameView = 'menu' | 'create' | 'join' | 'lobby' | 'play' | 'results';

export function QuizGamePage({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  flashcards,
  jlptQuestions,
  getLessonsByLevel,
  getChildLessons,
  onGoHome,
  initialJoinCode,
  onJoinCodeUsed,
  settings,
  friends = [],
  onInviteFriend,
  onSaveGameSession,
  initialRoomConfig,
}: QuizGamePageProps) {
  const [view, setView] = useState<GameView>(initialJoinCode ? 'join' : 'menu');
  const [joinCode, setJoinCode] = useState(initialJoinCode || '');
  const [joinError, setJoinError] = useState('');
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  const [showFriendInvite, setShowFriendInvite] = useState(false);
  const [gameAvatar, setGameAvatar] = useState(currentUserAvatar || '');
  const gameSessionSaved = useRef(false);

  const {
    game,
    gameResults,
    availableRooms,
    loadingRooms,
    loading,
    error,
    isHost,
    currentPlayer,
    currentQuestion,
    sortedPlayers,
    createGame,
    joinGame,
    joinGameById,
    leaveGame,
    kickPlayer,
    startGame,
    submitAnswer,
    revealAnswer,
    nextRound,
    continueFromPowerUp,
    continueFromLeaderboard,
    usePowerUp,
    resetGame,
    subscribeToRooms,
  } = useQuizGame({
    playerId: currentUserId,
    playerName: currentUserName,
    playerAvatar: gameAvatar || currentUserAvatar,
  });

  // Subscribe to available rooms when in join view
  useEffect(() => {
    if (view === 'join' && !game) {
      const unsubscribe = subscribeToRooms();
      return () => unsubscribe();
    }
  }, [view, game, subscribeToRooms]);

  // Auto-create room from unified setup
  useEffect(() => {
    if (initialRoomConfig && !game) {
      const cfg = initialRoomConfig;
      const source = (cfg.source as string) === 'flashcards' ? 'flashcards' : 'jlpt';
      handleCreateGame({
        title: (cfg.title as string) || 'Quiz Battle',
        source: source as CreateGameData['source'],
        lessonIds: [],
        jlptLevels: cfg.jlptLevel ? [cfg.jlptLevel as string] : undefined,
        totalRounds: (cfg.totalRounds as number) || 20,
        timePerQuestion: (cfg.timePerQuestion as number) || 15,
        questionContent: settings.gameQuestionContent,
        answerContent: settings.gameAnswerContent,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clear join error when code changes or view changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (joinError) setJoinError('');
  }, [joinCode, view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-join game when initialJoinCode is provided (from QR code scan)
  useEffect(() => {
    if (initialJoinCode && !autoJoinAttempted && !game) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoJoinAttempted(true);
      joinGame(initialJoinCode).then((success) => {
        if (success) {
          setView('lobby');
        } else {
          setJoinError('Không thể tham gia game. Mã có thể không hợp lệ hoặc game đã kết thúc.');
        }
        onJoinCodeUsed?.();
      });
    }
  }, [initialJoinCode, autoJoinAttempted, game, joinGame, onJoinCodeUsed]);

  // Save game session when game finishes (for XP tracking)
  useEffect(() => {
    if (game?.status === 'finished' && !gameSessionSaved.current && onSaveGameSession && gameResults) {
      gameSessionSaved.current = true;

      // Find current player's result from rankings
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

    // Reset flag when game changes (new game)
    if (!game || game.status !== 'finished') {
      gameSessionSaved.current = false;
    }
  }, [game, gameResults, currentUserId, onSaveGameSession]);

  // Determine current view based on game state
  const getCurrentView = (): GameView => {
    if (!game) {
      return view === 'create' ? 'create' : view === 'join' ? 'join' : 'menu';
    }

    if (game.status === 'finished') {
      return 'results';
    }

    if (game.status === 'waiting') {
      return 'lobby';
    }

    return 'play';
  };

  const currentView = getCurrentView();

  const handleCreateGame = async (data: CreateGameData) => {
    const newGame = await createGame(data, flashcards, jlptQuestions);
    if (newGame) {
      setView('lobby');
    }
  };

  const handleJoinGame = async () => {
    if (!joinCode.trim()) {
      setJoinError('Vui lòng nhập mã game');
      return;
    }
    const success = await joinGame(joinCode.trim());
    if (success) {
      setView('lobby');
    } else {
      setJoinError(error || 'Không thể tham gia game');
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    const success = await joinGameById(roomId);
    if (success) {
      setView('lobby');
    } else {
      setJoinError(error || 'Không thể tham gia game');
    }
  };

  const handleLeaveGame = async () => {
    await leaveGame();
    resetGame();
    setView('menu');
  };

  const handleBackToMenu = () => {
    resetGame();
    setView('menu');
    setJoinCode('');
  };

  // Main menu
  if (currentView === 'menu') {
    return (
      <div className="quiz-game-page">
        <div className="game-menu">
          <div className="game-menu-header">
            <div className="game-title-section">
              <h2>🏆 Đấu Trường Tri Thức</h2>
              <p className="game-description">
                Thử thách kiến thức tiếng Nhật cùng bạn bè!
              </p>
            </div>
            <div className="player-profile-section">
              <GameAvatarPicker
                currentAvatar={gameAvatar || currentUserAvatar}
                playerName={currentUserName}
                onSelect={setGameAvatar}
              />
              <span className="player-name">{currentUserName}</span>
            </div>
          </div>

          <div className="menu-buttons">
            <button
              className="btn btn-primary btn-large"
              onClick={() => setView('create')}
            >
              Tạo phòng mới
            </button>
            <button
              className="btn btn-secondary btn-large"
              onClick={() => setView('join')}
            >
              Sảnh chờ
            </button>
            <button
              className="btn btn-outline"
              onClick={onGoHome}
            >
              Quay lại
            </button>
          </div>

          <div className="game-rules">
            <h3>Luật chơi</h3>
            <ul>
              <li><strong>Tạo phòng:</strong> Host chọn bộ thẻ và số câu hỏi, sau đó chia sẻ mã phòng cho bạn bè.</li>
              <li><strong>Tham gia:</strong> Nhập mã phòng 6 ký tự để vào game.</li>
              <li><strong>Trả lời:</strong> Chọn đáp án đúng trong thời gian quy định. Trả lời nhanh = điểm cao hơn!</li>
              <li><strong>Power-ups:</strong> Sử dụng các kỹ năng đặc biệt để giành lợi thế.</li>
              <li><strong>Chiến thắng:</strong> Người có tổng điểm cao nhất khi kết thúc game sẽ thắng!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Join game view (Sảnh chờ)
  if (currentView === 'join') {
    return (
      <div className="quiz-game-page">
        <div className="game-lobby-join">
          <div className="lobby-header">
            <h2>🎮 Sảnh chờ</h2>
            <button className="btn btn-outline btn-small" onClick={handleBackToMenu}>
              ← Quay lại
            </button>
          </div>

          {/* Manual Code Entry - Top */}
          <div className="join-by-code-section top">
            <div className="join-form-inline">
              <input
                type="text"
                placeholder="Nhập mã phòng (VD: ABC123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="join-input-compact"
              />
              <button
                className="btn btn-primary"
                onClick={handleJoinGame}
                disabled={loading || !joinCode.trim()}
              >
                {loading ? '...' : 'Vào'}
              </button>
            </div>
            {joinError && <p className="error-message">{joinError}</p>}
          </div>

          {/* Available Rooms List */}
          <div className="available-rooms-section">
            <div className="section-header">
              <h3>Phòng đang chờ</h3>
              <span className="room-count">{availableRooms.length} phòng</span>
            </div>
            {loadingRooms ? (
              <div className="loading-rooms">
                <span className="loading-spinner">⏳</span>
                Đang tải danh sách phòng...
              </div>
            ) : availableRooms.length > 0 ? (
              <div className="room-list">
                {availableRooms.map((room) => {
                  const playerCount = Object.keys(room.players).length;
                  const hostName = Object.values(room.players).find(p => p.isHost)?.name || 'Unknown';
                  const sourceLabel = room.source === 'jlpt' ? 'JLPT' : 'Flashcards';
                  const contentDisplay = room.source === 'jlpt' && room.jlptLevels?.length
                    ? room.jlptLevels.join(', ')
                    : room.lessonNames?.length
                      ? room.lessonNames.join(', ') + (room.lessonNames.length < (room.lessonNames?.length || 0) ? '...' : '')
                      : '';
                  return (
                    <button
                      key={room.id}
                      className="room-item"
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={loading}
                    >
                      <div className="room-item-header">
                        <div className="room-info">
                          <span className="room-title">{room.title || 'Phòng chơi'}</span>
                          <div className="room-meta">
                            <span className="room-code">{room.code}</span>
                            <span className="room-source">{sourceLabel}</span>
                          </div>
                          <span className="room-host">Host: {hostName}</span>
                        </div>
                        <span className="room-status-badge">Đang chờ</span>
                      </div>
                      {contentDisplay && (
                        <div className="room-content-info">
                          <span className="room-content-label">📚 Nội dung:</span>
                          <span className="room-content-value">{contentDisplay}</span>
                        </div>
                      )}
                      <div className="room-settings">
                        <span className="room-setting-item">⏱️ {room.timePerQuestion}s/câu</span>
                        <span className="room-setting-item">👥 {playerCount}/{room.settings.maxPlayers}</span>
                        <span className="room-setting-item">📝 {room.totalRounds} câu</span>
                        {room.settings.timeBonus && <span className="room-setting-item bonus">⚡ Bonus</span>}
                      </div>
                      <div className="room-join-hint">
                        <span>Nhấn để tham gia</span>
                        <span className="join-arrow">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="no-rooms">
                <span className="empty-icon">🏠</span>
                <p>Chưa có phòng nào đang chờ</p>
                <p className="empty-hint">Hãy tạo phòng mới hoặc nhập mã phòng ở trên</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Create game view
  if (currentView === 'create') {
    return (
      <GameCreate
        flashcards={flashcards}
        jlptQuestions={jlptQuestions}
        getLessonsByLevel={getLessonsByLevel}
        getChildLessons={getChildLessons}
        onCreateGame={handleCreateGame}
        onCancel={handleBackToMenu}
        loading={loading}
        error={error}
        gameSettings={settings}
      />
    );
  }

  // Lobby view
  if (currentView === 'lobby' && game) {
    return (
      <>
        <GameLobby
          game={game}
          isHost={isHost}
          onStartGame={startGame}
          onKickPlayer={kickPlayer}
          onLeaveGame={handleLeaveGame}
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
        onPlayAgain={handleBackToMenu}
        onGoHome={onGoHome}
      />
    );
  }

  // Fallback loading state
  return (
    <div className="quiz-game-page">
      <div className="loading-state">
        <p>Đang tải...</p>
      </div>
    </div>
  );
}
