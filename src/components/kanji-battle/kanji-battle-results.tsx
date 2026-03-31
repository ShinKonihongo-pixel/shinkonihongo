// Kanji Battle Results - Final game results
import React from 'react';
import { StatCard } from '../ui/stat-card';
import type { KanjiBattleResults as Results } from '../../types/kanji-battle';
import { Podium, RankingsTable, ResultsActionBar, type BaseRankedPlayer } from '../shared/game-results';

interface KanjiBattleResultsProps {
  results: Results;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const KanjiBattleResults: React.FC<KanjiBattleResultsProps> = ({
  results,
  currentPlayerId,
  onPlayAgain,
  onExit,
}) => {
  const currentPlayerResult = results.rankings.find(r => r.odinhId === currentPlayerId);

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
    <div className="speed-quiz-results">
      <div className="results-header">
        <h1>🏆 Kết Quả Đại Chiến Kanji</h1>
        <p>{results.totalRounds} câu hỏi &bull; {results.totalPlayers} người chơi</p>
      </div>

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

      <Podium
        players={rankedPlayers}
        renderPlayerExtra={(player) => <span>{player.score}</span>}
        showCrown={false}
      />

      {currentPlayerResult && (
        <div className="your-final-result">
          <h3>📊 Kết Quả Của Bạn</h3>
          <div className="result-stats">
            <StatCard value={`#${currentPlayerResult.rank}`} label="Xếp hạng" />
            <StatCard value={currentPlayerResult.score} label="Điểm" />
            <StatCard value={currentPlayerResult.correctAnswers} label="Đúng" />
            <StatCard value={`${currentPlayerResult.accuracy.toFixed(0)}%`} label="Độ chính xác" />
            {currentPlayerResult.avgStrokeScore !== undefined && (
              <StatCard value={`${currentPlayerResult.avgStrokeScore?.toFixed(0)}%`} label="TB nét vẽ" />
            )}
          </div>
        </div>
      )}

      <RankingsTable
        rankings={rankedPlayers}
        currentPlayerId={currentPlayerId}
        title="📋 Bảng Xếp Hạng Đầy Đủ"
        className="rankings-table"
        columns={[
          {
            key: 'correct',
            label: 'Đúng',
            render: (player) => {
              const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
              return <span className="col-correct">{originalPlayer?.correctAnswers}</span>;
            },
          },
          {
            key: 'accuracy',
            label: 'Chính xác',
            render: (player) => {
              const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
              return <span className="col-accuracy">{originalPlayer?.accuracy.toFixed(0)}%</span>;
            },
          },
        ]}
      />

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
