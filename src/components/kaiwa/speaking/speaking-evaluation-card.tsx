// Session completion summary card for speaking practice - Premium UI

import { Award, Clock, Target, RotateCcw, ChevronRight, Lightbulb, Trophy, Sparkles } from 'lucide-react';
import type { SpeakingSessionSummary } from '../../../types/speaking-practice';
import { getSpeakingTopicById } from '../../../constants/speaking-topics';

interface SpeakingEvaluationCardProps {
  summary: SpeakingSessionSummary;
  onRestart: () => void;
  onNewTopic: () => void;
  onClose: () => void;
}

// Get score color class
function getScoreClass(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'needs-work';
}

// Get score label with emoji
function getScoreLabel(score: number): string {
  if (score >= 90) return 'Xuất sắc!';
  if (score >= 80) return 'Rất tốt!';
  if (score >= 70) return 'Tốt lắm!';
  if (score >= 60) return 'Khá tốt!';
  if (score >= 50) return 'Tiếp tục cố gắng!';
  return 'Luyện thêm nhé!';
}

// Format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function SpeakingEvaluationCard({
  summary,
  onRestart,
  onNewTopic,
  onClose,
}: SpeakingEvaluationCardProps) {
  const topic = getSpeakingTopicById(summary.dialogue.topic);
  const scoreClass = getScoreClass(summary.overallAccuracy);
  const scoreLabel = getScoreLabel(summary.overallAccuracy);
  const isExcellent = summary.overallAccuracy >= 80;

  // Calculate line-by-line stats
  const lineStats = summary.lineResults.map(result => ({
    lineIndex: result.lineIndex,
    accuracy: result.bestAccuracy,
    attempts: result.attempts,
  }));

  return (
    <div className="speaking-evaluation-overlay">
      <div className={`speaking-evaluation-modal ${isExcellent ? 'excellent' : ''}`}>
        {/* Header */}
        <div className="speaking-eval-header">
          {isExcellent ? (
            <Trophy size={36} className="eval-icon" aria-hidden="true" />
          ) : (
            <Award size={36} className="eval-icon" aria-hidden="true" />
          )}
          <h2>Kết quả luyện nói</h2>
          <p className="eval-subtitle">
            {topic?.icon} {summary.dialogue.titleVi}
          </p>
        </div>

        {/* Main score */}
        <div className={`speaking-eval-score ${scoreClass}`} role="status" aria-live="polite">
          <div className="score-circle">
            <span className="score-value" aria-label={`${summary.overallAccuracy} phần trăm`}>
              {summary.overallAccuracy}
            </span>
            <span className="score-max">%</span>
          </div>
          <div className="score-label">
            {isExcellent && <Sparkles size={18} className="inline-icon" aria-hidden="true" />}
            {scoreLabel}
          </div>
        </div>

        {/* Stats row */}
        <div className="speaking-eval-stats">
          <div className="eval-stat">
            <Clock size={20} aria-hidden="true" />
            <span className="stat-value">{formatTime(summary.totalTime)}</span>
            <span className="stat-label">Thời gian</span>
          </div>
          <div className="eval-stat">
            <Target size={20} aria-hidden="true" />
            <span className="stat-value">{summary.linesCompleted}/{summary.totalLines}</span>
            <span className="stat-label">Câu hoàn thành</span>
          </div>
        </div>

        {/* Line-by-line results */}
        {lineStats.length > 0 && (
          <div className="speaking-eval-lines">
            <h4>Chi tiết từng câu</h4>
            <div className="lines-list" role="list">
              {lineStats.map((stat, idx) => {
                const line = summary.dialogue.lines[stat.lineIndex];
                if (!line || line.role !== 'user') return null;

                const textPreview = line.textPlain.length > 28
                  ? `${line.textPlain.substring(0, 28)}...`
                  : line.textPlain;

                return (
                  <div key={idx} className="line-result" role="listitem">
                    <div className="line-info">
                      <span className="line-num">Câu {idx + 1}</span>
                      <span className="line-preview">{textPreview}</span>
                    </div>
                    <div className="line-stats">
                      <span
                        className={`line-accuracy ${getScoreClass(stat.accuracy)}`}
                        aria-label={`${stat.accuracy} phần trăm chính xác`}
                      >
                        {stat.accuracy}%
                      </span>
                      {stat.attempts > 1 && (
                        <span className="line-attempts">
                          {stat.attempts} lần
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {summary.suggestions.length > 0 && (
          <div className="speaking-eval-suggestions">
            <h4>
              <Lightbulb size={16} aria-hidden="true" />
              Gợi ý cải thiện
            </h4>
            <ul role="list">
              {summary.suggestions.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="speaking-eval-actions">
          <button className="eval-btn secondary" onClick={onRestart} aria-label="Luyện lại chủ đề này">
            <RotateCcw size={18} aria-hidden="true" />
            <span>Luyện lại</span>
          </button>
          <button className="eval-btn primary" onClick={onNewTopic} aria-label="Chọn chủ đề khác">
            <span>Chủ đề khác</span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Close button */}
        <button className="eval-close-link" onClick={onClose}>
          Quay về trang chính
        </button>
      </div>
    </div>
  );
}
