// Question Card Component
import { Edit2, Trash2 } from 'lucide-react';
import type { CustomTopicQuestion } from './custom-topics-types';

interface QuestionCardProps {
  question: CustomTopicQuestion;
  index: number;
  canModify: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function QuestionCard({ question, index, canModify, onEdit, onDelete }: QuestionCardProps) {
  return (
    <div className="question-list-item">
      <span className="question-number">{index + 1}.</span>
      <span className="question-text">{question.questionJa}</span>
      {question.questionVi && <span className="question-vi">({question.questionVi})</span>}
      {canModify && (
        <div className="question-actions">
          <button className="btn-icon-sm" onClick={onEdit} title="Sửa">
            <Edit2 size={14} />
          </button>
          <button className="btn-icon-sm danger" onClick={onDelete} title="Xóa">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
