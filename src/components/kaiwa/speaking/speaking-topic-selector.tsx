// Topic selection grid for speaking practice - Premium UI

import { SPEAKING_TOPICS } from '../../../constants/speaking-topics';
import type { SpeakingTopicId, SpeakingProgress } from '../../../types/speaking-practice';
import type { JLPTLevel } from '../../../types/kaiwa';
import { JLPT_LEVELS } from '../../../constants/kaiwa';
import { CheckCircle, Mic, Flame, Target, Clock, TrendingUp } from 'lucide-react';

interface SpeakingTopicSelectorProps {
  selectedTopic: SpeakingTopicId | null;
  selectedLevel: JLPTLevel;
  progress: SpeakingProgress;
  onSelectTopic: (topic: SpeakingTopicId) => void;
  onSelectLevel: (level: JLPTLevel) => void;
  onStart: () => void;
  isLoading: boolean;
}

export function SpeakingTopicSelector({
  selectedTopic,
  selectedLevel,
  progress,
  onSelectTopic,
  onSelectLevel,
  onStart,
  isLoading,
}: SpeakingTopicSelectorProps) {
  return (
    <div className="speaking-topic-selector">
      <div className="speaking-header">
        <h2>Luyện Noi - Speaking Practice</h2>
        <p className="speaking-description">
          Luyện nói tiếng Nhật qua các đoạn hội thoại thực tế. Nghe AI nói trước, sau đó ghi âm và nhận đánh giá chi tiết.
        </p>
      </div>

      {/* Progress summary with icons */}
      {progress.totalSessions > 0 && (
        <div className="speaking-progress-summary">
          <div className="progress-stat">
            <Target size={18} className="stat-icon" />
            <span className="stat-value">{progress.totalSessions}</span>
            <span className="stat-label">Buổi học</span>
          </div>
          <div className="progress-stat">
            <Clock size={18} className="stat-icon" />
            <span className="stat-value">{progress.totalMinutes}</span>
            <span className="stat-label">Phút luyện</span>
          </div>
          <div className="progress-stat">
            <TrendingUp size={18} className="stat-icon" />
            <span className="stat-value">{progress.averageAccuracy}%</span>
            <span className="stat-label">Độ chính xác</span>
          </div>
          <div className="progress-stat streak">
            <Flame size={18} className="stat-icon" />
            <span className="stat-value">{progress.streakDays}</span>
            <span className="stat-label">Ngày liên tiếp</span>
          </div>
        </div>
      )}

      {/* Level selector */}
      <div className="speaking-level-selector">
        <label>Cấp độ JLPT:</label>
        <div className="level-buttons">
          {JLPT_LEVELS.map(level => (
            <button
              key={level.value}
              className={`level-btn ${selectedLevel === level.value ? 'active' : ''}`}
              onClick={() => onSelectLevel(level.value)}
            >
              {level.value}
            </button>
          ))}
        </div>
      </div>

      {/* Topic grid */}
      <div className="speaking-topics-grid">
        {SPEAKING_TOPICS.map(topic => {
          const topicProgress = progress.topicProgress[topic.id];
          const isSelected = selectedTopic === topic.id;

          return (
            <button
              key={topic.id}
              className={`speaking-topic-card ${isSelected ? 'selected' : ''}`}
              style={{ '--topic-color': topic.color } as React.CSSProperties}
              onClick={() => onSelectTopic(topic.id)}
              aria-pressed={isSelected}
            >
              <span className="topic-icon">{topic.icon}</span>
              <div className="topic-info">
                <span className="topic-name">{topic.name}</span>
                <span className="topic-name-vi">{topic.nameVi}</span>
                <span className="topic-description">{topic.description}</span>
              </div>
              {topicProgress && topicProgress.sessionsCompleted > 0 && (
                <div className="topic-progress">
                  <CheckCircle size={14} />
                  <span>{topicProgress.sessionsCompleted}x</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Start button */}
      <div className="speaking-start-section">
        <button
          className={`speaking-start-btn ${selectedTopic ? 'active' : 'disabled'}`}
          disabled={!selectedTopic || isLoading}
          onClick={onStart}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner" aria-hidden="true"></span>
              <span>Đang tạo hội thoại...</span>
            </>
          ) : (
            <>
              <Mic size={22} aria-hidden="true" />
              <span>Bắt đầu luyện nói</span>
            </>
          )}
        </button>
        {selectedTopic && !isLoading && (
          <p className="start-hint">
            AI sẽ tạo đoạn hội thoại về chủ đề <strong>"{SPEAKING_TOPICS.find(t => t.id === selectedTopic)?.nameVi}"</strong> ở cấp độ <strong>{selectedLevel}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
