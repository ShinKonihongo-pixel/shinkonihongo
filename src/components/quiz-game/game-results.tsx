/**
 * GameResults — immersive end-of-game screen.
 * Shows winner, podium, split layout (personal stats + rankings), and footer actions.
 */
import { Trophy, Home, RotateCcw, Zap, BarChart3 } from 'lucide-react';
import type { QuizGame, GameResults as GameResultsType, GamePlayer } from '../../types/quiz-game';
import { isImageAvatar } from '../../utils/avatar-icons';
import { getVipNameStyle, getVipBadge, isVipRole } from '../../utils/vip-styling';

interface GameResultsProps {
  game: QuizGame;
  gameResults: GameResultsType | null;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

/** Render player avatar — handles image paths, URLs, emojis, and fallback initial */
function PlayerAvatar({ player, size = 'md' }: { player: GamePlayer; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = `results-avatar-${size}`;
  const isImage = player.avatar && isImageAvatar(player.avatar);

  return (
    <div className={`results-avatar ${sizeClass}`}>
      {isImage ? (
        <img src={player.avatar} alt={player.name} />
      ) : (
        <span className="results-avatar-text">
          {player.avatar || player.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

/** Render player name with VIP effects */
function PlayerName({ player, className = '' }: { player: GamePlayer; className?: string }) {
  const style = getVipNameStyle(player.role);
  const badge = getVipBadge(player.role);

  return (
    <span className={`${className} ${isVipRole(player.role) ? 'vip-name' : ''}`} style={style}>
      {badge && <span className="vip-badge">{badge}</span>}
      {player.name}
    </span>
  );
}

export function GameResults({
  game,
  gameResults,
  currentPlayerId,
  onPlayAgain,
  onGoHome,
}: GameResultsProps) {
  const players = Object.values(game.players).sort((a, b) => b.score - a.score);
  const myRank = players.findIndex(p => p.id === currentPlayerId) + 1;
  const myPlayer = players.find(p => p.id === currentPlayerId);
  const top3 = players.slice(0, 3);

  const myStats = gameResults?.rankings.find(r => r.playerId === currentPlayerId);

  // Podium: [2nd, 1st, 3rd] for Olympic centre-peak layout
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumClasses = ['second', 'first', 'third'];

  return (
    <div className="game-fullscreen game-results-screen">
      {/* Confetti */}
      <div className="results-confetti" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="results-confetti-piece" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      {/* Scrollable content area */}
      <div className="results-content">
        {/* Header */}
        <div className="results-screen-header">
          <Trophy size={36} className="results-trophy" />
          <h1 className="results-screen-title">Kết thúc!</h1>
          <p className="results-game-title">{game.title}</p>
        </div>

        {/* Winner highlight */}
        {players[0] && (
          <div className="results-winner">
            <PlayerAvatar player={players[0]} size="lg" />
            <PlayerName player={players[0]} className="results-winner-name" />
            <span className="results-winner-score">{players[0].score} điểm</span>
          </div>
        )}

        {/* Podium */}
        <div className="results-podium">
          {podiumOrder.map((player, displayIdx) => {
            if (!player) return null;
            const actualRank = podiumClasses[displayIdx] === 'first' ? 0
              : podiumClasses[displayIdx] === 'second' ? 1 : 2;
            const isMe = player.id === currentPlayerId;

            return (
              <div key={player.id} className={`results-podium-place ${podiumClasses[displayIdx]} ${isMe ? 'is-me' : ''}`}>
                <div className="results-podium-player">
                  <PlayerAvatar player={player} size={actualRank === 0 ? 'lg' : 'md'} />
                  <PlayerName player={player} className="results-podium-name" />
                  <span className="results-podium-score">{player.score}</span>
                </div>
                <div className="results-podium-stand">{actualRank + 1}</div>
              </div>
            );
          })}
        </div>

        {/* Split layout: Personal stats + Rankings */}
        <div className="results-summary-split">
          {/* Left: Personal stats */}
          {myPlayer && (
            <div className={`results-personal ${myRank <= 3 ? 'top-three' : ''}`}>
              <div className="results-personal-header">
                <span>Thành tích của bạn</span>
                <span className="results-personal-rank">#{myRank}</span>
              </div>
              <div className="results-personal-grid">
                <div className="results-personal-stat">
                  <Trophy size={16} className="stat-icon gold" />
                  <span className="results-personal-value">{myPlayer.score}</span>
                  <span className="results-personal-label">Điểm</span>
                </div>
                {myStats && (
                  <>
                    <div className="results-personal-stat">
                      <BarChart3 size={16} className="stat-icon green" />
                      <span className="results-personal-value">{myStats.accuracy}%</span>
                      <span className="results-personal-label">Chính xác</span>
                    </div>
                    <div className="results-personal-stat">
                      <Zap size={16} className="stat-icon purple" />
                      <span className="results-personal-value">{myStats.correctAnswers}/{myStats.totalAnswers}</span>
                      <span className="results-personal-label">Đúng</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Right: All players ranking */}
          <div className="results-rankings">
            <div className="results-rankings-header">Bảng xếp hạng</div>
            <div className="results-rankings-list">
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className={`results-rank-row ${player.id === currentPlayerId ? 'is-me' : ''}`}
                >
                  <span className="results-rank-num">#{idx + 1}</span>
                  <PlayerAvatar player={player} size="sm" />
                  <span className="results-rank-name">
                    <PlayerName player={player} />
                    {player.id === currentPlayerId && <span className="me-tag">Bạn</span>}
                  </span>
                  <span className="results-rank-score">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions — sticky at bottom */}
      <div className="results-footer">
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
