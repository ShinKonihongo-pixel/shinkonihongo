// Lecture Editor Modals - Symbol picker, admin notes, settings

import { ConfirmModal } from '../ui/confirm-modal';
import type { JLPTLevel } from '../../types/flashcard';
import type { TextSelection, LectureFormState } from './editor-types';
import { LECTURE_SYMBOLS } from './editor-constants';

// Symbol Picker Modal
interface SymbolPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSymbol: (symbol: string) => void;
}

export function SymbolPickerModal({ isOpen, onClose, onInsertSymbol }: SymbolPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ppt-modal-overlay" onClick={onClose}>
      <div className="ppt-symbol-modal" onClick={e => e.stopPropagation()}>
        <div className="ppt-modal-header">
          <h3>Chèn Biểu tượng</h3>
          <button className="ppt-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ppt-symbol-categories">
          {Object.entries(LECTURE_SYMBOLS).map(([category, symbols]) => (
            <div key={category} className="ppt-symbol-category">
              <h4>{category}</h4>
              <div className="ppt-symbol-grid">
                {symbols.map((s, i) => (
                  <button
                    key={i}
                    className="ppt-symbol-item"
                    onClick={() => onInsertSymbol(s)}
                    title={s}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Admin Note Modal
interface AdminNoteModalProps {
  isOpen: boolean;
  textSelection: TextSelection | null;
  editingNoteId: string | null;
  noteContent: string;
  onNoteContentChange: (content: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function AdminNoteModal({
  isOpen, textSelection, editingNoteId, noteContent,
  onNoteContentChange, onClose, onSave,
}: AdminNoteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ppt-modal-overlay" onClick={onClose}>
      <div className="ppt-note-modal" onClick={e => e.stopPropagation()}>
        <div className="ppt-modal-header">
          <h3>{editingNoteId ? 'Sửa ghi chú' : 'Thêm ghi chú Admin'}</h3>
          <button className="ppt-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ppt-note-modal-content">
          {textSelection && !editingNoteId && (
            <div className="ppt-note-selected-text">
              <label>Đoạn văn bản đã chọn:</label>
              <div className="ppt-note-highlight">"{textSelection.text}"</div>
            </div>
          )}
          <div className="ppt-note-input-group">
            <label>Nội dung ghi chú (chỉ admin thấy):</label>
            <textarea
              value={noteContent}
              onChange={(e) => onNoteContentChange(e.target.value)}
              placeholder="Nhập ghi chú cho đoạn văn bản này..."
              rows={4}
              autoFocus
            />
          </div>
          <div className="ppt-note-modal-actions">
            <button className="ppt-btn" onClick={onClose}>Hủy</button>
            <button
              className="ppt-btn ppt-btn-primary"
              onClick={onSave}
              disabled={!noteContent.trim()}
            >
              {editingNoteId ? 'Cập nhật' : 'Thêm ghi chú'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Panel
interface SettingsPanelProps {
  isOpen: boolean;
  lectureForm: LectureFormState;
  onClose: () => void;
  onUpdateForm: (updates: Partial<LectureFormState>) => void;
}

export function SettingsPanel({ isOpen, lectureForm, onClose, onUpdateForm }: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="ppt-settings-panel">
      <div className="ppt-panel-header">
        <h3>Cài đặt bài giảng</h3>
        <button onClick={onClose}>×</button>
      </div>
      <div className="ppt-panel-content">
        <div className="ppt-form-group">
          <label>Mô tả</label>
          <textarea
            value={lectureForm.description}
            onChange={(e) => onUpdateForm({ description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="ppt-form-group">
          <label>Level JLPT</label>
          <select
            value={lectureForm.jlptLevel}
            onChange={(e) => onUpdateForm({ jlptLevel: e.target.value as JLPTLevel })}
          >
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </select>
        </div>
        <div className="ppt-form-group">
          <label>
            <input
              type="checkbox"
              checked={lectureForm.isPublished}
              onChange={(e) => onUpdateForm({ isPublished: e.target.checked })}
            />
            Công khai
          </label>
        </div>
      </div>
    </aside>
  );
}

// Delete Slide Confirmation Modal
interface DeleteSlideModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteSlideModal({ isOpen, onConfirm, onCancel }: DeleteSlideModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Xóa slide"
      message="Bạn có chắc muốn xóa slide này? Hành động này không thể hoàn tác."
      confirmText="Xóa"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
