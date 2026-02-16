// Template list view - displays templates in a folder

import { useState } from 'react';
import { FileText, ClipboardList, Clock, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { TestTemplate } from '../../../types/classroom';

interface TemplateListViewProps {
  templates: TestTemplate[];
  onEdit: (template: TestTemplate) => void;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}

export function TemplateListView({ templates, onEdit, onDelete, saving }: TemplateListViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setDeleteConfirm(null);
  };

  if (templates.length === 0) {
    return (
      <div className="empty-state">
        <p>Chưa có bài kiểm tra/bài tập nào</p>
        <p className="hint">Sử dụng nút ở góc trên để thêm mới</p>
      </div>
    );
  }

  return (
    <div className="template-list">
      {templates.map(template => (
        <div key={template.id} className="template-card">
          <div
            className="template-header"
            onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
          >
            <div className="template-icon">
              {template.type === 'test' ? <FileText size={20} /> : <ClipboardList size={20} />}
            </div>
            <div className="template-info">
              <h4 className="template-title">{template.title}</h4>
              <div className="template-meta">
                <span className="question-count">{template.questions.length} câu</span>
                <span className="points-total">{template.totalPoints} điểm</span>
                {template.timeLimit && (
                  <span className="time-limit">
                    <Clock size={12} />
                    {template.timeLimit} phút
                  </span>
                )}
                {template.sourceType && template.sourceType !== 'custom' && (
                  <span className="source-badge">{template.sourceType === 'flashcard' ? 'Flashcard' : 'JLPT'}</span>
                )}
              </div>
            </div>
            <div className="template-actions">
              <button
                className="btn btn-sm btn-icon"
                onClick={(e) => { e.stopPropagation(); onEdit(template); }}
                title="Chỉnh sửa"
              >
                <Edit2 size={14} />
              </button>
              {deleteConfirm === template.id ? (
                <>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                    disabled={saving}
                  >
                    Xóa
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-sm btn-icon danger"
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(template.id); }}
                  title="Xóa"
                >
                  <Trash2 size={14} />
                </button>
              )}
              {expandedId === template.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {/* Expanded view */}
          {expandedId === template.id && (
            <div className="template-detail">
              {template.description && (
                <p className="template-description">{template.description}</p>
              )}
              <div className="questions-preview">
                <h5>Danh sách câu hỏi:</h5>
                {template.questions.map((q, idx) => (
                  <div key={q.id} className="question-preview">
                    <span className="q-number">{idx + 1}.</span>
                    <span className="q-text">{q.question}</span>
                    <span className="q-points">{q.points}đ</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
