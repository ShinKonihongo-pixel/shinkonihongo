// Topic Card Component
import { Edit2, Trash2, FileQuestion, Eye, EyeOff, Download } from 'lucide-react';
import { DIFFICULTY_LABELS } from '../../../types/custom-topic';
import { renderTopicIcon } from './custom-topics-types';
import type { CustomTopic } from './custom-topics-types';

interface TopicCardProps {
  topic: CustomTopic;
  viewMode: 'grid' | 'list';
  questionCount: number;
  canModify: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport?: () => void;
}

export function TopicCard({
  topic,
  viewMode,
  questionCount,
  canModify,
  onClick,
  onEdit,
  onDelete,
  onExport,
}: TopicCardProps) {
  const diffLabel = DIFFICULTY_LABELS[topic.difficulty];

  return (
    <div
      className={`custom-topic-card ${viewMode}`}
      style={{ '--topic-color': topic.color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="topic-card-header">
        <span className="topic-icon" style={{ backgroundColor: `${topic.color}20`, color: topic.color }}>
          {renderTopicIcon(topic.icon, 24)}
        </span>
      </div>
      <div className="topic-card-body">
        <h3 className="topic-name">{topic.name}</h3>
        <p className="topic-description">{topic.description}</p>
        <div className="topic-meta">
          <span className="topic-difficulty" style={{ color: diffLabel.color }}>
            {diffLabel.label}
          </span>
          <span className="topic-count">
            <FileQuestion size={14} /> {questionCount} câu
          </span>
          <span className="topic-visibility">
            {topic.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
          </span>
        </div>
        {topic.tags.length > 0 && (
          <div className="topic-tags">
            {topic.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="topic-tag">{tag}</span>
            ))}
            {topic.tags.length > 3 && <span className="topic-tag more">+{topic.tags.length - 3}</span>}
          </div>
        )}
      </div>
      {canModify && (
        <div className="topic-card-actions" onClick={e => e.stopPropagation()}>
          <button className="btn-icon" onClick={onEdit} title="Chỉnh sửa">
            <Edit2 size={14} />
          </button>
          {onExport && (
            <button className="btn-icon" onClick={onExport} title="Xuất">
              <Download size={14} />
            </button>
          )}
          <button className="btn-icon danger" onClick={onDelete} title="Xóa">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
