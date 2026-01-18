// Bingo Game Results - Show winner and rankings after game ends

import { Trophy, RotateCcw, Home } from 'lucide-react';
import type { BingoResults } from '../../types/bingo-game';

interface BingoGameResultsProps {
  results: BingoResults;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function BingoGameResults({
  results,
  onPlayAgain,
  onGoHome,
}: BingoGameResultsProps) {
  const { winner, rankings, totalTurns, totalPlayers } = results;

  return (
    <div className="bingo-results">
      {/* Winner celebration */}
      {winner && (
        <div className="winner-celebration">
          <div className="confetti" />
          <div className="winner-trophy">
            <Trophy size={64} />
          </div>
          <h1>🎉 BINGO! 🎉</h1>
          <div className="winner-card">
            <span className="winner-avatar">{winner.avatar}</span>
            <span className="winner-name">{winner.displayName}</span>
            <span className="winner-label">Người Chiến Thắng!</span>
          </div>
        </div>
      )}

      {/* Game stats */}
      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-value">{totalTurns}</span>
          <span className="stat-label">Lượt Chơi</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalPlayers}</span>
          <span className="stat-label">Người Chơi</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{results.drawnNumbers.length}</span>
          <span className="stat-label">Số Đã Bốc</span>
        </div>
      </div>

      {/* Rankings */}
      <div className="rankings-section">
        <h3>Bảng Xếp Hạng</h3>
        <div className="rankings-list">
          {rankings.map((player, idx) => (
            <div
              key={player.odinhId}
              className={`ranking-item ${player.isWinner ? 'winner' : ''} rank-${idx + 1}`}
            >
              <div className="rank-badge">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </div>
              <div className="ranking-avatar">{player.avatar}</div>
              <div className="ranking-info">
                <span className="ranking-name">{player.displayName}</span>
                <span className="ranking-stats">
                  ✓ {player.markedCount} số | 🏆 {player.completedRows} dãy hoàn thành
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="results-actions">
        <button className="play-again-btn" onClick={onPlayAgain}>
          <RotateCcw size={20} />
          Chơi Lại
        </button>
        <button className="go-home-btn" onClick={onGoHome}>
          <Home size={20} />
          Về Trang Chủ
        </button>
      </div>
    </div>
  );
}
