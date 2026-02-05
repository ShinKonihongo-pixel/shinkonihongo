import React from 'react';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import type { GameState, PlayerRole } from './word-scramble-types';
import { ROLE_COLORS } from './word-scramble-constants';

interface ResultScreenProps {
  gameState: GameState;
  onClose: () => void;
  onResetGame: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  gameState,
  onClose,
  onResetGame,
}) => {
  const accuracy = gameState.questions.length > 0
    ? Math.round((gameState.correctAnswers / gameState.questions.length) * 100)
    : 0;
  const avgTime = gameState.questions.length > 0
    ? Math.round(gameState.totalTime / gameState.questions.length)
    : 0;
  const userRank = gameState.players.findIndex(p => p.isCurrentUser) + 1;
  const currentPlayer = gameState.players.find(p => p.isCurrentUser);

  const getPlayerNameColor = (player: { role?: PlayerRole }) => {
    if (player.role && player.role !== 'user') {
      return ROLE_COLORS[player.role];
    }
    return '#ffffff';
  };

  return (
    <div className="ws-result-screen">
      <div className="ws-result-card">
        <div className="ws-result-header">
          <div className="ws-result-trophy">
            {gameState.isSoloMode ? '🎮' : userRank === 1 ? '🏆' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : '🎮'}
          </div>
          <h1>Kết quả</h1>
          {!gameState.isSoloMode && (
            <p className="ws-rank-text">Hạng #{userRank} / {gameState.players.length}</p>
          )}
        </div>

        <div className="ws-result-stats">
          <div className="ws-stat-card primary">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{currentPlayer?.score || 0}</div>
            <div className="stat-label">Tổng điểm</div>
          </div>
          <div className="ws-stat-card">
            <div className="stat-icon">✓</div>
            <div className="stat-value">{gameState.correctAnswers}/{gameState.questions.length}</div>
            <div className="stat-label">Số câu đúng</div>
          </div>
          <div className="ws-stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{accuracy}%</div>
            <div className="stat-label">Độ chính xác</div>
          </div>
          <div className="ws-stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-value">{avgTime}s</div>
            <div className="stat-label">TB/câu</div>
          </div>
          <div className="ws-stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{gameState.maxStreak}</div>
            <div className="stat-label">Streak cao nhất</div>
          </div>
        </div>

        {/* Final leaderboard (only if not solo mode) */}
        {!gameState.isSoloMode && (
          <div className="ws-final-leaderboard">
            <h3><Trophy size={18} /> Bảng xếp hạng cuối</h3>
            <div className="ws-final-list">
              {gameState.players.slice(0, 5).map((player, index) => (
                <div key={player.id} className={`ws-final-row ${player.isCurrentUser ? 'you' : ''}`}>
                  <span className="final-rank">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                  <span className="final-avatar">{player.avatar}</span>
                  <span className="final-name" style={{ color: player.isCurrentUser ? '#1f2937' : getPlayerNameColor(player) === '#ffffff' ? '#1f2937' : getPlayerNameColor(player) }}>
                    {player.name}
                  </span>
                  <span className="final-score">{player.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ws-result-actions">
          <button className="ws-btn ws-btn-ghost" onClick={onClose}>
            <Home size={18} /> Trang chủ
          </button>
          <button className="ws-btn ws-btn-primary" onClick={onResetGame}>
            <RotateCcw size={18} /> Chơi lại
          </button>
        </div>
      </div>
    </div>
  );
};
