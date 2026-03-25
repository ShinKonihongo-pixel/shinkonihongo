/**
 * GameLeaderboard — mid-game standings screen shown between rounds.
 *
 * Displays a visual podium for the top 3 players, a scrollable list for
 * everyone else, and a personalised rank callout for players outside the
 * top 3. Auto-advances after `revealTimer` seconds.
 */
import { useState } from 'react';
import { Trophy, Crown, Medal, Award, ArrowLeft, Flame, Target } from 'lucide-react';
import type { QuizGame, GamePlayer } from '../../../types/quiz-game';
import { ConfirmModal } from '../../ui/confirm-modal';

/**
 * Props for GameLeaderboard.
 *
 * @prop game           - Full game state; used for round progress display (currentRound / totalRounds).
 * @prop currentPlayer  - The local player; null when the host is spectating.
 * @prop sortedPlayers  - All players pre-sorted by score descending.
 * @prop revealTimer    - Seconds remaining before the game moves to the next question.
 * @prop onLeaveGame    - Async callback invoked after leave confirmation.
 */
interface GameLeaderboardProps {
  game: QuizGame;
  currentPlayer: GamePlayer | null;
  sortedPlayers: GamePlayer[];
  revealTimer: number;
  onLeaveGame: () => Promise<void>;
}

// Icon and size for each podium rank (index 0 = 1st, 1 = 2nd, 2 = 3rd)
const PODIUM_ICONS = [Crown, Medal, Award];
const PODIUM_SIZES = [26, 22, 20];

/**
 * Renders the between-round leaderboard with a classic Olympic podium layout.
 * Players ranked 4th and below appear in a scrollable list below the podium.
 */
export function GameLeaderboard({
  game,
  currentPlayer,
  sortedPlayers,
  revealTimer,
  onLeaveGame,
}: GameLeaderboardProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const top3 = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);
  const myRank = sortedPlayers.findIndex(p => p.id === currentPlayer?.id) + 1;

  // Podium columns are ordered [2nd, 1st, 3rd] left-to-right so the winner
  // stands tallest in the visual centre, matching the classic Olympic layout.
  const podiumOrder = [top3[1], top3[0], top3[2]];
  // CSS class drives column height; index matches podiumOrder, not actual rank.
  const podiumClasses = ['second', 'first', 'third'];

  return (
    <div className="game-fullscreen gl-screen">
      <div className="gr-nav">
        <button className="gq-nav-btn" onClick={() => setShowLeaveConfirm(true)}>
          <ArrowLeft size={18} />
        </button>
        <div className="gr-timer-pill">{revealTimer}s</div>
      </div>

      <div className="gl-header">
        <Trophy size={28} className="gl-trophy" />
        <h2>Bảng Xếp Hạng</h2>
        <p>Sau câu {game.currentRound + 1}/{game.totalRounds}</p>
      </div>

      {/* Podium with avatars */}
      <div className="gl-podium">
        {podiumOrder.map((player, displayIdx) => {
          if (!player) return null;
          const actualRank = podiumClasses[displayIdx] === 'first' ? 0 : podiumClasses[displayIdx] === 'second' ? 1 : 2;
          const Icon = PODIUM_ICONS[actualRank];
          const iconSize = PODIUM_SIZES[actualRank];
          const isMe = player.id === currentPlayer?.id;

          return (
            <div key={player.id} className={`gl-pod ${podiumClasses[displayIdx]} ${isMe ? 'is-me' : ''}`}>
              {/* Medal icon sized relative to rank importance */}
              <Icon size={iconSize} />
              <div className="gl-pod-avatar">{player.name.charAt(0).toUpperCase()}</div>
              <span className="gl-pod-name">{player.name}</span>
              <span className="gl-pod-score">{player.score}</span>
              {/* Only show streak badge when it's noteworthy (3+) */}
              {player.streak >= 3 && (
                <span className="gl-pod-streak"><Flame size={12} />{player.streak}</span>
              )}
              {/* Numeric rank label on the stand block for clarity */}
              <div className="gl-pod-stand">{actualRank + 1}</div>
            </div>
          );
        })}
      </div>

      {/* My rank callout — only shown when the local player is outside the visible podium,
          so they can still see their standing without scrolling through the full list */}
      {myRank > 3 && currentPlayer && (
        <div className="gl-my-rank">
          <Target size={14} />
          <span>Bạn đứng hạng <strong>#{myRank}</strong> với <strong>{currentPlayer.score}</strong> điểm</span>
        </div>
      )}

      {/* Rest of players */}
      {rest.length > 0 && (
        <div className="gl-rest">
          {rest.map((p, i) => {
            const isMe = p.id === currentPlayer?.id;
            return (
              <div key={p.id} className={`gr-rank-row ${isMe ? 'me' : ''}`}
                style={{ animationDelay: `${0.3 + i * 0.05}s` }}>
                <span className="gr-rank-pos">#{i + 4}</span>
                <span className="gr-rank-avatar">{p.name.charAt(0).toUpperCase()}</span>
                <span className="gr-rank-name">
                  {p.name}{isMe && <em>Bạn</em>}
                </span>
                {p.streak >= 2 && (
                  <span className="gr-rank-streak"><Flame size={11} />{p.streak}</span>
                )}
                <span className="gr-rank-score"><Trophy size={12} />{p.score}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="gr-progress">
        <div className="gr-progress-fill" style={{ width: `${(revealTimer / 5) * 100}%` }} />
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời khỏi game?"
        message="Bạn có chắc muốn rời khỏi game đang chơi?"
        confirmText="Rời game"
        cancelText="Ở lại"
        onConfirm={onLeaveGame}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
