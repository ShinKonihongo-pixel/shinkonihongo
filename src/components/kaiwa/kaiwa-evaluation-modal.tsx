// Evaluation modal showing AI feedback after conversation ends

import { X, Star, TrendingUp, Award, Lightbulb, Heart, Target } from 'lucide-react';
import type { KaiwaEvaluation } from '../../types/kaiwa';

interface KaiwaEvaluationModalProps {
  evaluation: KaiwaEvaluation | null;
  isLoading: boolean;
  onClose: () => void;
}

// Get score color class
function getScoreColor(score: number): string {
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'average';
  return 'needs-work';
}

// Get score label
function getScoreLabel(score: number): string {
  if (score >= 9) return 'Xuất sắc';
  if (score >= 8) return 'Rất tốt';
  if (score >= 7) return 'Tốt';
  if (score >= 6) return 'Khá';
  if (score >= 5) return 'Trung bình';
  if (score >= 4) return 'Cần cải thiện';
  return 'Cần luyện tập thêm';
}

// Score bar component
function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const colorClass = getScoreColor(score);
  const percentage = (score / 10) * 100;

  return (
    <div className="eval-score-item">
      <div className="eval-score-label">
        {icon}
        <span>{label}</span>
      </div>
      <div className="eval-score-bar-container">
        <div
          className={`eval-score-bar ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
        <span className="eval-score-value">{score}/10</span>
      </div>
    </div>
  );
}

export function KaiwaEvaluationModal({
  evaluation,
  isLoading,
  onClose,
}: KaiwaEvaluationModalProps) {
  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="kaiwa-evaluation-modal loading">
          <div className="eval-loading-content">
            <div className="eval-loading-spinner"></div>
            <h3>AI đang đánh giá...</h3>
            <p>Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return null;
  }

  const overallLabel = getScoreLabel(evaluation.overallScore);
  const overallColor = getScoreColor(evaluation.overallScore);

  return (
    <div className="modal-overlay">
      <div className="kaiwa-evaluation-modal">
        <div className="eval-modal-header">
          <h2>
            <Award size={24} />
            Kết quả đánh giá
          </h2>
          <button className="eval-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="eval-modal-content">
          {/* Overall Score */}
          <div className={`eval-overall-score ${overallColor}`}>
            <div className="eval-overall-circle">
              <span className="eval-overall-value">{evaluation.overallScore}</span>
              <span className="eval-overall-max">/10</span>
            </div>
            <div className="eval-overall-label">{overallLabel}</div>
            <div className="eval-recommended-level">
              <Target size={14} />
              Đề xuất cấp độ: <strong>{evaluation.recommendedLevel}</strong>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="eval-scores-section">
            <h3>Chi tiết điểm số</h3>
            <div className="eval-scores-list">
              <ScoreBar
                label="Ngữ pháp"
                score={evaluation.grammarScore}
                icon={<span className="score-icon">文</span>}
              />
              <ScoreBar
                label="Từ vựng"
                score={evaluation.vocabularyScore}
                icon={<span className="score-icon">語</span>}
              />
              <ScoreBar
                label="Phát âm"
                score={evaluation.pronunciationScore}
                icon={<span className="score-icon">音</span>}
              />
              <ScoreBar
                label="Độ lưu loát"
                score={evaluation.fluencyScore}
                icon={<span className="score-icon">流</span>}
              />
            </div>
          </div>

          {/* Strengths */}
          <div className="eval-feedback-section strengths">
            <h3>
              <Star size={18} className="section-icon" />
              Điểm mạnh
            </h3>
            <ul>
              {evaluation.strengths.map((strength, idx) => (
                <li key={idx}>{strength}</li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="eval-feedback-section weaknesses">
            <h3>
              <TrendingUp size={18} className="section-icon" />
              Cần cải thiện
            </h3>
            <ul>
              {evaluation.weaknesses.map((weakness, idx) => (
                <li key={idx}>{weakness}</li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="eval-feedback-section suggestions">
            <h3>
              <Lightbulb size={18} className="section-icon" />
              Gợi ý luyện tập
            </h3>
            <ul>
              {evaluation.suggestions.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>

          {/* Encouragement */}
          <div className="eval-encouragement">
            <Heart size={18} />
            <p>{evaluation.encouragement}</p>
          </div>
        </div>

        <div className="eval-modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
