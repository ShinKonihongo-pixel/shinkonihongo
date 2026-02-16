// Test form modal for creating/editing test templates

import { useState } from 'react';
import { BookOpen, FileQuestion, Shuffle } from 'lucide-react';
import type { TestTemplate } from '../../../types/classroom';
import type { TestTemplateFormData } from '../../../services/classroom-firestore';
import { QuestionEditor } from './question-editor';

interface TestFormModalProps {
  show: boolean;
  editingTemplate: TestTemplate | null;
  formData: TestTemplateFormData;
  saving: boolean;
  onFormDataChange: (data: TestTemplateFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
  onOpenImport: (source: 'flashcard' | 'jlpt') => void;
  onOpenAutoGenerate: () => void;
}

export function TestFormModal({
  show,
  editingTemplate,
  formData,
  saving,
  onFormDataChange,
  onSubmit,
  onClose,
  onOpenImport,
  onOpenAutoGenerate,
}: TestFormModalProps) {
  const [tagInput, setTagInput] = useState('');

  if (!show) return null;

  const totalPoints = formData.questions.reduce((sum, q) => sum + q.points, 0);

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      onFormDataChange({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    onFormDataChange({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    });
  };

  return (
    <div className="test-form-overlay">
      <form className="test-template-form" onSubmit={onSubmit}>
        <div className="form-header">
          <h4>{editingTemplate ? 'Chỉnh sửa' : 'Tạo mới'} {formData.type === 'test' ? 'bài kiểm tra' : 'bài tập'}</h4>
          <button type="button" className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="form-body">
          {/* Basic info */}
          <div className="form-row">
            <div className="form-group">
              <label>Tiêu đề <span className="required">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
                placeholder="Tên bài..."
                required
              />
            </div>
            {formData.type === 'test' && (
              <div className="form-group">
                <label>Thời gian (phút)</label>
                <input
                  type="number"
                  value={formData.timeLimit || ''}
                  onChange={(e) => onFormDataChange({ ...formData, timeLimit: parseInt(e.target.value) || undefined })}
                  placeholder="30"
                  min={1}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder="Mô tả..."
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <div className="tags-list">
                {formData.tags?.map(tag => (
                  <span key={tag} className="tag-item">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Thêm tag..."
              />
              <button type="button" className="btn btn-sm" onClick={addTag}>+</button>
            </div>
          </div>

          {/* Import buttons */}
          <div className="import-buttons">
            <span className="import-label">Nhập câu hỏi từ:</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenImport('flashcard')}
            >
              <BookOpen size={14} />
              Flashcard
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenImport('jlpt')}
            >
              <FileQuestion size={14} />
              JLPT
            </button>
            <span className="import-divider">|</span>
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={onOpenAutoGenerate}
            >
              <Shuffle size={14} />
              Tự động tạo
            </button>
          </div>

          {/* Questions */}
          <div className="form-group">
            <label>Câu hỏi <span className="required">*</span> ({formData.questions.length} câu - {totalPoints} điểm)</label>
            <QuestionEditor
              questions={formData.questions}
              onChange={(questions) => onFormDataChange({ ...formData, questions })}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !formData.title || formData.questions.length === 0}
          >
            {saving ? 'Đang lưu...' : editingTemplate ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </form>
    </div>
  );
}
