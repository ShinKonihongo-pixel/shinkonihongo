// Question Modal Component
import { Plus, Trash2 } from 'lucide-react';
import type { CustomTopicQuestion, CustomTopicQuestionFormData } from './custom-topics-types';

interface QuestionModalProps {
  isOpen: boolean;
  editingQuestion: CustomTopicQuestion | null;
  formData: CustomTopicQuestionFormData;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (data: CustomTopicQuestionFormData) => void;
  onAddSuggestedAnswer: () => void;
  onUpdateSuggestedAnswer: (index: number, value: string) => void;
  onRemoveSuggestedAnswer: (index: number) => void;
}

export function QuestionModal({
  isOpen,
  editingQuestion,
  formData,
  onClose,
  onSave,
  onFormChange,
  onAddSuggestedAnswer,
  onUpdateSuggestedAnswer,
  onRemoveSuggestedAnswer,
}: QuestionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="question-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingQuestion ? 'Sửa câu hỏi hội thoại' : 'Thêm câu hỏi hội thoại'}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-section">
            <label>Câu hỏi tiếng Nhật *</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="VD: 今日の調子はどうですか？"
              value={formData.questionJa}
              onChange={e => onFormChange({ ...formData, questionJa: e.target.value })}
            />
          </div>
          <div className="form-section">
            <label>Dịch nghĩa tiếng Việt</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Hôm nay bạn thấy thế nào?"
              value={formData.questionVi || ''}
              onChange={e => onFormChange({ ...formData, questionVi: e.target.value })}
            />
          </div>
          <div className="form-section">
            <label>Tình huống / Ngữ cảnh</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Khi gặp đồng nghiệp vào buổi sáng"
              value={formData.situationContext || ''}
              onChange={e => onFormChange({ ...formData, situationContext: e.target.value })}
            />
          </div>
          <div className="form-section">
            <label>Gợi ý câu trả lời ({(formData.suggestedAnswers || []).length})</label>
            <p className="form-hint">Các mẫu câu trả lời để AI tham khảo khi đánh giá</p>
            <div className="suggested-answers-list">
              {(formData.suggestedAnswers || []).map((answer, index) => (
                <div key={index} className="suggested-answer-row">
                  <span className="answer-number">{index + 1}.</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: 元気です、ありがとうございます"
                    value={answer}
                    onChange={e => onUpdateSuggestedAnswer(index, e.target.value)}
                  />
                  <button className="btn-icon danger" onClick={() => onRemoveSuggestedAnswer(index)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button className="btn btn-secondary btn-small" onClick={onAddSuggestedAnswer}>
                <Plus size={14} /> Thêm gợi ý
              </button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={onSave} disabled={!formData.questionJa.trim()}>
            {editingQuestion ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  );
}
