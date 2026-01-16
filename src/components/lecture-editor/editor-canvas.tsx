// Lecture Editor Canvas - Main slide editing area

import {
  Copy, CopyPlus, MoveUp, MoveDown, Trash2, Type, Image, Square, Circle, Plus,
  FileText, LayoutGrid, Layers,
} from 'lucide-react';
import { ZoomControls, GridToggle } from '../lecture/lecture-toolbar-panels';
import { ElementRenderer } from './element-renderer';
import type { SlideFormData, SlideElement, AdminNote } from '../../types/lecture';
import type { DragState, ResizeHandle, TextSelection } from './editor-types';

interface EditorCanvasProps {
  editingSlide: SlideFormData | null;
  selectedElementId: string | null;
  selectedElement: SlideElement | null;
  dragState: DragState;
  showGrid: boolean;
  zoom: number;
  showFurigana: boolean;
  showAdminNotes: boolean;
  textSelection: TextSelection | null;
  isEditingTitle: boolean;
  isNew: boolean;
  slidesCount: number;
  selectedSlideIndex: number;
  hasUnsavedChanges: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  // Zoom handlers
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
  onToggleGrid: () => void;
  // Element handlers
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onUpdateEditingSlide: (updates: Partial<SlideFormData>) => void;
  onDragStart: (e: React.MouseEvent, elementId: string) => void;
  onResizeStart: (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onTextSelect: (elementId: string) => void;
  onSetEditingTitle: (editing: boolean) => void;
  onShowNoteModal: () => void;
  onOpenNoteForEdit: (note: AdminNote) => void;
  onDeleteAdminNote: (elementId: string, noteId: string) => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDelete: () => void;
  onSaveSlide: () => void;
  // Quick actions
  onAddElement: (type: SlideElement['type']) => void;
  onAddShapeElement: (type: 'circle') => void;
  onAddSlide: () => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
}

export function EditorCanvas({
  editingSlide, selectedElementId, selectedElement, dragState, showGrid, zoom,
  showFurigana, showAdminNotes, textSelection, isEditingTitle, isNew, slidesCount,
  selectedSlideIndex, hasUnsavedChanges, canvasRef,
  onZoomIn, onZoomOut, onZoomReset, onZoomFit, onToggleGrid,
  onSelectElement, onUpdateElement, onUpdateEditingSlide, onDragStart, onResizeStart,
  onMouseMove, onMouseUp, onTextSelect, onSetEditingTitle, onShowNoteModal,
  onOpenNoteForEdit, onDeleteAdminNote, onCopy, onDuplicate, onBringToFront,
  onSendToBack, onDelete, onSaveSlide, onAddElement, onAddShapeElement, onAddSlide,
  imageInputRef,
}: EditorCanvasProps) {
  return (
    <main className="ppt-canvas-container">
      {/* Zoom & Grid Controls */}
      <div className="le-status-bar">
        <div className="le-status-left">
          <span>Slide {selectedSlideIndex + 1} / {slidesCount}</span>
          {selectedElement && <span>| {selectedElement.type}</span>}
        </div>
        <div className="le-status-right">
          <GridToggle showGrid={showGrid} onToggle={onToggleGrid} />
          <ZoomControls
            zoom={zoom}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onZoomReset={onZoomReset}
            onZoomFit={onZoomFit}
          />
        </div>
      </div>

      {editingSlide ? (
        <div
          ref={canvasRef}
          className={`ppt-canvas ${showGrid ? 'show-grid' : ''}`}
          style={{
            backgroundColor: editingSlide.backgroundColor || '#fff',
            backgroundImage: editingSlide.backgroundImage ? `url(${editingSlide.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
          }}
          onClick={() => {
            onSelectElement(null);
            onSetEditingTitle(false);
          }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Slide Title - Inline Editable */}
          <div
            className={`ppt-slide-title ${isEditingTitle ? 'editing' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSetEditingTitle(true);
              onSelectElement(null);
            }}
          >
            {isEditingTitle ? (
              <input
                type="text"
                value={editingSlide.title || ''}
                onChange={(e) => onUpdateEditingSlide({ title: e.target.value })}
                onBlur={() => onSetEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    onSetEditingTitle(false);
                  }
                }}
                autoFocus
                className="ppt-title-inline-input"
                placeholder="Nhập tiêu đề slide..."
              />
            ) : (
              <span>{editingSlide.title || 'Click để thêm tiêu đề'}</span>
            )}
          </div>

          {/* Elements */}
          {editingSlide.elements.map(element => (
            <ElementRenderer
              key={element.id}
              element={element}
              isSelected={selectedElementId === element.id}
              dragState={dragState}
              showFurigana={showFurigana}
              showAdminNotes={showAdminNotes}
              textSelection={textSelection}
              onSelect={() => onSelectElement(element.id)}
              onDragStart={(e) => onDragStart(e, element.id)}
              onResizeStart={(e, handle) => onResizeStart(e, element.id, handle)}
              onTextSelect={() => onTextSelect(element.id)}
              onUpdateContent={(content) => onUpdateElement(element.id, { content })}
              onShowNoteModal={onShowNoteModal}
              onOpenNoteForEdit={onOpenNoteForEdit}
              onDeleteAdminNote={(noteId) => onDeleteAdminNote(element.id, noteId)}
            />
          ))}

          {/* Empty state */}
          {editingSlide.elements.length === 0 && !isEditingTitle && (
            <div className="ppt-canvas-empty">
              <p>Click "Insert" để thêm nội dung</p>
            </div>
          )}

          {/* Floating Context Toolbar */}
          {selectedElement && (
            <div
              className="ppt-floating-toolbar"
              style={{
                left: `calc(${selectedElement.position.x}% + ${selectedElement.position.width / 2}%)`,
                top: `calc(${selectedElement.position.y}% - 48px)`,
              }}
            >
              <div className="ppt-floating-toolbar-group">
                <button onClick={onCopy} title="Sao chép (Ctrl+C)">
                  <Copy size={14} />
                </button>
                <button onClick={onDuplicate} title="Nhân đôi (Ctrl+D)">
                  <CopyPlus size={14} />
                </button>
              </div>
              <div className="ppt-floating-toolbar-divider" />
              <div className="ppt-floating-toolbar-group">
                <button onClick={onBringToFront} title="Đưa lên trên">
                  <MoveUp size={14} />
                </button>
                <button onClick={onSendToBack} title="Đưa xuống dưới">
                  <MoveDown size={14} />
                </button>
              </div>
              <div className="ppt-floating-toolbar-divider" />
              <div className="ppt-floating-toolbar-group">
                <button onClick={onDelete} title="Xóa (Delete)" className="danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="ppt-no-slide">
          <div className="ppt-no-slide-content">
            {isNew ? (
              <>
                <span className="ppt-no-slide-icon"><FileText size={48} /></span>
                <p>Nhập tiêu đề và nhấn "Lưu" để bắt đầu</p>
              </>
            ) : slidesCount === 0 ? (
              <>
                <span className="ppt-no-slide-icon"><LayoutGrid size={48} /></span>
                <p>Nhấn "+ Thêm Slide" hoặc "Import" để bắt đầu</p>
              </>
            ) : (
              <>
                <span className="ppt-no-slide-icon"><Layers size={48} /></span>
                <p>Chọn slide từ danh sách bên trái</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Save indicator */}
      {hasUnsavedChanges && (
        <button className="ppt-save-float" onClick={onSaveSlide}>
          <span style={{ marginRight: '8px' }}>💾</span>
          <span>Lưu slide (Ctrl+S)</span>
        </button>
      )}

      {/* Quick Actions Bar */}
      {editingSlide && (
        <div className="ppt-quick-actions-bar">
          <button onClick={() => onAddElement('text')} title="Thêm Text (T)">
            <Type size={16} />
          </button>
          <button onClick={() => imageInputRef.current?.click()} title="Thêm Ảnh">
            <Image size={16} />
          </button>
          <button onClick={() => onAddElement('shape')} title="Thêm Shape">
            <Square size={16} />
          </button>
          <button onClick={() => onAddShapeElement('circle')} title="Thêm Circle">
            <Circle size={16} />
          </button>
          <div className="ppt-quick-actions-divider" />
          <button onClick={onAddSlide} disabled={isNew} title="Thêm Slide mới">
            <Plus size={16} />
          </button>
        </div>
      )}
    </main>
  );
}
