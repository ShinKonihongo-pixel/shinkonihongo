// Reading Tab - Passage Form View

import { FileText, HelpCircle, CheckCircle2, Plus, Wand2, Loader2 } from 'lucide-react';
import { EmptyState } from '../../ui/empty-state';
import type { PassageFormProps } from './reading-tab-types';

export function ReadingPassageView({
  editingPassage,
  formData,
  generatingFurigana,
  onSubmit,
  onCancel,
  onUpdateFormData,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onUpdateAnswer,
  onSetCorrectAnswer,
  onAddVocabulary,
  onRemoveVocabulary,
  onUpdateVocabulary,
  onGenerateFuriganaContent,
  onGenerateFuriganaQuestion,
  onGenerateFuriganaAnswer,
  onGenerateAllFurigana,
}: PassageFormProps) {
  return (
    <div className="rt-form-container">
      <form className="rt-form" onSubmit={onSubmit}>
        <div className="rt-form-header">
          <FileText size={20} />
          <h3>{editingPassage ? 'Chỉnh sửa bài đọc' : 'Tạo bài đọc mới'}</h3>
        </div>

        <div className="rt-form-group">
          <label>
            <span className="rt-label-icon">📝</span>
            Tiêu đề
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onUpdateFormData({ title: e.target.value })}
            placeholder="Nhập tiêu đề bài đọc..."
            className="rt-input"
            required
          />
        </div>

        <div className="rt-form-group">
          <label className="rt-label-with-action">
            <span>
              <span className="rt-label-icon">📖</span>
              Nội dung đoạn văn
            </span>
            <button
              type="button"
              className="rt-furigana-btn"
              onClick={onGenerateFuriganaContent}
              disabled={!!generatingFurigana || !formData.content.trim()}
              title="Tạo furigana cho nội dung"
            >
              {generatingFurigana === 'content' ? <Loader2 size={14} className="rt-spin" /> : <Wand2 size={14} />}
              <span>Furigana</span>
            </button>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => onUpdateFormData({ content: e.target.value })}
            placeholder="Nhập nội dung đoạn văn tiếng Nhật..."
            className="rt-textarea"
            rows={8}
            required
          />
        </div>

        <div className="rt-form-group">
          <label className="rt-questions-label">
            <span>
              <span className="rt-label-icon">❓</span>
              Câu hỏi ({formData.questions.length})
            </span>
            <div className="rt-questions-actions">
              <button
                type="button"
                className="rt-furigana-btn rt-furigana-all"
                onClick={onGenerateAllFurigana}
                disabled={!!generatingFurigana}
                title="Tạo furigana cho tất cả"
              >
                {generatingFurigana === 'all' ? <Loader2 size={14} className="rt-spin" /> : <Wand2 size={14} />}
                <span>Furigana tất cả</span>
              </button>
              <button type="button" className="rt-btn rt-btn-add-q" onClick={onAddQuestion}>
                <Plus size={14} /> Thêm câu
              </button>
            </div>
          </label>

          <div className="rt-questions-list">
            {formData.questions.map((q, qIdx) => (
              <div key={qIdx} className="rt-question-card">
                <div className="rt-question-header">
                  <div className="rt-question-num">
                    <HelpCircle size={16} />
                    <span>Câu {qIdx + 1}</span>
                  </div>
                  {formData.questions.length > 1 && (
                    <button type="button" className="rt-btn-remove" onClick={() => onRemoveQuestion(qIdx)}>×</button>
                  )}
                </div>

                <div className="rt-question-input-wrap">
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => onUpdateQuestion(qIdx, 'question', e.target.value)}
                    placeholder="Nội dung câu hỏi..."
                    className="rt-input rt-question-input"
                  />
                  <button
                    type="button"
                    className="rt-furigana-btn-inline"
                    onClick={() => onGenerateFuriganaQuestion(qIdx)}
                    disabled={!!generatingFurigana || !q.question.trim()}
                    title="Tạo furigana"
                  >
                    {generatingFurigana === `q-${qIdx}` ? <Loader2 size={12} className="rt-spin" /> : <Wand2 size={12} />}
                  </button>
                </div>

                <div className="rt-answers-grid">
                  {q.answers.map((a, aIdx) => (
                    <div key={aIdx} className={`rt-answer-row ${a.isCorrect ? 'rt-correct' : ''}`}>
                      <label className="rt-radio-label">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={a.isCorrect}
                          onChange={() => onSetCorrectAnswer(qIdx, aIdx)}
                          className="rt-radio"
                        />
                        <span className="rt-radio-custom">
                          {a.isCorrect && <CheckCircle2 size={14} />}
                        </span>
                      </label>
                      <span className="rt-answer-letter">{String.fromCharCode(65 + aIdx)}</span>
                      <input
                        type="text"
                        value={a.text}
                        onChange={(e) => onUpdateAnswer(qIdx, aIdx, e.target.value)}
                        placeholder={`Đáp án ${String.fromCharCode(65 + aIdx)}`}
                        className="rt-input rt-answer-input"
                      />
                      <button
                        type="button"
                        className="rt-furigana-btn-inline"
                        onClick={() => onGenerateFuriganaAnswer(qIdx, aIdx)}
                        disabled={!!generatingFurigana || !a.text.trim()}
                        title="Tạo furigana"
                      >
                        {generatingFurigana === `a-${qIdx}-${aIdx}` ? <Loader2 size={12} className="rt-spin" /> : <Wand2 size={12} />}
                      </button>
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => onUpdateQuestion(qIdx, 'explanation', e.target.value)}
                  placeholder="💡 Giải thích (tùy chọn)..."
                  className="rt-input rt-explanation-input"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Vocabulary Section */}
        <div className="rt-form-group">
          <label className="rt-vocab-label">
            <span>
              <span className="rt-label-icon">📚</span>
              Từ vựng mới ({formData.vocabulary.length})
            </span>
            <button type="button" className="rt-btn rt-btn-add-vocab" onClick={onAddVocabulary}>
              <Plus size={14} /> Thêm từ
            </button>
          </label>

          {formData.vocabulary.length > 0 && (
            <div className="rt-vocab-list">
              {formData.vocabulary.map((vocab, vIdx) => (
                <div key={vIdx} className="rt-vocab-row">
                  <input
                    type="text"
                    value={vocab.word}
                    onChange={(e) => onUpdateVocabulary(vIdx, 'word', e.target.value)}
                    placeholder="Từ vựng"
                    className="rt-input rt-vocab-word"
                  />
                  <input
                    type="text"
                    value={vocab.reading || ''}
                    onChange={(e) => onUpdateVocabulary(vIdx, 'reading', e.target.value)}
                    placeholder="Cách đọc"
                    className="rt-input rt-vocab-reading"
                  />
                  <input
                    type="text"
                    value={vocab.meaning}
                    onChange={(e) => onUpdateVocabulary(vIdx, 'meaning', e.target.value)}
                    placeholder="Nghĩa tiếng Việt"
                    className="rt-input rt-vocab-meaning"
                  />
                  <button type="button" className="rt-btn-remove-vocab" onClick={() => onRemoveVocabulary(vIdx)}>×</button>
                </div>
              ))}
            </div>
          )}

          {formData.vocabulary.length === 0 && (
            <EmptyState compact title="Chưa có từ vựng" description='Nhấn "Thêm từ" để bắt đầu' />
          )}
        </div>

        <div className="rt-form-actions">
          <button type="button" className="rt-btn rt-btn-ghost" onClick={onCancel}>Hủy</button>
          <button type="submit" className="rt-btn rt-btn-primary">
            {editingPassage ? 'Cập nhật' : 'Tạo bài đọc'}
          </button>
        </div>
      </form>
    </div>
  );
}
