// Bingo Game Results - Show winner and rankings after game ends

import { Trophy } from 'lucide-react';
import type { BingoResults } from '../../types/bingo-game';
import { RankingsTable, ResultsActionBar, type BaseRankedPlayer } from '../shared/game-results';

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

  // Map to BaseRankedPlayer
  const rankedPlayers: BaseRankedPlayer[] = rankings.map((player, idx) => ({
    id: player.odinhId,
    displayName: player.displayName,
    avatar: player.avatar,
    rank: idx + 1,
    score: player.markedCount,
    isWinner: player.isWinner,
  }));

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
      <RankingsTable
        rankings={rankedPlayers}
        className="rankings-section"
        title="Bảng Xếp Hạng"
        columns={[
          {
            key: 'stats',
            label: 'Thống kê',
            render: (player) => {
              const originalPlayer = rankings.find(p => p.odinhId === player.id);
              return (
                <span className="ranking-stats">
                  ✓ {originalPlayer?.markedCount} số | 🏆 {originalPlayer?.completedRows} dãy hoàn thành
                </span>
              );
            },
          },
        ]}
      />

      {/* Action buttons */}
      <ResultsActionBar
        onPlayAgain={onPlayAgain}
        onGoHome={onGoHome}
        playAgainLabel="Chơi Lại"
        goHomeLabel="Về Trang Chủ"
      />
    </div>
  );
}
