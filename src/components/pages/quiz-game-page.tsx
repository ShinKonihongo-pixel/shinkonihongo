// Main Quiz Game page that manages game state and renders appropriate UI

import { useState, useEffect } from 'react';
import type { Flashcard, JLPTLevel, Lesson } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { CreateGameData } from '../../types/quiz-game';
import type { AppSettings } from '../../hooks/use-settings';
import { useQuizGame } from '../../hooks/use-quiz-game';
import { GameCreate } from '../quiz-game/game-create';
import { GameLobby } from '../quiz-game/game-lobby';
import { GamePlay } from '../quiz-game/game-play';
import { GameResults } from '../quiz-game/game-results';

interface QuizGamePageProps {
  currentUserId: string;
  currentUserName: string;
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onGoHome: () => void;
  initialJoinCode?: string | null;
  onJoinCodeUsed?: () => void;
  settings: AppSettings;
}

type GameView = 'menu' | 'create' | 'join' | 'lobby' | 'play' | 'results';

export function QuizGamePage({
  currentUserId,
  currentUserName,
  flashcards,
  jlptQuestions,
  getLessonsByLevel,
  getChildLessons,
  onGoHome,
  initialJoinCode,
  onJoinCodeUsed,
  settings,
}: QuizGamePageProps) {
  const [view, setView] = useState<GameView>(initialJoinCode ? 'join' : 'menu');
  const [joinCode, setJoinCode] = useState(initialJoinCode || '');
  const [joinError, setJoinError] = useState('');
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

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
    resetGame,
  } = useQuizGame({
    playerId: currentUserId,
    playerName: currentUserName,
  });

  // Auto-join game when initialJoinCode is provided (from QR code scan)
  useEffect(() => {
    if (initialJoinCode && !autoJoinAttempted && !game) {
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
    setJoinError('');
    const success = await joinGame(joinCode.trim());
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
    setJoinError('');
  };

  // Main menu
  if (currentView === 'menu') {
    return (
      <div className="quiz-game-page">
        <div className="game-menu">
          <h2>Đấu Trường Tri Thức</h2>
          <p className="game-description">
            Thử thách kiến thức tiếng Nhật cùng bạn bè!
          </p>

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
              Tham gia phòng
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

  // Join game view
  if (currentView === 'join') {
    return (
      <div className="quiz-game-page">
        <div className="game-join">
          <h2>Tham gia phòng</h2>
          <p>Nhập mã phòng để tham gia:</p>

          <div className="join-form">
            <input
              type="text"
              placeholder="Mã phòng (6 ký tự)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="join-input"
            />
            {joinError && <p className="error-message">{joinError}</p>}
            <div className="join-buttons">
              <button
                className="btn btn-primary"
                onClick={handleJoinGame}
                disabled={loading}
              >
                {loading ? 'Đang tham gia...' : 'Tham gia'}
              </button>
              <button
                className="btn btn-outline"
                onClick={handleBackToMenu}
              >
                Hủy
              </button>
            </div>
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
      <GameLobby
        game={game}
        isHost={isHost}
        onStartGame={startGame}
        onKickPlayer={kickPlayer}
        onLeaveGame={handleLeaveGame}
        error={error}
      />
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
