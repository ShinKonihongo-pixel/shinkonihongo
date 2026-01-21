// Image-Word Results Component
// Shows game completion stats and score

import React from 'react';
import { Trophy, Clock, Target, AlertCircle, RotateCcw, Home, Star } from 'lucide-react';
import type { ImageWordGameResult } from '../../types/image-word';

interface ImageWordResultsProps {
  result: ImageWordGameResult;
  onPlayAgain: () => void;
  onBack: () => void;
}

// Format time from milliseconds
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get rating based on accuracy
function getRating(accuracy: number): { stars: number; label: string } {
  if (accuracy === 100) return { stars: 3, label: 'Hoàn Hảo!' };
  if (accuracy >= 80) return { stars: 2, label: 'Xuất Sắc!' };
  if (accuracy >= 60) return { stars: 1, label: 'Tốt!' };
  return { stars: 0, label: 'Cố Gắng Thêm!' };
}

export const ImageWordResults: React.FC<ImageWordResultsProps> = ({
  result,
  onPlayAgain,
  onBack,
}) => {
  const rating = getRating(result.accuracy);

  return (
    <div className="image-word-results">
      <div className="results-card">
        {/* Header with trophy */}
        <div className="results-header">
          <div className="trophy-icon">
            <Trophy size={48} />
          </div>
          <h2>Hoàn Thành!</h2>
          <p className="lesson-name">{result.lessonName}</p>
        </div>

        {/* Stars rating */}
        <div className="stars-rating">
          {[1, 2, 3].map(star => (
            <Star
              key={star}
              size={32}
              className={star <= rating.stars ? 'star-filled' : 'star-empty'}
              fill={star <= rating.stars ? '#FFD700' : 'none'}
            />
          ))}
          <span className="rating-label">{rating.label}</span>
        </div>

        {/* Score */}
        <div className="score-display">
          <span className="score-value">{result.score}</span>
          <span className="score-label">Điểm</span>
        </div>

        {/* Stats grid */}
        <div className="stats-grid">
          <div className="stat-item">
            <Target size={20} />
            <span className="stat-value">{result.correctMatches}/{result.totalPairs}</span>
            <span className="stat-label">Cặp Đúng</span>
          </div>
          <div className="stat-item">
            <AlertCircle size={20} />
            <span className="stat-value">{result.wrongAttempts}</span>
            <span className="stat-label">Lần Sai</span>
          </div>
          <div className="stat-item">
            <Clock size={20} />
            <span className="stat-value">{formatTime(result.timeMs)}</span>
            <span className="stat-label">Thời Gian</span>
          </div>
          <div className="stat-item accuracy">
            <span className="stat-value">{result.accuracy}%</span>
            <span className="stat-label">Độ Chính Xác</span>
          </div>
        </div>

        {/* Actions */}
        <div className="results-actions">
          <button className="btn-play-again" onClick={onPlayAgain}>
            <RotateCcw size={18} />
            Chơi Lại
          </button>
          <button className="btn-back-menu" onClick={onBack}>
            <Home size={18} />
            Chọn Bài Khác
          </button>
        </div>
      </div>
    </div>
  );
};
