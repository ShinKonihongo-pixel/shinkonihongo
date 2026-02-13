// Golden Bell Results - Final game results and rankings
// Shows winner, rankings, and statistics

import { Trophy, Crown, Target, Users, Skull } from 'lucide-react';
import type { GoldenBellResults } from '../../types/golden-bell';
import { Podium, RankingsTable, ResultsActionBar, type BaseRankedPlayer } from '../shared/game-results';

interface GoldenBellResultsProps {
  results: GoldenBellResults;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

// Rank display info
const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

export function GoldenBellResultsView({
  results,
  currentPlayerId,
  onPlayAgain,
  onGoHome,
}: GoldenBellResultsProps) {
  const currentPlayerResult = results.rankings.find(r => r.odinhId === currentPlayerId);
  const currentRank = currentPlayerResult?.rank || 0;

  // Map to BaseRankedPlayer
  const rankedPlayers: BaseRankedPlayer[] = results.rankings.map(player => ({
    id: player.odinhId,
    displayName: player.displayName,
    avatar: player.avatar,
    rank: player.rank,
    score: player.correctAnswers,
    isWinner: player.isWinner,
  }));

  return (
    <div className="golden-bell-results">
      {/* Header */}
      <div className="results-header golden-bell-header">
        <div className="results-icon bell-icon">
          <Trophy size={48} />
        </div>
        <h1>Kết Thúc</h1>
        <p>{results.totalPlayers} người chơi • {results.totalQuestions} câu hỏi</p>
      </div>

      {/* Winner Announcement */}
      {results.winner && (
        <div className="winner-announcement">
          <div className="winner-crown">
            <Crown size={48} />
          </div>
          <div className="winner-avatar">{results.winner.avatar}</div>
          <h2>{results.winner.displayName}</h2>
          <p className="winner-title">Người Chiến Thắng!</p>
          <div className="winner-stats">
            <span>{results.winner.correctAnswers} câu đúng</span>
            <span>•</span>
            <span>{results.winner.accuracy}% chính xác</span>
            <span>•</span>
            <span>Streak: {results.winner.longestStreak}</span>
          </div>
        </div>
      )}

      {/* No Winner */}
      {!results.winner && (
        <div className="no-winner">
          <Skull size={48} />
          <h2>Không có người thắng!</h2>
          <p>Tất cả mọi người đều đã bị loại</p>
        </div>
      )}

      {/* Podium */}
      <Podium
        players={rankedPlayers}
        className="golden-bell-podium"
        renderPlayerExtra={(player) => {
          const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
          return <span>{originalPlayer?.survivedRounds} vòng</span>;
        }}
        showCrown={true}
        medalEmojis={RANK_EMOJIS}
      />

      {/* Your Result */}
      {currentPlayerResult && (
        <div className={`your-result ${currentPlayerResult.isWinner ? 'winner' : ''} ${currentRank <= 3 ? 'top-three' : ''}`}>
          <div className="your-result-header">
            <Trophy size={24} />
            <span>Kết quả của bạn</span>
          </div>
          <div className="your-result-content">
            <div className="result-position">
              {currentRank <= 3 ? RANK_EMOJIS[currentRank - 1] : `#${currentRank}`}
            </div>
            <div className="result-stats">
              <div className="result-stat">
                <Target size={16} />
                <span>Độ chính xác: {currentPlayerResult.accuracy}%</span>
              </div>
              <div className="result-stat">
                <span>✓ Đúng: {currentPlayerResult.correctAnswers}/{results.totalQuestions}</span>
              </div>
              <div className="result-stat">
                <Users size={16} />
                <span>Sống sót: {currentPlayerResult.survivedRounds} vòng</span>
              </div>
              <div className="result-stat">
                <span>Streak cao nhất: {currentPlayerResult.longestStreak}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <RankingsTable
        rankings={rankedPlayers}
        currentPlayerId={currentPlayerId}
        className="golden-bell-rankings"
        title="Bảng Xếp Hạng"
        medalEmojis={RANK_EMOJIS}
        columns={[
          {
            key: 'survived',
            label: 'Sống sót',
            render: (player) => {
              const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
              return (
                <>
                  <span className="ranking-survived">Sống {originalPlayer?.survivedRounds} vòng</span>
                  <span className="ranking-accuracy">{originalPlayer?.accuracy}%</span>
                </>
              );
            },
          },
        ]}
      />

      {/* Actions */}
      <ResultsActionBar
        onPlayAgain={onPlayAgain}
        onGoHome={onGoHome}
        playAgainLabel="Chơi Lại"
        goHomeLabel="Về Trang Chủ"
      />
    </div>
  );
}
