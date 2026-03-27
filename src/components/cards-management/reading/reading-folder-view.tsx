// Reading Tab - Folder View (Passage Listing)

import { Edit2, Trash2, FileText } from 'lucide-react';
import { LEVEL_THEMES } from './reading-tab-types';
import type { FolderViewProps } from './reading-tab-types';
import { EmptyState } from '../../ui/empty-state';

export function ReadingFolderView({
  level,
  passages,
  onEditPassage,
  onDeletePassage,
  canModify,
}: FolderViewProps) {
  const currentTheme = LEVEL_THEMES[level];

  return (
    <div className="rt-content">
      <div className="rt-passages-grid">
        {passages.map((passage, idx) => (
          <div
            key={passage.id}
            className="rt-passage-card"
            style={{ '--card-delay': `${idx * 0.05}s`, '--level-gradient': currentTheme?.gradient, '--level-glow': currentTheme?.glow } as React.CSSProperties}
          >
            <div className="rt-passage-header">
              <div className="rt-passage-badge" style={{ background: currentTheme?.gradient }}>
                {passage.jlptLevel}
              </div>
              <span className="rt-passage-count">{passage.questions.length} câu hỏi</span>
            </div>
            <h4 className="rt-passage-title">{passage.title}</h4>
            <p className="rt-passage-preview">{passage.content.substring(0, 120)}...</p>
            {canModify(passage.createdBy) && (
              <div className="rt-passage-actions">
                <button className="rt-btn rt-btn-sm rt-btn-secondary" onClick={() => onEditPassage(passage)}>
                  <Edit2 size={14} /> Sửa
                </button>
                <button className="rt-btn rt-btn-sm rt-btn-danger" onClick={() => onDeletePassage(passage.id, passage.title)}>
                  <Trash2 size={14} /> Xóa
                </button>
              </div>
            )}
            <div className="rt-passage-shine" />
          </div>
        ))}
        {passages.length === 0 && (
          <EmptyState icon={<FileText size={48} />} title="Chưa có bài đọc" description='Nhấn "Tạo bài đọc" để thêm mới' />
        )}
      </div>
    </div>
  );
}
