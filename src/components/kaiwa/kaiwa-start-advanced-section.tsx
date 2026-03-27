// Advanced topic selector for kaiwa-start-screen

import { Star, X, BookOpen, MessageCircle } from 'lucide-react';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion } from '../../types/kaiwa-advanced';
import { CONVERSATION_STYLES } from '../../constants/kaiwa';

interface KaiwaStartAdvancedSectionProps {
  advancedTopics: KaiwaAdvancedTopic[];
  selectedAdvancedTopic: KaiwaAdvancedTopic | null;
  selectedAdvancedQuestion: KaiwaAdvancedQuestion | null;
  advancedQuestionsForTopic: KaiwaAdvancedQuestion[];
  onSelectAdvancedTopic: (topic: KaiwaAdvancedTopic | null) => void;
  onSelectAdvancedQuestion: (question: KaiwaAdvancedQuestion | null) => void;
}

export function KaiwaStartAdvancedSection({
  advancedTopics,
  selectedAdvancedTopic,
  selectedAdvancedQuestion,
  advancedQuestionsForTopic,
  onSelectAdvancedTopic,
  onSelectAdvancedQuestion,
}: KaiwaStartAdvancedSectionProps) {
  return (
    <div className="kaiwa-advanced-session">
      <div className="advanced-session-header">
        <h3><Star size={18} /> Chọn chủ đề nâng cao</h3>
        {selectedAdvancedTopic && (
          <button
            className="kaiwa-clear-selection-btn"
            onClick={() => {
              onSelectAdvancedTopic(null);
              onSelectAdvancedQuestion(null);
            }}
          >
            <X size={14} /> Bỏ chọn
          </button>
        )}
      </div>

      {/* Topics Grid */}
      {!selectedAdvancedTopic && (
        <div className="advanced-topics-grid">
          {advancedTopics.map(t => (
            <button
              key={t.id}
              className="advanced-topic-card"
              style={{ '--topic-color': t.color } as React.CSSProperties}
              onClick={() => onSelectAdvancedTopic(t)}
            >
              <span className="topic-icon" style={{ backgroundColor: `${t.color}20` }}>
                {t.icon}
              </span>
              <div className="topic-info">
                <span className="topic-name">{t.name}</span>
                <span className="topic-meta">
                  <span className="topic-level">{t.level}</span>
                  <span className="topic-count">
                    <MessageCircle size={12} /> {t.questionCount || 0}
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
                <span className="badge">{CONVERSATION_STYLES.find(s => s.value === selectedAdvancedTopic.style)?.label}</span>
              </div>
            </div>
          </div>

          {/* Topic Vocabulary Preview */}
          {selectedAdvancedTopic.vocabulary && selectedAdvancedTopic.vocabulary.length > 0 && (
            <div className="topic-vocab-preview">
              <h5><BookOpen size={14} /> Từ vựng ({selectedAdvancedTopic.vocabulary.length})</h5>
              <div className="vocab-chips">
                {selectedAdvancedTopic.vocabulary.slice(0, 8).map(vocab => (
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
          {advancedQuestionsForTopic.length > 0 && (
            <div className="topic-questions-selector">
              <h5><MessageCircle size={14} /> Chọn câu hỏi (hoặc để ngẫu nhiên)</h5>
              <div className="questions-list">
                {advancedQuestionsForTopic.map((q, idx) => (
                  <button
                    key={q.id}
                    className={`question-item ${selectedAdvancedQuestion?.id === q.id ? 'selected' : ''}`}
                    onClick={() => onSelectAdvancedQuestion(
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
