// Question Card - Display individual question with actions

import { Edit2, Trash2, GripVertical } from 'lucide-react';
import { ConfirmModal } from '../../ui/confirm-modal';
import type { KaiwaAdvancedQuestion } from '../../../types/kaiwa-advanced';
import type { CanModifyQuestionFn } from './topics-management-types';

interface QuestionCardProps {
  question: KaiwaAdvancedQuestion;
  index: number;
  deleteQuestionTarget: KaiwaAdvancedQuestion | null;
  canModifyQuestion: CanModifyQuestionFn;
  onOpenQuestionModal: (question: KaiwaAdvancedQuestion) => void;
  onSetDeleteQuestionTarget: (question: KaiwaAdvancedQuestion | null) => void;
  onDeleteQuestion: (id: string) => Promise<boolean>;
}

export function QuestionCard({
  question,
  index,
  deleteQuestionTarget,
  canModifyQuestion,
  onOpenQuestionModal,
  onSetDeleteQuestionTarget,
  onDeleteQuestion,
}: QuestionCardProps) {
  return (
    <>
      <div className="kaiwa-question-card">
        <div className="question-order">
          <GripVertical size={16} />
          <span>{index + 1}</span>
        </div>
        <div className="question-content">
          <p className="question-ja">{question.questionJa}</p>
          {question.questionVi && (
            <p className="question-vi">{question.questionVi}</p>
          )}
          {question.situationContext && (
            <p className="question-context">
              <span className="context-label">Tình huống:</span> {question.situationContext}
            </p>
          )}
          {question.suggestedAnswers && question.suggestedAnswers.length > 0 && (
            <div className="question-answers">
              <span className="answers-label">Gợi ý trả lời:</span>
              <ul>
                {question.suggestedAnswers.map((answer, i) => (
                  <li key={i}>{answer}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {canModifyQuestion(question) && (
          <div className="question-actions">
            <button className="btn-icon" onClick={() => onOpenQuestionModal(question)} title="Sửa">
              <Edit2 size={14} />
            </button>
            <button className="btn-icon danger" onClick={() => onSetDeleteQuestionTarget(question)} title="Xóa">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteQuestionTarget?.id === question.id}
        title="Xác nhận xóa câu hỏi"
        message="Xóa câu hỏi này?"
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteQuestionTarget) {
            await onDeleteQuestion(deleteQuestionTarget.id);
            onSetDeleteQuestionTarget(null);
          }
        }}
        onCancel={() => onSetDeleteQuestionTarget(null)}
      />
    </>
  );
}
