// Game results — dark immersive final rankings
import { Trophy, Crown, Medal, Award, Home, RotateCcw, Flame } from 'lucide-react';
import type { QuizGame, GameResults as GameResultsType } from '../../types/quiz-game';

interface GameResultsProps {
  game: QuizGame;
  gameResults: GameResultsType | null;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function GameResults({
  game,
  currentPlayerId,
  onPlayAgain,
  onGoHome,
}: GameResultsProps) {
  const players = Object.values(game.players).sort((a, b) => b.score - a.score);
  const myRank = players.findIndex(p => p.id === currentPlayerId) + 1;
  const myPlayer = players.find(p => p.id === currentPlayerId);
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="game-fullscreen game-results-screen">
      {/* Header */}
      <div className="results-screen-header">
        <Trophy size={36} className="results-trophy" />
        <h1 className="results-screen-title">Kết thúc!</h1>
        <p className="results-game-title">{game.title}</p>
      </div>

      {/* Winner highlight */}
      {players[0] && (
        <div className="results-winner">
          <Crown size={28} className="results-winner-crown" />
          <span className="results-winner-name">{players[0].name}</span>
          <span className="results-winner-score">{players[0].score} điểm</span>
        </div>
      )}

      {/* Podium */}
      <div className="results-podium">
        {top3[1] && (
          <div className="results-podium-place second">
            <div className="results-podium-player">
              <Medal size={22} className="medal silver" />
              <span className="results-podium-name">{top3[1].name}</span>
              <span className="results-podium-score">{top3[1].score}</span>
            </div>
            <div className="results-podium-stand">2</div>
          </div>
        )}
        {top3[0] && (
          <div className="results-podium-place first">
            <div className="results-podium-player">
              <Crown size={26} className="crown" />
              <span className="results-podium-name">{top3[0].name}</span>
              <span className="results-podium-score">{top3[0].score}</span>
              {top3[0].streak >= 3 && (
                <span className="streak-fire"><Flame size={14} /> {top3[0].streak}</span>
              )}
            </div>
            <div className="results-podium-stand">1</div>
          </div>
        )}
        {top3[2] && (
          <div className="results-podium-place third">
            <div className="results-podium-player">
              <Award size={20} className="medal bronze" />
              <span className="results-podium-name">{top3[2].name}</span>
              <span className="results-podium-score">{top3[2].score}</span>
            </div>
            <div className="results-podium-stand">3</div>
          </div>
        )}
      </div>

      {/* My result if not top 3 */}
      {myRank > 3 && myPlayer && (
        <div className="results-my-rank">
          Bạn đứng hạng <strong>#{myRank}</strong> với <strong>{myPlayer.score}</strong> điểm
        </div>
      )}

      {/* Full rankings */}
      {rest.length > 0 && (
        <div className="results-rankings">
          {rest.map((player, idx) => (
            <div
              key={player.id}
              className={`results-rank-row ${player.id === currentPlayerId ? 'is-me' : ''}`}
            >
              <span className="results-rank-num">#{idx + 4}</span>
              <span className="results-rank-name">
                {player.name}
                {player.id === currentPlayerId && <span className="me-tag">Bạn</span>}
              </span>
              <span className="results-rank-score">{player.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="results-stats">
        <div className="results-stat">
          <span className="results-stat-value">{game.totalRounds}</span>
          <span className="results-stat-label">Câu hỏi</span>
        </div>
        <div className="results-stat">
          <span className="results-stat-value">{players.length}</span>
          <span className="results-stat-label">Người chơi</span>
        </div>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="results-play-again" onClick={onPlayAgain}>
          <RotateCcw size={18} />
          Chơi lại
        </button>
        <button className="results-go-home" onClick={onGoHome}>
          <Home size={18} />
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
