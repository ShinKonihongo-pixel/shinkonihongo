// Question Form Modal - Create/Edit question

import { Plus, X } from 'lucide-react';
import { ModalShell } from '../../ui/modal-shell';
import type {
  KaiwaAdvancedQuestion,
  KaiwaAdvancedQuestionFormData,
} from '../../../types/kaiwa-advanced';

interface QuestionFormModalProps {
  isOpen: boolean;
  editingQuestion: KaiwaAdvancedQuestion | null;
  questionForm: KaiwaAdvancedQuestionFormData;
  onClose: () => void;
  onSave: () => void;
  onUpdateForm: (updates: Partial<KaiwaAdvancedQuestionFormData>) => void;
}

export function QuestionFormModal({
  isOpen,
  editingQuestion,
  questionForm,
  onClose,
  onSave,
  onUpdateForm,
}: QuestionFormModalProps) {
  const handleAddSuggestedAnswer = () => {
    onUpdateForm({
      suggestedAnswers: [...(questionForm.suggestedAnswers || []), ''],
    });
  };

  const handleUpdateSuggestedAnswer = (index: number, value: string) => {
    const newAnswers = [...(questionForm.suggestedAnswers || [])];
    newAnswers[index] = value;
    onUpdateForm({ suggestedAnswers: newAnswers });
  };

  const handleRemoveSuggestedAnswer = (index: number) => {
    const newAnswers = (questionForm.suggestedAnswers || []).filter((_, i) => i !== index);
    onUpdateForm({ suggestedAnswers: newAnswers });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}
      maxWidth={520}
    >
      <div className="modal-body">
        <div className="form-section">
          <label>Câu hỏi tiếng Nhật *</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="VD: お名前を教えていただけますか？"
            value={questionForm.questionJa}
            onChange={e => onUpdateForm({ questionJa: e.target.value })}
          />
        </div>
        <div className="form-section">
          <label>Dịch nghĩa tiếng Việt</label>
          <input
            type="text"
            className="form-input"
            placeholder="VD: Cho tôi biết tên của bạn được không?"
            value={questionForm.questionVi}
            onChange={e => onUpdateForm({ questionVi: e.target.value })}
          />
        </div>
        <div className="form-section">
          <label>Tình huống / Ngữ cảnh</label>
          <input
            type="text"
            className="form-input"
            placeholder="VD: Khi bắt đầu phỏng vấn"
            value={questionForm.situationContext}
            onChange={e => onUpdateForm({ situationContext: e.target.value })}
          />
        </div>
        <div className="form-section">
          <label>Gợi ý câu trả lời ({questionForm.suggestedAnswers?.length || 0})</label>
          <div className="suggested-answers-list">
            {(questionForm.suggestedAnswers || []).map((answer, index) => (
              <div key={index} className="suggested-answer-row">
                <span className="answer-number">{index + 1}.</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập gợi ý trả lời..."
                  value={answer}
                  onChange={e => handleUpdateSuggestedAnswer(index, e.target.value)}
                />
                <button
                  className="btn-icon danger"
                  onClick={() => handleRemoveSuggestedAnswer(index)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-small" onClick={handleAddSuggestedAnswer}>
              <Plus size={14} /> Thêm gợi ý
            </button>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
        <button
          className="btn btn-primary"
          onClick={onSave}
          disabled={!questionForm.questionJa.trim()}
        >
          {editingQuestion ? 'Cập nhật' : 'Thêm'}
        </button>
      </div>
    </ModalShell>
  );
}
