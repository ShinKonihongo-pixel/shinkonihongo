// Topics List View - Grid/List display of all topics

import {
  Plus, Edit2, Trash2, Grid, List,
  Eye, EyeOff, MessageCircle, BookOpen,
} from 'lucide-react';
import { ConfirmModal } from '../../ui/confirm-modal';
import { SearchInput } from '../../ui/search-input';
import type { KaiwaAdvancedTopic } from '../../../types/kaiwa-advanced';
import type { ViewMode, CanModifyTopicFn } from './topics-management-types';

interface TopicsListViewProps {
  topics: KaiwaAdvancedTopic[];
  viewMode: ViewMode;
  searchQuery: string;
  deleteTopicTarget: KaiwaAdvancedTopic | null;
  canModifyTopic: CanModifyTopicFn;
  onSetViewMode: (mode: ViewMode) => void;
  onSetSearchQuery: (query: string) => void;
  onTopicClick: (topicId: string) => void;
  onOpenTopicModal: (topic?: KaiwaAdvancedTopic) => void;
  onSetDeleteTopicTarget: (topic: KaiwaAdvancedTopic | null) => void;
  onDeleteTopic: (id: string) => Promise<boolean>;
}

export function TopicsListView({
  topics,
  viewMode,
  searchQuery,
  deleteTopicTarget,
  canModifyTopic,
  onSetViewMode,
  onSetSearchQuery,
  onTopicClick,
  onOpenTopicModal,
  onSetDeleteTopicTarget,
  onDeleteTopic,
}: TopicsListViewProps) {
  // Filter topics by search
  const filteredTopics = searchQuery.trim()
    ? topics.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topics;

  // Topic Card renderer
  const renderTopicCard = (topic: KaiwaAdvancedTopic) => {
    return (
      <div
        key={topic.id}
        className={`kaiwa-topic-card ${viewMode}`}
        style={{ '--topic-color': topic.color } as React.CSSProperties}
        onClick={() => onTopicClick(topic.id)}
      >
        <div className="topic-card-header">
          <span className="topic-icon" style={{ backgroundColor: `${topic.color}20` }}>
            {topic.icon}
          </span>
          {canModifyTopic(topic) && (
            <div className="topic-card-actions" onClick={e => e.stopPropagation()}>
              <button className="btn-icon" onClick={() => onOpenTopicModal(topic)} title="Sửa">
                <Edit2 size={14} />
              </button>
              <button className="btn-icon danger" onClick={() => onSetDeleteTopicTarget(topic)} title="Xóa">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="topic-card-body">
          <h3 className="topic-name">{topic.name}</h3>
          <p className="topic-description">{topic.description}</p>
          <div className="topic-meta">
            <span className="topic-level">{topic.level}</span>
            <span className="topic-count">
              <MessageCircle size={14} /> {(topic.questionBank?.length || 0) + (topic.answerBank?.length || 0)} mẫu
            </span>
            <span className="topic-vocab">
              <BookOpen size={14} /> {topic.vocabulary?.length || 0} từ
            </span>
            <span className="topic-visibility">
              {topic.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="kaiwa-topics-management">
      {/* Header */}
      <div className="topics-header">
        <div className="topics-title">
          <h2>
            <MessageCircle size={24} />
            Chủ đề hội thoại
          </h2>
          <p className="topics-subtitle">Tạo chủ đề và câu hỏi riêng cho luyện tập hội thoại</p>
        </div>
        <div className="topics-actions">
          <SearchInput
            value={searchQuery}
            onChange={onSetSearchQuery}
            placeholder="Tìm chủ đề..."
            className="search-box"
          />
          <div className="view-toggle">
            <button
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => onSetViewMode('grid')}
              title="Lưới"
            >
              <Grid size={18} />
            </button>
            <button
              className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => onSetViewMode('list')}
              title="Danh sách"
            >
              <List size={18} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => onOpenTopicModal()}>
            <Plus size={16} /> Tạo chủ đề
          </button>
        </div>
      </div>

      {/* Topics Grid/List */}
      {filteredTopics.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>Chưa có chủ đề nào</h3>
          <p>Tạo chủ đề đầu tiên để bắt đầu luyện tập hội thoại theo chủ đề riêng</p>
          <button className="btn btn-primary" onClick={() => onOpenTopicModal()}>
            <Plus size={16} /> Tạo chủ đề mới
          </button>
        </div>
      ) : (
        <div className={`topics-grid ${viewMode}`}>
          {filteredTopics.map(renderTopicCard)}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteTopicTarget !== null}
        title="Xác nhận xóa chủ đề"
        message={`Xóa chủ đề "${deleteTopicTarget?.name}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteTopicTarget) {
            await onDeleteTopic(deleteTopicTarget.id);
            onSetDeleteTopicTarget(null);
          }
        }}
        onCancel={() => onSetDeleteTopicTarget(null)}
      />
    </div>
  );
}
