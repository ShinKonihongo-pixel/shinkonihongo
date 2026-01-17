// Golden Bell Results - Final game results and rankings
// Shows winner, rankings, and statistics

import { Trophy, Crown, Target, Home, RotateCcw, Users, Skull } from 'lucide-react';
import type { GoldenBellResults } from '../../types/golden-bell';

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
  const top3 = results.rankings.slice(0, 3);

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
      <div className="results-podium golden-bell-podium">
        {/* 2nd Place */}
        {top3[1] && (
          <div className="podium-place second">
            <div className="podium-player">
              <span className="player-avatar">{top3[1].avatar}</span>
            </div>
            <span className="player-name">{top3[1].displayName}</span>
            <div className="podium-stats">
              <span>{top3[1].survivedRounds} vòng</span>
            </div>
            <div className="podium-block">
              <span className="medal">{RANK_EMOJIS[1]}</span>
              <span className="position">2</span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <div className="podium-place first">
            <div className="winner-crown">
              <Crown size={32} />
            </div>
            <div className="podium-player">
              <span className="player-avatar">{top3[0].avatar}</span>
            </div>
            <span className="player-name">{top3[0].displayName}</span>
            <div className="podium-stats">
              <span>{top3[0].survivedRounds} vòng</span>
            </div>
            <div className="podium-block">
              <span className="medal">{RANK_EMOJIS[0]}</span>
              <span className="position">1</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <div className="podium-place third">
            <div className="podium-player">
              <span className="player-avatar">{top3[2].avatar}</span>
            </div>
            <span className="player-name">{top3[2].displayName}</span>
            <div className="podium-stats">
              <span>{top3[2].survivedRounds} vòng</span>
            </div>
            <div className="podium-block">
              <span className="medal">{RANK_EMOJIS[2]}</span>
              <span className="position">3</span>
            </div>
          </div>
        )}
      </div>

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
      <div className="full-rankings golden-bell-rankings">
        <h3>Bảng Xếp Hạng</h3>
        <div className="rankings-list">
          {results.rankings.map((player, idx) => (
            <div
              key={player.odinhId}
              className={`ranking-item ${player.odinhId === currentPlayerId ? 'current' : ''} ${player.isWinner ? 'winner' : ''}`}
            >
              <div className="ranking-position">
                {idx < 3 ? RANK_EMOJIS[idx] : `#${idx + 1}`}
              </div>
              <div className="ranking-avatar">{player.avatar}</div>
              <div className="ranking-info">
                <span className="ranking-name">
                  {player.displayName}
                  {player.isWinner && <Crown size={14} className="winner-icon" />}
                </span>
                <span className="ranking-survived">Sống {player.survivedRounds} vòng</span>
              </div>
              <div className="ranking-stats">
                <span className="ranking-correct">{player.correctAnswers} đúng</span>
                <span className="ranking-accuracy">{player.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="play-again-btn golden-bell-btn" onClick={onPlayAgain}>
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
