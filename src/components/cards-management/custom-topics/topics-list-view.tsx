// Topics List View Component
import { Plus, Grid, List, Upload, Star } from 'lucide-react';
import { SearchInput } from '../../ui/search-input';
import { EmptyState } from '../../ui/empty-state';
import { TopicCard } from './topic-card';
import type { CustomTopic, ViewMode } from './custom-topics-types';

interface TopicsListViewProps {
  topics: CustomTopic[];
  viewMode: ViewMode;
  searchQuery: string;
  canModifyTopic: (topic: CustomTopic) => boolean;
  getTopicQuestionCount: (topicId: string) => number;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onTopicClick: (topicId: string) => void;
  onAddTopic: () => void;
  onEditTopic: (topic: CustomTopic) => void;
  onDeleteTopic: (topic: CustomTopic) => void;
  onExportTopic?: (topicId: string) => void;
  onImportTopic?: (data: unknown) => Promise<boolean>;
}

export function TopicsListView({
  topics,
  viewMode,
  searchQuery,
  canModifyTopic,
  getTopicQuestionCount,
  onSearchChange,
  onViewModeChange,
  onTopicClick,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onExportTopic,
  onImportTopic,
}: TopicsListViewProps) {
  return (
    <div className="custom-topics-management">
      {/* Header */}
      <div className="topics-header">
        <div className="topics-title">
          <h2>
            <Star size={24} />
            Chủ đề mở rộng
          </h2>
          <p className="topics-subtitle">Tạo bộ câu hỏi theo chủ đề riêng ngoài JLPT</p>
        </div>
        <div className="topics-actions">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Tìm chủ đề..."
            className="search-box"
          />
          <div className="view-toggle">
            <button
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              title="Lưới"
            >
              <Grid size={18} />
            </button>
            <button
              className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => onViewModeChange('list')}
              title="Danh sách"
            >
              <List size={18} />
            </button>
          </div>
          {onImportTopic && (
            <button className="btn btn-secondary" title="Nhập chủ đề">
              <Upload size={16} /> Nhập
            </button>
          )}
          <button className="btn btn-primary" onClick={onAddTopic}>
            <Plus size={16} /> Tạo chủ đề
          </button>
        </div>
      </div>

      {/* Topics Grid/List */}
      {topics.length === 0 ? (
        <EmptyState
          icon={<Star size={48} strokeWidth={1.5} />}
          title="Chưa có chủ đề nào"
          description="Tạo chủ đề đầu tiên để bắt đầu xây dựng bộ câu hỏi riêng của bạn"
          action={{ label: 'Tạo chủ đề mới', onClick: onAddTopic }}
        />
      ) : (
        <div className={`topics-grid ${viewMode}`}>
          {topics.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              viewMode={viewMode}
              questionCount={getTopicQuestionCount(topic.id)}
              canModify={canModifyTopic(topic)}
              onClick={() => onTopicClick(topic.id)}
              onEdit={() => onEditTopic(topic)}
              onDelete={() => onDeleteTopic(topic)}
              onExport={onExportTopic ? () => onExportTopic(topic.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
