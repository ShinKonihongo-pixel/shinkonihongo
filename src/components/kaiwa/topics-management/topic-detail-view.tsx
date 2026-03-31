// Topic Detail View - Display topic info, questions, vocab, banks

import {
  Plus, Edit2, ArrowLeft, MessageCircle, BookOpen,
  Volume2, Copy,
} from 'lucide-react';
import { LevelBadge } from '../../ui/level-badge';
import type {
  KaiwaAdvancedTopic,
  KaiwaAdvancedQuestion,
} from '../../../types/kaiwa-advanced';
import type { CanModifyTopicFn } from './topics-management-types';

interface TopicDetailViewProps {
  topic: KaiwaAdvancedTopic;
  questions: KaiwaAdvancedQuestion[];
  canModifyTopic: CanModifyTopicFn;
  onGoBack: () => void;
  onOpenTopicModal: (topic: KaiwaAdvancedTopic) => void;
  onOpenQuestionModal: (question?: KaiwaAdvancedQuestion) => void;
  renderQuestionCard: (question: KaiwaAdvancedQuestion, index: number) => React.ReactNode;
}

export function TopicDetailView({
  topic,
  questions,
  canModifyTopic,
  onGoBack,
  onOpenTopicModal,
  onOpenQuestionModal,
  renderQuestionCard,
}: TopicDetailViewProps) {
  return (
    <div className="kaiwa-topics-management">
      {/* Header */}
      <div className="detail-header">
        <button className="btn btn-back" onClick={onGoBack}>
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="detail-title">
          <span className="detail-icon" style={{ backgroundColor: `${topic.color}20` }}>
            {topic.icon}
          </span>
          <div>
            <h2>{topic.name}</h2>
            <p>{topic.description}</p>
          </div>
        </div>
        {canModifyTopic(topic) && (
          <div className="detail-actions">
            <button className="btn btn-secondary" onClick={() => onOpenTopicModal(topic)}>
              <Edit2 size={16} /> Sửa chủ đề
            </button>
          </div>
        )}
      </div>

      {/* Topic Stats & Vocabulary */}
      <div className="topic-detail-info">
        <div className="topic-stats">
          <div className="stat-item">
            <span className="stat-value">{topic.questionBank?.length || 0}</span>
            <span className="stat-label">Kho câu hỏi</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{topic.answerBank?.length || 0}</span>
            <span className="stat-label">Kho trả lời</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{topic.vocabulary?.length || 0}</span>
            <span className="stat-label">Từ vựng</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{topic.level}</span>
            <span className="stat-label">Cấp độ</span>
          </div>
        </div>

        {/* Question Bank Display */}
        {topic.questionBank && topic.questionBank.length > 0 && (
          <div className="topic-bank-section">
            <h4><MessageCircle size={16} /> Kho câu hỏi</h4>
            <p className="bank-hint">AI sử dụng các câu hỏi này để bắt đầu hội thoại</p>
            <div className="bank-display-list">
              {topic.questionBank.map(item => (
                <div key={item.id} className="bank-display-item">
                  <LevelBadge level={item.level} size="xs" />
                  <div className="bank-text">
                    <span className="bank-ja">{item.questionJa}</span>
                    {item.questionVi && <span className="bank-vi">{item.questionVi}</span>}
                  </div>
                  <button
                    className="btn-icon small"
                    title="Sao chép"
                    onClick={() => navigator.clipboard.writeText(item.questionJa)}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Bank Display */}
        {topic.answerBank && topic.answerBank.length > 0 && (
          <div className="topic-bank-section">
            <h4><MessageCircle size={16} /> Kho câu trả lời</h4>
            <p className="bank-hint">Các mẫu câu trả lời để AI đánh giá người học</p>
            <div className="bank-display-list">
              {topic.answerBank.map(item => (
                <div key={item.id} className="bank-display-item answer">
                  <LevelBadge level={item.level} size="xs" />
                  <div className="bank-text">
                    <span className="bank-ja">{item.answerJa}</span>
                    {item.answerVi && <span className="bank-vi">{item.answerVi}</span>}
                  </div>
                  <button
                    className="btn-icon small"
                    title="Sao chép"
                    onClick={() => navigator.clipboard.writeText(item.answerJa)}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vocabulary Display */}
        {topic.vocabulary && topic.vocabulary.length > 0 && (
          <div className="topic-vocabulary-section">
            <h4><BookOpen size={16} /> Từ vựng chủ đề</h4>
            <div className="vocabulary-grid">
              {topic.vocabulary.map(vocab => (
                <div key={vocab.id} className="vocab-card">
                  <div className="vocab-main">
                    <span className="vocab-word">{vocab.word}</span>
                    {vocab.reading && <span className="vocab-reading">{vocab.reading}</span>}
                  </div>
                  <span className="vocab-meaning">{vocab.meaning}</span>
                  <div className="vocab-actions">
                    <button className="btn-icon small" title="Nghe">
                      <Volume2 size={14} />
                    </button>
                    <button
                      className="btn-icon small"
                      title="Sao chép"
                      onClick={() => navigator.clipboard.writeText(vocab.word)}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Questions Section */}
      <div className="questions-section">
        <div className="questions-header">
          <h3><MessageCircle size={18} /> Câu hỏi luyện tập</h3>
          <button className="btn btn-primary" onClick={() => onOpenQuestionModal()}>
            <Plus size={16} /> Thêm câu hỏi
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="empty-questions">
            <p>Chưa có câu hỏi. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
          </div>
        ) : (
          <div className="questions-list">
            {questions.map((q, i) => renderQuestionCard(q, i))}
          </div>
        )}
      </div>
    </div>
  );
}
