// Folder Detail View Component
import { ArrowLeft, Plus } from 'lucide-react';
import { QuestionCard } from './question-card';
import { renderTopicIcon } from './custom-topics-types';
import type { CustomTopic, CustomTopicFolder, CustomTopicQuestion } from './custom-topics-types';

interface FolderDetailViewProps {
  folder: CustomTopicFolder;
  topic: CustomTopic;
  questions: CustomTopicQuestion[];
  canModifyQuestion: (q: CustomTopicQuestion) => boolean;
  onBack: () => void;
  onAddQuestion: () => void;
  onEditQuestion: (question: CustomTopicQuestion) => void;
  onDeleteQuestion: (question: CustomTopicQuestion) => void;
}

export function FolderDetailView({
  folder,
  topic,
  questions,
  canModifyQuestion,
  onBack,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}: FolderDetailViewProps) {
  return (
    <div className="custom-topics-management">
      {/* Header */}
      <div className="detail-header">
        <button className="btn btn-back" onClick={onBack}>
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="detail-title">
          <span className="detail-icon folder">📁</span>
          <div>
            <h2>{folder.name}</h2>
            <p className="folder-parent-topic">
              <span style={{ color: topic.color }}>{renderTopicIcon(topic.icon, 14)}</span>
              {topic.name}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="folder-actions">
        <button className="btn btn-primary" onClick={onAddQuestion}>
          <Plus size={16} /> Thêm câu hỏi
        </button>
      </div>

      {/* Questions List */}
      <div className="questions-list">
        {questions.length === 0 ? (
          <div className="empty-message">Chưa có câu hỏi. Nhấn "Thêm câu hỏi" để thêm.</div>
        ) : (
          questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              canModify={canModifyQuestion(q)}
              onEdit={() => onEditQuestion(q)}
              onDelete={() => onDeleteQuestion(q)}
            />
          ))
        )}
      </div>
    </div>
  );
}
