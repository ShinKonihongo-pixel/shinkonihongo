// Study session result/summary component - Professional completion screen

import { Trophy, BookOpen, CheckCircle, RotateCcw, Home, Sparkles } from 'lucide-react';
import type { StudyStats } from '../../types/flashcard';

interface StudyResultProps {
  stats: StudyStats;
  onRestart: () => void;
  onGoHome: () => void;
}

export function StudyResult({ stats, onRestart, onGoHome }: StudyResultProps) {
  const accuracy = stats.cardsStudied > 0
    ? Math.round((stats.correctCount / stats.cardsStudied) * 100)
    : 0;

  // Get performance message based on accuracy
  const getPerformanceMessage = () => {
    if (accuracy >= 90) return { emoji: '🏆', text: 'Xuất sắc!', color: '#FFD700' };
    if (accuracy >= 70) return { emoji: '🌟', text: 'Tốt lắm!', color: '#27ae60' };
    if (accuracy >= 50) return { emoji: '💪', text: 'Cố gắng thêm!', color: '#3498db' };
    return { emoji: '📚', text: 'Hãy ôn lại nhé!', color: '#e74c3c' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="study-result-pro">
      {/* Celebration header */}
      <div className="result-celebration">
        <div className="trophy-icon">
          <Trophy size={48} strokeWidth={1.5} />
          <Sparkles className="sparkle sparkle-1" size={16} />
          <Sparkles className="sparkle sparkle-2" size={12} />
          <Sparkles className="sparkle sparkle-3" size={14} />
        </div>
        <h2>Hoàn thành bài học!</h2>
        <p className="performance-text" style={{ color: performance.color }}>
          {performance.emoji} {performance.text}
        </p>
      </div>

      {/* Accuracy circle */}
      <div className="accuracy-circle-container">
        <svg className="accuracy-circle" viewBox="0 0 120 120">
          <circle
            className="accuracy-bg"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="accuracy-progress"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
            strokeDasharray={`${accuracy * 3.39} 339`}
            strokeLinecap="round"
            style={{
              stroke: accuracy >= 70 ? '#27ae60' : accuracy >= 50 ? '#f39c12' : '#e74c3c'
            }}
          />
        </svg>
        <div className="accuracy-value">
          <span className="accuracy-number">{accuracy}</span>
          <span className="accuracy-percent">%</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            <BookOpen size={20} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.cardsStudied}</span>
            <span className="stat-card-label">Thẻ đã học</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)' }}>
            <CheckCircle size={20} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.correctCount}</span>
            <span className="stat-card-label">Đã thuộc</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
            <RotateCcw size={20} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats.againCount}</span>
            <span className="stat-card-label">Cần ôn lại</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="result-actions-pro">
        <button className="result-btn result-btn-secondary" onClick={onGoHome}>
          <Home size={18} />
          <span>Chọn bài khác</span>
        </button>
        <button className="result-btn result-btn-primary" onClick={onRestart}>
          <RotateCcw size={18} />
          <span>Học lại</span>
        </button>
      </div>
    </div>
  );
}
