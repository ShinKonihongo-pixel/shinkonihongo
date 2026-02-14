// Leaderboard — premium animated rankings
import { Trophy, Crown, Medal, Award, LogOut, Flame } from 'lucide-react';
import type { QuizGame, GamePlayer } from '../../../types/quiz-game';

interface GameLeaderboardProps {
  game: QuizGame;
  currentPlayer: GamePlayer | null;
  sortedPlayers: GamePlayer[];
  revealTimer: number;
  onLeaveGame: () => Promise<void>;
}

export function GameLeaderboard({
  game,
  currentPlayer,
  sortedPlayers,
  revealTimer,
  onLeaveGame,
}: GameLeaderboardProps) {
  const top3 = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);

  return (
    <div className="game-fullscreen game-leaderboard-screen">
      <button className="leave-game-btn floating" onClick={onLeaveGame} title="Rời game">
        <LogOut size={18} /> Rời
      </button>

      <div className="leaderboard-header">
        <Trophy size={32} className="trophy-icon" />
        <h2>Bảng Xếp Hạng</h2>
        <p className="round-progress">
          Sau câu {game.currentRound + 1}/{game.totalRounds}
        </p>
      </div>

      {/* Podium */}
      <div className="podium">
        {top3[1] && (
          <div className="podium-place second" style={{ animationDelay: '0.2s' }}>
            <div className="podium-player">
              <Medal size={24} className="medal silver" />
              <span className="podium-name">{top3[1].name}</span>
              <span className="podium-score">{top3[1].score}</span>
            </div>
            <div className="podium-stand">2</div>
          </div>
        )}
        {top3[0] && (
          <div className="podium-place first" style={{ animationDelay: '0.35s' }}>
            <div className="podium-player">
              <Crown size={28} className="crown" />
              <span className="podium-name">{top3[0].name}</span>
              <span className="podium-score">{top3[0].score}</span>
              {top3[0].streak >= 3 && (
                <span className="streak-fire"><Flame size={14} /> {top3[0].streak}</span>
              )}
            </div>
            <div className="podium-stand">1</div>
          </div>
        )}
        {top3[2] && (
          <div className="podium-place third" style={{ animationDelay: '0.15s' }}>
            <div className="podium-player">
              <Award size={22} className="medal bronze" />
              <span className="podium-name">{top3[2].name}</span>
              <span className="podium-score">{top3[2].score}</span>
            </div>
            <div className="podium-stand">3</div>
          </div>
        )}
      </div>

      {/* Rest of players */}
      {rest.length > 0 && (
        <div className="leaderboard-rest">
          {rest.map((player, index) => (
            <div
              key={player.id}
              className={`leaderboard-row ${player.id === currentPlayer?.id ? 'is-me' : ''}`}
              style={{ animationDelay: `${0.4 + index * 0.06}s` }}
            >
              <span className="row-rank">#{index + 4}</span>
              <span className="row-name">
                {player.name}
                {player.id === currentPlayer?.id && <span className="me-tag">Bạn</span>}
              </span>
              <span className="row-score">{player.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* Timer bar */}
      <div className="reveal-timer-bar">
        <div className="timer-fill" style={{ width: `${(revealTimer / 5) * 100}%` }} />
        <span className="timer-text">Câu tiếp theo sau {revealTimer}s</span>
      </div>
    </div>
  );
}
