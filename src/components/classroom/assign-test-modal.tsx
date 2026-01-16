// Modal to assign tests from the test bank to a classroom

import { useState } from 'react';
import type { TestTemplate, ClassroomTest, TestType } from '../../types/classroom';
import { FileText, ClipboardList, Clock, Tag, X, Check } from 'lucide-react';

interface AssignTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: TestTemplate[];
  onAssign: (templateId: string, options: { deadline?: string; isPublished: boolean }) => Promise<ClassroomTest | null>;
  classroomName?: string;
  filterType?: TestType | 'all';
}

export function AssignTestModal({
  isOpen,
  onClose,
  templates,
  onAssign,
  classroomName,
  filterType = 'all',
}: AssignTestModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string>('');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TestType | 'all'>(filterType);

  // Filter templates
  const filteredTemplates = activeFilter === 'all'
    ? templates
    : templates.filter(t => t.type === activeFilter);

  // Reset state
  const resetState = () => {
    setSelectedTemplate(null);
    setDeadline('');
    setPublishImmediately(true);
    setSuccessMessage(null);
  };

  // Handle close
  const handleClose = () => {
    resetState();
    onClose();
  };

  // Handle assign
  const handleAssign = async () => {
    if (!selectedTemplate) return;

    setAssigning(true);
    const result = await onAssign(selectedTemplate, {
      deadline: deadline || undefined,
      isPublished: publishImmediately,
    });

    if (result) {
      const template = templates.find(t => t.id === selectedTemplate);
      setSuccessMessage(`Đã giao "${template?.title}" thành công!`);
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
    setAssigning(false);
  };

  // Get selected template info
  const selected = templates.find(t => t.id === selectedTemplate);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="assign-test-modal">
        <div className="modal-header">
          <h3>Giao bài từ ngân hàng</h3>
          {classroomName && <span className="classroom-name">→ {classroomName}</span>}
          <button className="btn-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {successMessage ? (
          <div className="success-message">
            <Check size={48} className="success-icon" />
            <p>{successMessage}</p>
          </div>
        ) : (
          <>
            <div className="modal-body">
              {/* Filter tabs */}
              <div className="filter-tabs">
                <button
                  className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  Tất cả ({templates.length})
                </button>
                <button
                  className={`filter-tab ${activeFilter === 'test' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('test')}
                >
                  Bài kiểm tra ({templates.filter(t => t.type === 'test').length})
                </button>
                <button
                  className={`filter-tab ${activeFilter === 'assignment' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('assignment')}
                >
                  Bài tập ({templates.filter(t => t.type === 'assignment').length})
                </button>
              </div>

              {/* Template list */}
              <div className="template-select-list">
                {filteredTemplates.length === 0 ? (
                  <div className="empty-state">
                    <p>Chưa có mẫu bài kiểm tra nào trong ngân hàng</p>
                    <p className="hint">Vào tab Quản Lí → Bài kiểm tra để tạo mẫu</p>
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`template-option ${selectedTemplate === template.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="template-option-icon">
                        {template.type === 'test' ? <FileText size={20} /> : <ClipboardList size={20} />}
                      </div>
                      <div className="template-option-info">
                        <span className="template-option-title">{template.title}</span>
                        <div className="template-option-meta">
                          <span className={`type-badge ${template.type}`}>
                            {template.type === 'test' ? 'Kiểm tra' : 'Bài tập'}
                          </span>
                          {template.level && <span className="level-badge">{template.level}</span>}
                          <span>{template.questions.length} câu</span>
                          <span>{template.totalPoints} điểm</span>
                          {template.timeLimit && (
                            <span><Clock size={12} /> {template.timeLimit}p</span>
                          )}
                        </div>
                        {template.tags && template.tags.length > 0 && (
                          <div className="template-option-tags">
                            <Tag size={10} />
                            {template.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="tag-mini">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedTemplate === template.id && (
                        <div className="selected-indicator">
                          <Check size={20} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Options when template is selected */}
              {selected && (
                <div className="assign-options">
                  <div className="option-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={publishImmediately}
                        onChange={(e) => setPublishImmediately(e.target.checked)}
                      />
                      Xuất bản ngay (học viên có thể làm bài)
                    </label>
                  </div>
                  {selected.type === 'assignment' && (
                    <div className="option-row">
                      <label>Hạn nộp:</label>
                      <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose} disabled={assigning}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={!selectedTemplate || assigning}
              >
                {assigning ? 'Đang giao...' : 'Giao bài'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
