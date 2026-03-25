// Assign test from bank to classroom — premium dark glassmorphism UI
import { useState, useEffect } from 'react';
import {
  X, Check, FileText, ClipboardList, Clock, Tag, Send,
  Search, CalendarClock, Eye, Zap, BookOpen, Award,
} from 'lucide-react';
import type { TestTemplate, ClassroomTest, TestType } from '../../types/classroom';
import './assign-test-modal.css';

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
  const [deadline, setDeadline] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<TestType | 'all'>(filterType);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates
    .filter(t => activeFilter === 'all' || t.type === activeFilter)
    .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const testCount = templates.filter(t => t.type === 'test').length;
  const assignCount = templates.filter(t => t.type === 'assignment').length;

  const resetState = () => {
    setSelectedTemplate(null);
    setDeadline('');
    setPublishImmediately(true);
    setSuccessMessage(null);
    setError('');
    setSearchQuery('');
    setActiveFilter(filterType);
  };

  // Reset state when modal opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isOpen) resetState(); }, [isOpen]);

  const handleClose = () => { resetState(); onClose(); };

  const handleAssign = async () => {
    if (!selectedTemplate) return;
    setAssigning(true);
    setError('');
    const result = await onAssign(selectedTemplate, {
      deadline: deadline || undefined,
      isPublished: publishImmediately,
    });
    if (result) {
      const template = templates.find(t => t.id === selectedTemplate);
      setSuccessMessage(`Đã giao "${template?.title}" thành công!`);
      setTimeout(handleClose, 1500);
    } else {
      setError('Lỗi khi giao bài. Vui lòng thử lại.');
    }
    setAssigning(false);
  };

  const selected = templates.find(t => t.id === selectedTemplate);

  if (!isOpen) return null;

  return (
    <div className="atm-overlay" onClick={handleClose}>
      <div className="atm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="atm-header">
          <div className="atm-header-left">
            <div className="atm-header-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="atm-title">Giao bài từ ngân hàng</h2>
              {classroomName && <p className="atm-subtitle">→ {classroomName}</p>}
            </div>
          </div>
          <button className="atm-close" onClick={handleClose} aria-label="Đóng"><X size={18} /></button>
        </div>

        {/* Success state */}
        {successMessage ? (
          <div className="atm-success">
            <div className="atm-success-icon">
              <Check size={36} />
            </div>
            <p className="atm-success-text">{successMessage}</p>
          </div>
        ) : (
          <>
            <div className="atm-body">
              {error && <div className="atm-error">{error}</div>}
              {/* Search + filter bar */}
              <div className="atm-toolbar">
                <div className="atm-search">
                  <Search size={15} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="atm-search-input"
                    aria-label="Tìm kiếm mẫu bài"
                  />
                </div>
                <div className="atm-filters">
                  {[
                    { key: 'all' as const, label: 'Tất cả', count: templates.length },
                    { key: 'test' as const, label: 'Kiểm tra', count: testCount },
                    { key: 'assignment' as const, label: 'Bài tập', count: assignCount },
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`atm-filter ${activeFilter === f.key ? 'active' : ''}`}
                      onClick={() => setActiveFilter(f.key)}
                      aria-pressed={activeFilter === f.key}
                    >
                      {f.label}
                      <span className="atm-filter-count">{f.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template list */}
              <div className="atm-list">
                {filteredTemplates.length === 0 ? (
                  <div className="atm-empty">
                    <BookOpen size={32} />
                    <p>Không tìm thấy mẫu bài nào</p>
                    <span>Vào Quản Lí → Bài kiểm tra để tạo mẫu</span>
                  </div>
                ) : (
                  filteredTemplates.map(template => {
                    const isSelected = selectedTemplate === template.id;
                    const isTestType = template.type === 'test';
                    return (
                      <div
                        key={template.id}
                        className={`atm-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedTemplate(template.id)}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedTemplate(template.id)}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                      >
                        <div className={`atm-card-icon ${template.type}`}>
                          {isTestType ? <FileText size={18} /> : <ClipboardList size={18} />}
                        </div>
                        <div className="atm-card-body">
                          <span className="atm-card-title">{template.title}</span>
                          <div className="atm-card-meta">
                            <span className={`atm-type-badge ${template.type}`}>
                              {isTestType ? 'Kiểm tra' : 'Bài tập'}
                            </span>
                            {template.level && <span className="atm-level-badge">{template.level}</span>}
                            <span className="atm-meta-item">
                              <FileText size={11} /> {template.questions.length} câu
                            </span>
                            <span className="atm-meta-item">
                              <Award size={11} /> {template.totalPoints}đ
                            </span>
                            {template.timeLimit && (
                              <span className="atm-meta-item">
                                <Clock size={11} /> {template.timeLimit}p
                              </span>
                            )}
                          </div>
                          {template.tags && template.tags.length > 0 && (
                            <div className="atm-card-tags">
                              <Tag size={10} />
                              {template.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="atm-tag">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={`atm-card-check ${isSelected ? 'visible' : ''}`}>
                          <Check size={16} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Assignment options panel */}
              {selected && (
                <div className="atm-options">
                  <div className="atm-options-title">Tuỳ chọn giao bài</div>
                  <div className="atm-opt-row">
                    <label className="atm-toggle">
                      <input
                        type="checkbox"
                        checked={publishImmediately}
                        onChange={e => setPublishImmediately(e.target.checked)}
                      />
                      <span className="atm-toggle-track">
                        <span className="atm-toggle-thumb" />
                      </span>
                      <span className="atm-toggle-label">
                        {publishImmediately ? <><Eye size={13} /> Xuất bản ngay</> : <><Zap size={13} /> Lưu nháp</>}
                      </span>
                    </label>
                  </div>
                  {selected.type === 'assignment' && (
                    <div className="atm-opt-row">
                      <label className="atm-opt-label"><CalendarClock size={13} /> Hạn nộp</label>
                      <input
                        type="datetime-local"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="atm-date-input"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="atm-footer">
              <button className="atm-btn-cancel" onClick={handleClose} disabled={assigning}>Hủy</button>
              <button
                className="atm-btn-assign"
                onClick={handleAssign}
                disabled={!selectedTemplate || assigning}
              >
                <Send size={15} />
                {assigning ? 'Đang giao...' : 'Giao bài'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
