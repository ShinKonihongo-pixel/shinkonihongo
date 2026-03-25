/**
 * GameResults — the final screen shown once the game ends.
 *
 * Shows a celebration confetti animation, the winner highlight, an Olympic
 * podium for top 3, a personal performance card, and a scrollable list for
 * all remaining players.  Actions allow the host to start another game or
 * navigate home.
 */
import { Trophy, Crown, Medal, Award, Home, RotateCcw, Flame, Target, Zap, BarChart3 } from 'lucide-react';
import type { QuizGame, GameResults as GameResultsType } from '../../types/quiz-game';

/**
 * Props for GameResults.
 *
 * @prop game             - Completed game state (players, title, totalRounds).
 * @prop gameResults      - Server-computed final stats (accuracy, streaks, etc.).
 *                          May be null if the server summary hasn't arrived yet;
 *                          the component falls back to live game.players data.
 * @prop currentPlayerId  - ID of the local player, used to highlight their row.
 * @prop onPlayAgain      - Callback to reset and start a new game with same settings.
 * @prop onGoHome         - Callback to exit to the main lobby / home screen.
 */
interface GameResultsProps {
  game: QuizGame;
  gameResults: GameResultsType | null;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

/**
 * Renders the immersive end-of-game results screen.
 * Derives rankings directly from `game.players` so the UI is never blocked
 * on the `gameResults` summary document.
 */
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
  const rest = players.slice(3);

  // gameResults contains richer server-computed stats (accuracy %, longest streak).
  // When it's available we show the full card; otherwise we fall back to the
  // basic live-game fields (score, current streak) so the UI never stays empty.
  const myStats = gameResults?.rankings.find(r => r.playerId === currentPlayerId);

  // Podium columns follow Olympic convention: [2nd, 1st, 3rd] left-to-right
  // so the winner stands tallest in the visual centre.
  const podiumOrder = [top3[1], top3[0], top3[2]];
  // CSS class controls column height; index aligns with podiumOrder, not actual rank.
  const podiumClasses = ['second', 'first', 'third'];
  // Icon array indexed by actual rank (0=1st/Crown, 1=2nd/Medal, 2=3rd/Award)
  const podiumIcons = [Medal, Crown, Award];
  const podiumSizes = [22, 26, 20];

  return (
    <div className="game-fullscreen game-results-screen">
      {/* Confetti — 12 CSS-animated pieces; `--i` is a custom property used by the
          CSS animation to stagger each piece's delay and trajectory randomly.
          aria-hidden keeps it invisible to screen readers (purely decorative). */}
      <div className="results-confetti" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="results-confetti-piece" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

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
        {podiumOrder.map((player, displayIdx) => {
          if (!player) return null;
          // Re-map display index back to actual rank so we pick the right icon/size/color.
          // displayIdx is 0=2nd, 1=1st, 2=3rd because of the Olympic centre-peak layout.
          const actualRank = podiumClasses[displayIdx] === 'first' ? 0 : podiumClasses[displayIdx] === 'second' ? 1 : 2;
          const Icon = podiumIcons[actualRank];
          const iconSize = podiumSizes[actualRank];
          const isMe = player.id === currentPlayerId;
          // Medal colours: gold (1st), silver (2nd), bronze (3rd)
          const medalColor = actualRank === 0 ? '#ffd700' : actualRank === 1 ? '#c0c0c0' : '#cd7f32';

          return (
            <div key={player.id} className={`results-podium-place ${podiumClasses[displayIdx]} ${isMe ? 'is-me' : ''}`}>
              <div className="results-podium-player">
                <Icon size={iconSize} style={{ color: medalColor }} />
                <div className="results-podium-avatar">{player.name.charAt(0).toUpperCase()}</div>
                <span className="results-podium-name">{player.name}</span>
                <span className="results-podium-score">{player.score}</span>
                {player.streak >= 3 && (
                  <span className="streak-fire"><Flame size={14} /> {player.streak}</span>
                )}
              </div>
              <div className="results-podium-stand">{actualRank + 1}</div>
            </div>
          );
        })}
      </div>

      {/* Personal performance card — always derived from game.players for instant render.
          When the server-computed `gameResults` doc is available, swap in richer stats
          (accuracy %, correct/total counts, longest streak across the whole game).
          The `top-three` class adds a gold-border highlight for podium finishers. */}
      {myPlayer && (
        <div className={`results-personal ${myRank <= 3 ? 'top-three' : ''}`}>
          <div className="results-personal-header">
            <Target size={16} />
            <span>Thành tích của bạn</span>
            <span className="results-personal-rank">#{myRank}</span>
          </div>
          <div className="results-personal-grid">
            {/* Score is always available from live game state */}
            <div className="results-personal-stat">
              <Trophy size={16} className="stat-icon gold" />
              <span className="results-personal-value">{myPlayer.score}</span>
              <span className="results-personal-label">Điểm</span>
            </div>
            {myStats ? (
              // Full stat set from server-computed gameResults document
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
                <div className="results-personal-stat">
                  <Flame size={16} className="stat-icon orange" />
                  <span className="results-personal-value">{myStats.longestStreak}</span>
                  <span className="results-personal-label">Streak tốt nhất</span>
                </div>
              </>
            ) : (
              // Fallback when gameResults hasn't arrived yet — show live streak only
              <>
                <div className="results-personal-stat">
                  <Zap size={16} className="stat-icon purple" />
                  <span className="results-personal-value">{myPlayer.streak}</span>
                  <span className="results-personal-label">Streak hiện tại</span>
                </div>
              </>
            )}
          </div>
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
              <span className="results-rank-avatar">{player.name.charAt(0).toUpperCase()}</span>
              <span className="results-rank-name">
                {player.name}
                {player.id === currentPlayerId && <span className="me-tag">Bạn</span>}
              </span>
              <span className="results-rank-score">{player.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* Game stats summary */}
      <div className="results-stats">
        <div className="results-stat">
          <span className="results-stat-value">{game.totalRounds}</span>
          <span className="results-stat-label">Câu hỏi</span>
        </div>
        <div className="results-stat">
          <span className="results-stat-value">{players.length}</span>
          <span className="results-stat-label">Người chơi</span>
        </div>
        {players[0] && (
          <div className="results-stat">
            <span className="results-stat-value">{players[0].score}</span>
            <span className="results-stat-label">Điểm cao nhất</span>
          </div>
        )}
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
