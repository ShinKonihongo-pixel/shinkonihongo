// Slide Element Renderer - Renders different element types on canvas

import { StickyNote, Pencil, Trash2 } from 'lucide-react';
import { convertFuriganaToRuby, removeFurigana } from '../../lib/furigana-utils';
import type { SlideElement, AdminNote } from '../../types/lecture';
import type { ResizeHandle, DragState, TextSelection } from './editor-types';

interface ElementRendererProps {
  element: SlideElement;
  isSelected: boolean;
  dragState: DragState;
  showFurigana: boolean;
  showAdminNotes: boolean;
  textSelection: TextSelection | null;
  onSelect: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
  onTextSelect: () => void;
  onUpdateContent: (content: string) => void;
  onShowNoteModal: () => void;
  onOpenNoteForEdit: (note: AdminNote) => void;
  onDeleteAdminNote: (noteId: string) => void;
}

// Render resize handles for selected element
function ResizeHandles({ onResizeStart }: { onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void }) {
  const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
  return (
    <>
      {handles.map(handle => (
        <div
          key={handle}
          className={`ppt-resize-handle ppt-resize-${handle}`}
          onMouseDown={(e) => onResizeStart(e, handle)}
        />
      ))}
    </>
  );
}

export function ElementRenderer({
  element, isSelected, dragState, showFurigana, showAdminNotes, textSelection,
  onSelect, onDragStart, onResizeStart, onTextSelect, onUpdateContent,
  onShowNoteModal, onOpenNoteForEdit, onDeleteAdminNote,
}: ElementRendererProps) {
  const isDraggingThis = dragState.isDragging && isSelected;
  const isResizingThis = dragState.isResizing && isSelected;

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    width: `${element.position.width}%`,
    height: `${element.position.height}%`,
    ...(element.style as React.CSSProperties || {}),
    border: isSelected ? '2px solid #3498db' : '1px dashed transparent',
    cursor: isDraggingThis ? 'grabbing' : isSelected ? 'grab' : 'pointer',
    boxSizing: 'border-box',
    overflow: 'hidden',
    userSelect: isDraggingThis || isResizingThis ? 'none' : 'auto',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dragState.isDragging && !dragState.isResizing) {
      onSelect(e);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(e);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).classList.contains('ppt-resize-handle')) {
      onDragStart(e);
    }
  };

  // Text Element
  if (element.type === 'text') {
    const boxBackground = element.style?.boxBackground || 'transparent';
    const padding = element.style?.padding || '0px';
    const borderRadius = element.style?.borderRadius || '0px';

    const containerStyle: React.CSSProperties = {
      ...baseStyle,
      backgroundColor: boxBackground !== 'transparent' ? boxBackground : undefined,
      padding,
      borderRadius,
    };

    const textStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      outline: 'none',
      overflow: 'auto',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      backgroundColor: 'transparent',
    };

    const hasSelection = textSelection?.elementId === element.id && textSelection.text;
    const elementNotes = element.adminNotes || [];

    return (
      <div
        key={element.id}
        className={`ppt-element ppt-text-box ${isSelected ? 'selected' : ''}`}
        style={containerStyle}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={onTextSelect}
        onContextMenu={handleContextMenu}
      >
        {isSelected && !dragState.isDragging ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdateContent(e.currentTarget.textContent || '')}
            style={textStyle}
          >
            {element.content}
          </div>
        ) : (
          <div
            style={textStyle}
            dangerouslySetInnerHTML={{
              __html: showFurigana
                ? convertFuriganaToRuby(element.content).replace(/\n/g, '<br/>')
                : removeFurigana(element.content).replace(/\n/g, '<br/>')
            }}
          />
        )}

        {hasSelection && isSelected && (
          <button
            className="ppt-add-note-btn"
            onClick={(e) => { e.stopPropagation(); onShowNoteModal(); }}
            title="Thêm ghi chú admin"
          >
            +Note
          </button>
        )}

        {showAdminNotes && elementNotes.length > 0 && (
          <div className="ppt-admin-notes-container">
            {elementNotes.map((note, idx) => (
              <div key={note.id} className="ppt-admin-note" style={{ top: `${idx * 28 + 4}px` }}>
                <span className="ppt-admin-note-marker" title={note.selectedText}><StickyNote size={14} /></span>
                <div className="ppt-admin-note-popup">
                  <div className="ppt-admin-note-header">
                    <span className="ppt-admin-note-text">"{note.selectedText}"</span>
                    <div className="ppt-admin-note-actions">
                      <button onClick={() => onOpenNoteForEdit(note)} title="Sửa"><Pencil size={12} /></button>
                      <button onClick={() => onDeleteAdminNote(note.id)} title="Xóa"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="ppt-admin-note-content">{note.noteContent}</div>
                  <div className="ppt-admin-note-meta">
                    {note.createdBy} • {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isSelected && <ResizeHandles onResizeStart={onResizeStart} />}
      </div>
    );
  }

  // Image Element
  if (element.type === 'image') {
    return (
      <div
        key={element.id}
        className={`ppt-element ${isSelected ? 'selected' : ''}`}
        style={baseStyle}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {element.content ? (
          <img
            src={element.content}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            draggable={false}
          />
        ) : (
          <div className="ppt-placeholder">📷 Click để thêm ảnh</div>
        )}
        {isSelected && <ResizeHandles onResizeStart={onResizeStart} />}
      </div>
    );
  }

  // Shape Element
  if (element.type === 'shape') {
    const shapeType = element.content || 'rectangle';
    let shapeContent: React.ReactNode = null;

    if (shapeType === 'arrow') {
      shapeContent = (
        <div
          style={{
            position: 'absolute',
            right: '-8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderLeft: '12px solid ' + (element.style?.backgroundColor || '#000'),
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
          }}
        />
      );
    }

    return (
      <div
        key={element.id}
        className={`ppt-element ppt-shape ppt-shape-${shapeType} ${isSelected ? 'selected' : ''}`}
        style={baseStyle}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {shapeContent}
        {isSelected && <ResizeHandles onResizeStart={onResizeStart} />}
      </div>
    );
  }

  // Video Element
  if (element.type === 'video') {
    return (
      <div
        key={element.id}
        className={`ppt-element ${isSelected ? 'selected' : ''}`}
        style={baseStyle}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {element.content ? (
          <video
            src={element.content}
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            controls
          />
        ) : (
          <div className="ppt-placeholder">🎬 Video URL</div>
        )}
        {isSelected && <ResizeHandles onResizeStart={onResizeStart} />}
      </div>
    );
  }

  // Audio Element
  if (element.type === 'audio') {
    return (
      <div
        key={element.id}
        className={`ppt-element ${isSelected ? 'selected' : ''}`}
        style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--light)' }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {element.content ? (
          <audio src={element.content} controls style={{ width: '90%' }} />
        ) : (
          <div className="ppt-placeholder">🔊 Audio URL</div>
        )}
        {isSelected && <ResizeHandles onResizeStart={onResizeStart} />}
      </div>
    );
  }

  // Fallback
  return (
    <div
      key={element.id}
      className={`ppt-element ${isSelected ? 'selected' : ''}`}
      style={baseStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      [{element.type}]
      {isSelected && <ResizeHandles onResizeStart={onResizeStart} />}
    </div>
  );
}
