// Custom topics session selector for kaiwa setup view

import { MessagesSquare, BookOpen, MessageCircle } from 'lucide-react';

interface KaiwaSetupCustomSectionProps {
  customTopics: any[];
  selectedCustomTopic: any;
  setSelectedCustomTopic: (t: any) => void;
  setSelectedCustomQuestion: (q: any) => void;
  getCustomQuestionsForTopic: () => any[];
  handleStart: () => void;
}

export function KaiwaSetupCustomSection({
  customTopics,
  selectedCustomTopic,
  setSelectedCustomTopic,
  setSelectedCustomQuestion,
  getCustomQuestionsForTopic,
  handleStart,
}: KaiwaSetupCustomSectionProps) {
  if (customTopics.length === 0) return null;

  return (
    <div className="kaiwa-custom-session">
      <div className="custom-session-header">
        <h3><BookOpen size={18} /> Chọn chủ đề mở rộng</h3>
      </div>

      {/* Custom Topics Grid */}
      <div className="custom-topics-grid">
        {customTopics.map((topic: any) => (
          <button
            key={topic.id}
            className={`custom-topic-card ${selectedCustomTopic?.id === topic.id ? 'selected' : ''}`}
            style={{ '--topic-color': topic.color } as React.CSSProperties}
            onClick={() => setSelectedCustomTopic(
              selectedCustomTopic?.id === topic.id ? null : topic
            )}
          >
            <span className="topic-icon" style={{ backgroundColor: `${topic.color}20` }}>
              {topic.icon}
            </span>
            <div className="topic-info">
              <span className="topic-name">{topic.name}</span>
              <span className="topic-meta">
                <span className="topic-count">
                  <MessageCircle size={12} /> {topic.questionCount || 0}
                </span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Start Conversation Button */}
      <div className="custom-start-section">
        <button
          className={`kaiwa-start-btn ${selectedCustomTopic ? 'active' : 'disabled'}`}
          disabled={!selectedCustomTopic}
          onClick={() => {
            if (selectedCustomTopic) {
              const topicQuestions = getCustomQuestionsForTopic();
              if (topicQuestions.length > 0) {
                const randomQuestion = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
                setSelectedCustomQuestion(randomQuestion);
              }
              handleStart();
            }
          }}
        >
          <MessagesSquare size={20} />
          Bắt đầu hội thoại
        </button>
        {selectedCustomTopic && (
          <p className="start-hint">
            AI sẽ ngẫu nhiên chọn câu hỏi hoặc sử dụng nguồn từ vựng để luyện giao tiếp
          </p>
        )}
      </div>
    </div>
  );
}
