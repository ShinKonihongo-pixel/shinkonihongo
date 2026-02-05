import { RotateCcw } from 'lucide-react';

interface CompletedViewProps {
  score: {
    correct: number;
    total: number;
    percent: number;
  };
  theme: { gradient: string };
  onRestart: () => void;
  onGoBack: () => void;
}

export function CompletedView({ score, theme, onRestart, onGoBack }: CompletedViewProps) {
  return (
    <div className="completion-screen">
      <div className="completion-glow" style={{ '--color': theme.gradient } as React.CSSProperties} />
      <div className="completion-content">
        <div className="completion-icon">
          {score.percent >= 80 ? '🎉' : score.percent >= 50 ? '👍' : '💪'}
        </div>
        <h2>Hoàn thành!</h2>
        <div className="score-display">
          <div className="score-circle" style={{ '--progress': `${score.percent}%`, '--color': theme.gradient } as React.CSSProperties}>
            <span className="score-number">{score.percent}%</span>
          </div>
          <div className="score-detail">
            <span className="correct">{score.correct} đúng</span>
            <span className="total">/ {score.total} câu</span>
          </div>
        </div>
        <p className="score-message">
          {score.percent >= 80 ? 'Xuất sắc! Bạn đã hiểu rất tốt bài đọc.' :
           score.percent >= 50 ? 'Khá tốt! Hãy tiếp tục luyện tập.' :
           'Cần cố gắng hơn. Hãy đọc lại bài và thử lại!'}
        </p>
        <div className="completion-actions">
          <button className="btn btn-glass" onClick={onRestart}>
            <RotateCcw size={18} /> Làm lại
          </button>
          <button className="btn btn-primary" onClick={onGoBack}>
            Chọn bài khác
          </button>
        </div>
      </div>
    </div>
  );
}
