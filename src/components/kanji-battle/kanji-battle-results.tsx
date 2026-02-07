// Kanji Battle Results - Final game results
import React from 'react';
import type { KanjiBattleResults as Results, KanjiBattlePlayerResult } from '../../types/kanji-battle';

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
  const top3 = results.rankings.slice(0, 3);

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

      <div className="podium">
        {top3[1] && (
          <div className="podium-place second">
            <div className="podium-player">
              <span className="medal">🥈</span>
              <span className="avatar">{top3[1].avatar}</span>
              <span className="name">{top3[1].displayName}</span>
              <span className="score">{top3[1].score}</span>
            </div>
            <div className="podium-stand">2</div>
          </div>
        )}
        {top3[0] && (
          <div className="podium-place first">
            <div className="podium-player">
              <span className="medal">🥇</span>
              <span className="avatar">{top3[0].avatar}</span>
              <span className="name">{top3[0].displayName}</span>
              <span className="score">{top3[0].score}</span>
            </div>
            <div className="podium-stand">1</div>
          </div>
        )}
        {top3[2] && (
          <div className="podium-place third">
            <div className="podium-player">
              <span className="medal">🥉</span>
              <span className="avatar">{top3[2].avatar}</span>
              <span className="name">{top3[2].displayName}</span>
              <span className="score">{top3[2].score}</span>
            </div>
            <div className="podium-stand">3</div>
          </div>
        )}
      </div>

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
              <span className="stat-value">{currentPlayerResult.correctAnswers}</span>
              <span className="stat-label">Đúng</span>
            </div>
            <div className="stat">
              <span className="stat-value">{currentPlayerResult.accuracy.toFixed(0)}%</span>
              <span className="stat-label">Độ chính xác</span>
            </div>
            {currentPlayerResult.avgStrokeScore !== undefined && (
              <div className="stat">
                <span className="stat-value">{currentPlayerResult.avgStrokeScore?.toFixed(0)}%</span>
                <span className="stat-label">TB nét vẽ</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="full-rankings">
        <h3>📋 Bảng Xếp Hạng Đầy Đủ</h3>
        <div className="rankings-table">
          <div className="rankings-header">
            <span className="col-rank">#</span>
            <span className="col-player">Người chơi</span>
            <span className="col-score">Điểm</span>
            <span className="col-correct">Đúng</span>
            <span className="col-accuracy">Chính xác</span>
          </div>
          {results.rankings.map((player: KanjiBattlePlayerResult) => (
            <div key={player.odinhId}
              className={`rankings-row ${player.odinhId === currentPlayerId ? 'current' : ''} ${player.isWinner ? 'winner' : ''}`}>
              <span className="col-rank">
                {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
              </span>
              <span className="col-player">
                <span className="avatar">{player.avatar}</span>
                <span className="name">{player.displayName}</span>
              </span>
              <span className="col-score">{player.score}</span>
              <span className="col-correct">{player.correctAnswers}</span>
              <span className="col-accuracy">{player.accuracy.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="results-actions">
        <button className="speed-quiz-btn primary large" onClick={onPlayAgain}>🔄 Chơi Lại</button>
        <button className="speed-quiz-btn secondary large" onClick={onExit}>🚪 Thoát</button>
      </div>
    </div>
  );
};
