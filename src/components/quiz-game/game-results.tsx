// Game results component - shows final rankings

import type { QuizGame, GameResults as GameResultsType } from '../../types/quiz-game';
import { isImageAvatar } from '../../utils/avatar-icons';

interface GameResultsProps {
  game: QuizGame;
  gameResults: GameResultsType | null;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function GameResults({
  game,
  gameResults: _gameResults, // Reserved for future detailed results
  currentPlayerId,
  onPlayAgain,
  onGoHome,
}: GameResultsProps) {
  // Use game.players if results not yet loaded
  const players = Object.values(game.players).sort((a, b) => b.score - a.score);
  const myRank = players.findIndex(p => p.id === currentPlayerId) + 1;
  const myPlayer = players.find(p => p.id === currentPlayerId);

  const getPositionEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getPositionClass = (rank: number) => {
    switch (rank) {
      case 1: return 'gold';
      case 2: return 'silver';
      case 3: return 'bronze';
      default: return '';
    }
  };

  return (
    <div className="quiz-game-page">
      <div className="game-results">
        <div className="results-header">
          <h2>Kết thúc!</h2>
          <p className="game-title">{game.title}</p>
        </div>

        <div className="winner-section">
          {players[0] && (
            <div className="winner-card">
              <span className="trophy">🏆</span>
              <span className="winner-name">{players[0].name}</span>
              <span className="winner-score">{players[0].score} điểm</span>
            </div>
          )}
        </div>

        <div className="podium">
          {players.slice(0, 3).map((player, index) => (
            <div
              key={player.id}
              className={`podium-item position-${index + 1} ${getPositionClass(index + 1)}`}
            >
              <div className="podium-rank">{getPositionEmoji(index + 1)}</div>
              <div className="podium-avatar">
                {player.avatar && isImageAvatar(player.avatar) ? (
                  <img src={player.avatar} alt="avatar" />
                ) : (
                  player.avatar || player.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="podium-name">{player.name}</div>
              <div className="podium-score">{player.score}</div>
            </div>
          ))}
        </div>

        {myRank > 3 && myPlayer && (
          <div className="my-result">
            <p>Bạn đứng hạng {myRank} với {myPlayer.score} điểm</p>
          </div>
        )}

        <div className="full-rankings">
          <h3>Bảng xếp hạng đầy đủ</h3>
          <div className="ranking-list">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`ranking-item ${player.id === currentPlayerId ? 'is-me' : ''} ${getPositionClass(index + 1)}`}
              >
                <span className="rank">{getPositionEmoji(index + 1)}</span>
                <span className="ranking-avatar">
                  {player.avatar && isImageAvatar(player.avatar) ? (
                    <img src={player.avatar} alt="avatar" />
                  ) : (
                    player.avatar || player.name.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="name">{player.name}</span>
                <span className="score">{player.score}</span>
                {player.streak >= 3 && (
                  <span className="streak">🔥 {player.streak}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Tổng câu hỏi</span>
            <span className="stat-value">{game.totalRounds}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Số người chơi</span>
            <span className="stat-value">{players.length}</span>
          </div>
        </div>

        <div className="results-actions">
          <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
            Chơi lại
          </button>
          <button className="btn btn-outline" onClick={onGoHome}>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
