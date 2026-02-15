// Word Match Results - Final game results
import React from 'react';
import type { WordMatchResults as Results } from '../../types/word-match';
import { Podium, RankingsTable, ResultsActionBar, type BaseRankedPlayer } from '../shared/game-results';

interface WordMatchResultsProps {
  results: Results;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const WordMatchResults: React.FC<WordMatchResultsProps> = ({
  results,
  currentPlayerId,
  onPlayAgain,
  onExit,
}) => {
  const currentPlayerResult = results.rankings.find((r) => r.odinhId === currentPlayerId);

  // Map to BaseRankedPlayer
  const rankedPlayers: BaseRankedPlayer[] = results.rankings.map(player => ({
    id: player.odinhId,
    displayName: player.displayName,
    avatar: player.avatar,
    rank: player.rank,
    score: player.score,
    isWinner: player.isWinner,
  }));

  return (
    <div className="word-match-results">
      <div className="results-header">
        <h1>🏆 Kết Quả Cuối Cùng</h1>
        <p>
          {results.totalRounds} câu • {results.totalPairs} cặp từ
        </p>
      </div>

      {/* Winner announcement */}
      {results.winner && (
        <div className="winner-section">
          <div className="confetti">🎊</div>
          <div className="winner-trophy">🏆</div>
          <div className="winner-info">
            <span className="winner-avatar">{results.winner.avatar}</span>
            <span className="winner-name">{results.winner.displayName}</span>
            <span className="winner-score">{results.winner.score} điểm</span>
          </div>
          <div className="winner-label">NGƯỜI CHIẾN THẮNG!</div>
        </div>
      )}

      {/* Podium */}
      <Podium
        players={rankedPlayers}
        renderPlayerExtra={(player) => <span>{player.score}</span>}
        showCrown={false}
      />

      {/* Your result */}
      {currentPlayerResult && (
        <div className="your-final-result">
          <h3>📊 Kết Quả Của Bạn</h3>
          <div className="result-stats">
            <div className="stat">
              <span className="stat-value">#{currentPlayerResult.rank}</span>
              <span className="stat-label">Xếp hạng</span>
            </div>
            <div className="stat">
              <span className="stat-value">{currentPlayerResult.score}</span>
              <span className="stat-label">Điểm</span>
            </div>
            <div className="stat">
              <span className="stat-value">{currentPlayerResult.correctPairs}</span>
              <span className="stat-label">Cặp đúng</span>
            </div>
            <div className="stat">
              <span className="stat-value">{currentPlayerResult.perfectRounds}</span>
              <span className="stat-label">Câu hoàn hảo</span>
            </div>
            <div className="stat">
              <span className="stat-value">{currentPlayerResult.accuracy}%</span>
              <span className="stat-label">Độ chính xác</span>
            </div>
          </div>
        </div>
      )}

      {/* Full rankings */}
      <RankingsTable
        rankings={rankedPlayers}
        currentPlayerId={currentPlayerId}
        title="📋 Bảng Xếp Hạng Đầy Đủ"
        className="rankings-table"
        columns={[
          {
            key: 'pairs',
            label: 'Cặp đúng',
            render: (player) => {
              const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
              return <span className="col-pairs">{originalPlayer?.correctPairs}</span>;
            },
          },
          {
            key: 'perfect',
            label: 'Hoàn hảo',
            render: (player) => {
              const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
              return <span className="col-perfect">{originalPlayer?.perfectRounds}</span>;
            },
          },
          {
            key: 'accuracy',
            label: 'Chính xác',
            render: (player) => {
              const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
              return <span className="col-accuracy">{originalPlayer?.accuracy}%</span>;
            },
          },
        ]}
      />

      {/* Actions */}
      <ResultsActionBar
        onPlayAgain={onPlayAgain}
        onGoHome={onExit}
        playAgainLabel="🔄 Chơi Lại"
        goHomeLabel="🚪 Thoát"
        playAgainIcon={null}
        goHomeIcon={null}
      />
    </div>
  );
};
