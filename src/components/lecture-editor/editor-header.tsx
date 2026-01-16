// Lecture Editor Header - Title, save, import/export controls

import {
  ArrowLeft, Settings, Download, Upload, Save, StickyNote,
} from 'lucide-react';
import { UndoRedoToolbar } from '../lecture/lecture-advanced-panels';
import type { EditorHeaderProps } from './editor-types';

export function EditorHeader({
  lectureForm, onTitleChange, hasUnsavedChanges, saving, onSave, onBack,
  onSettings, onImport, onExport, showAdminNotes, onToggleAdminNotes,
  canUndo, canRedo, historyLength, onUndo, onRedo, onShowShortcuts,
  isNew, slidesCount, exportLoading,
}: EditorHeaderProps) {
  return (
    <header className="ppt-header">
      <div className="ppt-header-left">
        <button className="ppt-btn ppt-btn-icon" onClick={onBack} title="Quay lại">
          <ArrowLeft size={18} />
        </button>
        <input
          type="text"
          className="ppt-title-input"
          value={lectureForm.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Tiêu đề bài giảng..."
        />
        {hasUnsavedChanges && <span className="ppt-unsaved-badge">●</span>}
      </div>
      <div className="ppt-header-right">
        <UndoRedoToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          historyLength={historyLength}
        />
        <button
          className="ppt-btn ppt-btn-ghost"
          onClick={onShowShortcuts}
          title="Phím tắt"
        >
          <span style={{ fontSize: '14px' }}>⌨️</span>
        </button>
        <button className="ppt-btn ppt-btn-ghost" onClick={onSettings} title="Cài đặt">
          <Settings size={16} />
          <span>Cài đặt</span>
        </button>
        <button
          className="ppt-btn ppt-btn-ghost"
          onClick={onImport}
          disabled={isNew}
          title="Import PPTX"
        >
          <Download size={16} />
          <span>Import</span>
        </button>
        <button
          className="ppt-btn ppt-btn-ghost"
          onClick={onExport}
          disabled={slidesCount === 0 || exportLoading}
          title="Export PPTX"
        >
          <Upload size={16} />
          <span>{exportLoading ? '...' : 'Export'}</span>
        </button>
        <button
          className={`ppt-btn ppt-btn-ghost ${showAdminNotes ? 'active' : ''}`}
          onClick={onToggleAdminNotes}
          title="Hiện/ẩn ghi chú admin"
        >
          <StickyNote size={16} />
          <span>Notes</span>
        </button>
        <button className="ppt-btn ppt-btn-primary" onClick={onSave} disabled={saving}>
          <Save size={16} />
          <span>{saving ? 'Đang lưu...' : 'Lưu'}</span>
        </button>
      </div>
    </header>
  );
}
