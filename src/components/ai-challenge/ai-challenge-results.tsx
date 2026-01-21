// AI Challenge Results - Professional game results display
// Features animated victory/defeat screens, detailed stats, and unlock notifications

import { Trophy, Target, Clock, Zap, Star, RotateCcw, Home, Unlock, Crown, TrendingUp, Award, Swords, ChevronRight } from 'lucide-react';
import type { AIChallengeResult } from '../../types/ai-challenge';
import { AI_OPPONENTS } from '../../types/ai-challenge';
import { isImageAvatar } from '../../utils/avatar-icons';

// Helper to render avatar (image or emoji)
function renderAvatar(avatar: string | undefined, fallback: string = '👤') {
  if (!avatar) return fallback;
  if (isImageAvatar(avatar)) {
    return <img src={avatar} alt="avatar" />;
  }
  return avatar;
}

interface AIChallengeResultsProps {
  result: AIChallengeResult;
  playerName: string;
  playerAvatar: string;
  onRematch: () => void;
  onSelectNewAI: () => void;
  onClose: () => void;
}

export function AIChallengeResults({
  result,
  playerName,
  playerAvatar,
  onRematch,
  onSelectNewAI,
  onClose,
}: AIChallengeResultsProps) {
  const aiOpponent = AI_OPPONENTS[result.aiDifficulty];
  const isWin = result.winner === 'player';
  const isTie = result.winner === 'tie';
  const playerAccuracy = Math.round((result.playerCorrect / result.totalQuestions) * 100);
  const aiAccuracy = Math.round((result.aiCorrect / result.totalQuestions) * 100);
  const scoreDiff = Math.abs(result.playerScore - result.aiScore);

  return (
    <div className="ai-results-pro">
      {/* Background effects */}
      <div className={`results-background ${result.winner}`}>
        {isWin && (
          <>
            <div className="confetti-container">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    '--delay': `${Math.random() * 3}s`,
                    '--x': `${Math.random() * 100}%`,
                    '--color': ['#ffd93d', '#ff6b6b', '#4ecdc4', '#6c5ce7', '#a8e6cf'][Math.floor(Math.random() * 5)],
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Result banner */}
      <div className={`result-banner-pro ${result.winner}`}>
        <div className="banner-content">
          {isWin ? (
            <>
              <div className="victory-icon">
                <Crown size={48} />
              </div>
              <h1 className="result-title">Chiến Thắng!</h1>
              <p className="result-subtitle">Bạn đã đánh bại {aiOpponent.name}</p>
            </>
          ) : isTie ? (
            <>
              <div className="tie-icon">
                <Swords size={48} />
              </div>
              <h1 className="result-title">Hòa!</h1>
              <p className="result-subtitle">Trận đấu cân bằng với {aiOpponent.name}</p>
            </>
          ) : (
            <>
              <div className="defeat-icon">
                <span className="ai-emoji">{aiOpponent.emoji}</span>
              </div>
              <h1 className="result-title">Thua Cuộc</h1>
              <p className="result-subtitle">{aiOpponent.name} đã chiến thắng</p>
            </>
          )}
        </div>
      </div>

      {/* Score comparison */}
      <div className="score-comparison-pro">
        <div className={`player-panel ${isWin ? 'winner' : ''}`}>
          <div className="panel-header">
            {isWin && <Trophy className="winner-badge" size={20} />}
            <span className="avatar">{renderAvatar(playerAvatar)}</span>
          </div>
          <span className="panel-name">{playerName}</span>
          <div className="panel-score">
            <span className="score-number">{result.playerScore}</span>
            <span className="score-label">điểm</span>
          </div>
        </div>

        <div className="score-divider">
          <div className="divider-line" />
          <span className="divider-vs">VS</span>
          <div className="divider-line" />
          {!isTie && (
            <div className={`score-diff ${isWin ? 'player-lead' : 'ai-lead'}`}>
              {isWin ? '+' : '-'}{scoreDiff}
            </div>
          )}
        </div>

        <div
          className={`ai-panel ${!isWin && !isTie ? 'winner' : ''}`}
          style={{ '--ai-color': aiOpponent.color } as React.CSSProperties}
        >
          <div className="panel-header">
            {!isWin && !isTie && <Trophy className="winner-badge" size={20} />}
            <span className="avatar">{aiOpponent.emoji}</span>
          </div>
          <span className="panel-name">{aiOpponent.name}</span>
          <div className="panel-score">
            <span className="score-number">{result.aiScore}</span>
            <span className="score-label">điểm</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid-pro">
        <div className="stat-card-pro accuracy">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Độ chính xác</span>
            <div className="stat-comparison">
              <span className={`player-value ${playerAccuracy >= aiAccuracy ? 'better' : ''}`}>
                {playerAccuracy}%
              </span>
              <span className="vs">vs</span>
              <span className={`ai-value ${aiAccuracy > playerAccuracy ? 'better' : ''}`}>
                {aiAccuracy}%
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card-pro correct">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Câu đúng</span>
            <div className="stat-comparison">
              <span className={`player-value ${result.playerCorrect >= result.aiCorrect ? 'better' : ''}`}>
                {result.playerCorrect}/{result.totalQuestions}
              </span>
              <span className="vs">vs</span>
              <span className={`ai-value ${result.aiCorrect > result.playerCorrect ? 'better' : ''}`}>
                {result.aiCorrect}/{result.totalQuestions}
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card-pro streak">
          <div className="stat-icon">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Chuỗi cao nhất</span>
            <span className="stat-value">{result.bestStreak}</span>
          </div>
        </div>

        <div className="stat-card-pro time">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Thời gian TB</span>
            <span className="stat-value">{(result.averageTimeMs / 1000).toFixed(2)}s</span>
          </div>
        </div>
      </div>

      {/* New unlock notification */}
      {result.isNewUnlock && result.unlockedAI && (
        <div className="unlock-notification-pro">
          <div className="unlock-glow" />
          <div className="unlock-content">
            <div className="unlock-icon">
              <Unlock size={28} />
            </div>
            <div className="unlock-info">
              <h3>Mở Khóa Thành Công!</h3>
              <div className="unlocked-ai-display">
                <span className="ai-emoji">{AI_OPPONENTS[result.unlockedAI].emoji}</span>
                <span className="ai-name">{AI_OPPONENTS[result.unlockedAI].name}</span>
              </div>
              <p>Đối thủ mới đã sẵn sàng thách đấu!</p>
            </div>
            <div className="unlock-stars">
              <Star size={16} className="star" />
              <Star size={20} className="star center" />
              <Star size={16} className="star" />
            </div>
          </div>
        </div>
      )}

      {/* Performance insight */}
      <div className="performance-insight">
        <TrendingUp size={18} />
        <span>
          {isWin
            ? playerAccuracy >= 80
              ? 'Xuất sắc! Bạn đã chơi rất tốt trong trận này.'
              : 'Tốt lắm! Tiếp tục luyện tập để nâng cao độ chính xác.'
            : isTie
            ? 'Trận đấu rất căng thẳng! Hãy thử lại để giành chiến thắng.'
            : 'Đừng nản lòng! Hãy luyện tập thêm và thử lại.'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="result-actions-pro">
        <button className="action-btn-pro primary" onClick={onRematch}>
          <RotateCcw size={20} />
          <span>Đấu Lại</span>
          <ChevronRight size={18} />
        </button>

        <div className="secondary-actions">
          <button className="action-btn-pro secondary" onClick={onSelectNewAI}>
            <Swords size={18} />
            <span>Chọn AI Khác</span>
          </button>

          <button className="action-btn-pro tertiary" onClick={onClose}>
            <Home size={18} />
            <span>Về Game Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
}
