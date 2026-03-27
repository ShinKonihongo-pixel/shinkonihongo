// Advanced topic selector section for kaiwa setup view

import { Star, X, BookOpen, MessageCircle } from 'lucide-react';
import { CONVERSATION_STYLES } from '../../../constants/kaiwa';

interface KaiwaSetupAdvancedSectionProps {
  advancedTopics: any[];
  selectedAdvancedTopic: any;
  selectedAdvancedQuestion: any;
  setSelectedAdvancedTopic: (t: any) => void;
  setSelectedAdvancedQuestion: (q: any) => void;
  getAdvancedQuestionsForTopic: () => any[];
}

export function KaiwaSetupAdvancedSection({
  advancedTopics,
  selectedAdvancedTopic,
  selectedAdvancedQuestion,
  setSelectedAdvancedTopic,
  setSelectedAdvancedQuestion,
  getAdvancedQuestionsForTopic,
}: KaiwaSetupAdvancedSectionProps) {
  if (advancedTopics.length === 0) return null;

  return (
    <div className="kaiwa-advanced-session">
      <div className="advanced-session-header">
        <h3><Star size={18} /> Chọn chủ đề nâng cao</h3>
        {selectedAdvancedTopic && (
          <button
            className="kaiwa-clear-selection-btn"
            onClick={() => {
              setSelectedAdvancedTopic(null);
              setSelectedAdvancedQuestion(null);
            }}
          >
            <X size={14} /> Bỏ chọn
          </button>
        )}
      </div>

      {/* Topics Grid */}
      {!selectedAdvancedTopic && (
        <div className="advanced-topics-grid">
          {advancedTopics.map((topic: any) => (
            <button
              key={topic.id}
              className="advanced-topic-card"
              style={{ '--topic-color': topic.color } as React.CSSProperties}
              onClick={() => setSelectedAdvancedTopic(topic)}
            >
              <span className="topic-icon" style={{ backgroundColor: `${topic.color}20` }}>
                {topic.icon}
              </span>
              <div className="topic-info">
                <span className="topic-name">{topic.name}</span>
                <span className="topic-meta">
                  <span className="topic-level">{topic.level}</span>
                  <span className="topic-count">
                    <MessageCircle size={12} /> {topic.questionCount || 0}
                  </span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Topic Preview */}
      {selectedAdvancedTopic && (
        <div className="advanced-topic-selected" style={{ '--topic-color': selectedAdvancedTopic.color } as React.CSSProperties}>
          <div className="selected-topic-header">
            <span className="topic-icon" style={{ backgroundColor: `${selectedAdvancedTopic.color}20` }}>
              {selectedAdvancedTopic.icon}
            </span>
            <div className="topic-details">
              <h4>{selectedAdvancedTopic.name}</h4>
              <p>{selectedAdvancedTopic.description}</p>
              <div className="topic-badges">
                <span className="badge">{selectedAdvancedTopic.level}</span>
                <span className="badge">{CONVERSATION_STYLES.find((s: any) => s.value === selectedAdvancedTopic.style)?.label}</span>
              </div>
            </div>
          </div>

          {/* Topic Vocabulary Preview */}
          {selectedAdvancedTopic.vocabulary && selectedAdvancedTopic.vocabulary.length > 0 && (
            <div className="topic-vocab-preview">
              <h5><BookOpen size={14} /> Từ vựng ({selectedAdvancedTopic.vocabulary.length})</h5>
              <div className="vocab-chips">
                {selectedAdvancedTopic.vocabulary.slice(0, 8).map((vocab: any) => (
                  <span key={vocab.id} className="vocab-chip">
                    {vocab.word}
                    <span className="vocab-meaning">{vocab.meaning}</span>
                  </span>
                ))}
                {selectedAdvancedTopic.vocabulary.length > 8 && (
                  <span className="vocab-chip more">+{selectedAdvancedTopic.vocabulary.length - 8}</span>
                )}
              </div>
            </div>
          )}

          {/* Question Selector */}
          {getAdvancedQuestionsForTopic().length > 0 && (
            <div className="topic-questions-selector">
              <h5><MessageCircle size={14} /> Chọn câu hỏi (hoặc để ngẫu nhiên)</h5>
              <div className="questions-list">
                {getAdvancedQuestionsForTopic().map((q: any, idx: number) => (
                  <button
                    key={q.id}
                    className={`question-item ${selectedAdvancedQuestion?.id === q.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAdvancedQuestion(
                      selectedAdvancedQuestion?.id === q.id ? null : q
                    )}
                  >
                    <span className="question-num">{idx + 1}</span>
                    <div className="question-text">
                      <span className="ja">{q.questionJa}</span>
                      {q.questionVi && <span className="vi">{q.questionVi}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
