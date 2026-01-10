// Study session result/summary component

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

  return (
    <div className="study-result">
      <h2>🎊 Hoàn thành!</h2>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.cardsStudied}</span>
          <span className="stat-label">Thẻ đã học</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#27ae60' }}>
            {stats.correctCount}
          </span>
          <span className="stat-label">Nhớ</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#e74c3c' }}>
            {stats.againCount}
          </span>
          <span className="stat-label">Cần ôn lại</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">Chính xác</span>
        </div>
      </div>

      <div className="result-actions">
        <button className="btn btn-secondary" onClick={onGoHome}>
          Về trang chủ
        </button>
        <button className="btn btn-primary" onClick={onRestart}>
          Học tiếp
        </button>
      </div>
    </div>
  );
}
