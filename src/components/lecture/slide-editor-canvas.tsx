// Professional Slide Editor Canvas - PowerPoint-like experience
// Features: Drag elements, resize, format toolbar, keyboard shortcuts, templates

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SlideFormData, SlideElement, SlideLayout } from '../../types/lecture';

// Slide templates with pre-built content
const SLIDE_TEMPLATES: {
  id: string;
  name: string;
  icon: string;
  layout: SlideLayout;
  elements: Omit<SlideElement, 'id'>[];
  backgroundColor?: string;
}[] = [
  {
    id: 'blank',
    name: 'Trống',
    icon: '▢',
    layout: 'content',
    elements: [],
    backgroundColor: '#ffffff',
  },
  {
    id: 'title',
    name: 'Tiêu đề',
    icon: '▣',
    layout: 'title',
    elements: [
      {
        type: 'text',
        content: 'Tiêu đề slide',
        position: { x: 10, y: 35, width: 80, height: 15 },
        style: { fontSize: '48px', fontWeight: 'bold', color: '#333333', textAlign: 'center' },
      },
      {
        type: 'text',
        content: 'Phụ đề hoặc mô tả ngắn',
        position: { x: 20, y: 55, width: 60, height: 10 },
        style: { fontSize: '24px', fontWeight: 'normal', color: '#666666', textAlign: 'center' },
      },
    ],
    backgroundColor: '#ffffff',
  },
  {
    id: 'content',
    name: 'Nội dung',
    icon: '☰',
    layout: 'content',
    elements: [
      {
        type: 'text',
        content: 'Tiêu đề',
        position: { x: 5, y: 5, width: 90, height: 12 },
        style: { fontSize: '32px', fontWeight: 'bold', color: '#333333', textAlign: 'left' },
      },
      {
        type: 'text',
        content: '• Điểm chính 1\n• Điểm chính 2\n• Điểm chính 3',
        position: { x: 5, y: 22, width: 90, height: 60 },
        style: { fontSize: '20px', fontWeight: 'normal', color: '#444444', textAlign: 'left' },
      },
    ],
    backgroundColor: '#ffffff',
  },
  {
    id: 'two-column',
    name: 'Hai cột',
    icon: '▥',
    layout: 'two-column',
    elements: [
      {
        type: 'text',
        content: 'Tiêu đề',
        position: { x: 5, y: 5, width: 90, height: 12 },
        style: { fontSize: '32px', fontWeight: 'bold', color: '#333333', textAlign: 'left' },
      },
      {
        type: 'text',
        content: 'Nội dung cột trái',
        position: { x: 5, y: 22, width: 42, height: 60 },
        style: { fontSize: '18px', fontWeight: 'normal', color: '#444444', textAlign: 'left' },
      },
      {
        type: 'text',
        content: 'Nội dung cột phải',
        position: { x: 53, y: 22, width: 42, height: 60 },
        style: { fontSize: '18px', fontWeight: 'normal', color: '#444444', textAlign: 'left' },
      },
    ],
    backgroundColor: '#ffffff',
  },
  {
    id: 'image-text',
    name: 'Ảnh + Text',
    icon: '⬒',
    layout: 'image-left',
    elements: [
      {
        type: 'text',
        content: 'Tiêu đề',
        position: { x: 52, y: 10, width: 43, height: 12 },
        style: { fontSize: '28px', fontWeight: 'bold', color: '#333333', textAlign: 'left' },
      },
      {
        type: 'text',
        content: 'Mô tả nội dung ở đây. Có thể thêm nhiều dòng text để giải thích hình ảnh.',
        position: { x: 52, y: 28, width: 43, height: 55 },
        style: { fontSize: '16px', fontWeight: 'normal', color: '#444444', textAlign: 'left' },
      },
      {
        type: 'image',
        content: '',
        position: { x: 5, y: 10, width: 42, height: 75 },
      },
    ],
    backgroundColor: '#ffffff',
  },
  {
    id: 'quote',
    name: 'Trích dẫn',
    icon: '"',
    layout: 'content',
    elements: [
      {
        type: 'text',
        content: '"Câu trích dẫn nổi tiếng hoặc ý tưởng quan trọng"',
        position: { x: 10, y: 30, width: 80, height: 25 },
        style: { fontSize: '28px', fontWeight: 'normal', color: '#333333', textAlign: 'center', fontStyle: 'italic' },
      },
      {
        type: 'text',
        content: '— Tác giả',
        position: { x: 50, y: 60, width: 40, height: 10 },
        style: { fontSize: '18px', fontWeight: 'normal', color: '#666666', textAlign: 'right' },
      },
    ],
    backgroundColor: '#f8f9fa',
  },
];

// Font sizes for toolbar
const FONT_SIZES = ['14', '16', '18', '20', '24', '28', '32', '36', '48', '64'];

interface SlideEditorCanvasProps {
  slide: SlideFormData;
  onChange: (slide: SlideFormData) => void;
  onSave: () => void;
}

function generateId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function SlideEditorCanvas({ slide, onChange, onSave }: SlideEditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elX: number; elY: number } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPos, setAddMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const selectedElement = slide.elements.find(el => el.id === selectedId);

  // Update element
  const updateElement = useCallback((id: string, updates: Partial<SlideElement>) => {
    onChange({
      ...slide,
      elements: slide.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    });
  }, [slide, onChange]);

  // Update element style
  const updateElementStyle = useCallback((id: string, styleUpdates: Record<string, string>) => {
    const element = slide.elements.find(el => el.id === id);
    if (!element) return;
    onChange({
      ...slide,
      elements: slide.elements.map(el =>
        el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
      ),
    });
  }, [slide, onChange]);

  // Delete element
  const deleteElement = useCallback((id: string) => {
    onChange({
      ...slide,
      elements: slide.elements.filter(el => el.id !== id),
    });
    setSelectedId(null);
  }, [slide, onChange]);

  // Duplicate element
  const duplicateElement = useCallback((id: string) => {
    const element = slide.elements.find(el => el.id === id);
    if (!element) return;
    const newElement: SlideElement = {
      ...element,
      id: generateId(),
      position: {
        ...element.position,
        x: element.position.x + 3,
        y: element.position.y + 3,
      },
    };
    onChange({
      ...slide,
      elements: [...slide.elements, newElement],
    });
    setSelectedId(newElement.id);
  }, [slide, onChange]);

  // Add element at position
  const addElement = useCallback((type: SlideElement['type'], x: number, y: number, content = '') => {
    const newElement: SlideElement = {
      id: generateId(),
      type,
      content: content || (type === 'text' ? 'Nhập text...' : ''),
      position: {
        x: Math.max(0, Math.min(x, 80)),
        y: Math.max(0, Math.min(y, 80)),
        width: type === 'text' ? 50 : 30,
        height: type === 'text' ? 10 : 25,
      },
      style: type === 'text' ? {
        fontSize: '18px',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
      } : undefined,
    };
    onChange({
      ...slide,
      elements: [...slide.elements, newElement],
    });
    setSelectedId(newElement.id);
    if (type === 'text') {
      setEditingTextId(newElement.id);
    }
  }, [slide, onChange]);

  // Apply template
  const applyTemplate = useCallback((template: typeof SLIDE_TEMPLATES[0]) => {
    const newElements: SlideElement[] = template.elements.map(el => ({
      ...el,
      id: generateId(),
    }));
    onChange({
      ...slide,
      layout: template.layout,
      elements: newElements,
      backgroundColor: template.backgroundColor || slide.backgroundColor,
    });
    setShowTemplates(false);
  }, [slide, onChange]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setAddMenuPos({ x, y });
      setShowAddMenu(true);
      setSelectedId(null);
    }
  };

  // Handle element mouse down (start drag)
  const handleElementMouseDown = (e: React.MouseEvent, element: SlideElement) => {
    e.stopPropagation();
    if (editingTextId === element.id) return;

    setSelectedId(element.id);
    setIsDragging(true);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elX: element.position.x,
      elY: element.position.y,
    });
  };

  // Handle mouse move (dragging)
  useEffect(() => {
    if (!isDragging || !dragStart || !selectedId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

      const newX = Math.max(0, Math.min(dragStart.elX + deltaX, 90));
      const newY = Math.max(0, Math.min(dragStart.elY + deltaY, 90));

      updateElement(selectedId, {
        position: {
          ...slide.elements.find(el => el.id === selectedId)!.position,
          x: newX,
          y: newY,
        },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, selectedId, updateElement, slide.elements]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return; // Don't handle shortcuts when editing text

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        if (selectedId) {
          e.preventDefault();
          duplicateElement(selectedId);
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setShowAddMenu(false);
        setShowTemplates(false);
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSave();
      } else if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const element = slide.elements.find(el => el.id === selectedId);
        if (!element) return;
        const step = e.shiftKey ? 5 : 1;
        const pos = { ...element.position };
        if (e.key === 'ArrowUp') pos.y = Math.max(0, pos.y - step);
        if (e.key === 'ArrowDown') pos.y = Math.min(90, pos.y + step);
        if (e.key === 'ArrowLeft') pos.x = Math.max(0, pos.x - step);
        if (e.key === 'ArrowRight') pos.x = Math.min(90, pos.x + step);
        updateElement(selectedId, { position: pos });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingTextId, deleteElement, duplicateElement, onSave, slide.elements, updateElement]);

  return (
    <div className="pro-slide-editor">
      {/* Top Toolbar */}
      <div className="pro-toolbar">
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => setShowTemplates(!showTemplates)} title="Chọn mẫu slide">
            <span>📋</span> Mẫu
          </button>
          <div className="toolbar-divider" />
          <button className="toolbar-btn" onClick={() => addElement('text', 10, 30)} title="Thêm text (T)">
            <span>T</span> Text
          </button>
          <button className="toolbar-btn" onClick={() => {
            const url = prompt('Nhập URL hình ảnh:');
            if (url) addElement('image', 10, 30, url);
          }} title="Thêm hình ảnh">
            <span>🖼</span> Ảnh
          </button>
        </div>

        {/* Selected element formatting */}
        {selectedElement && selectedElement.type === 'text' && (
          <div className="toolbar-section format-section">
            <div className="toolbar-divider" />
            <select
              className="toolbar-select"
              value={selectedElement.style?.fontSize?.replace('px', '') || '18'}
              onChange={(e) => updateElementStyle(selectedId!, { fontSize: `${e.target.value}px` })}
            >
              {FONT_SIZES.map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
            <button
              className={`toolbar-btn ${selectedElement.style?.fontWeight === 'bold' ? 'active' : ''}`}
              onClick={() => updateElementStyle(selectedId!, {
                fontWeight: selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold'
              })}
              title="In đậm (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <div className="color-picker-mini">
              <input
                type="color"
                value={selectedElement.style?.color || '#000000'}
                onChange={(e) => updateElementStyle(selectedId!, { color: e.target.value })}
                title="Màu chữ"
              />
            </div>
            <div className="toolbar-divider" />
            <button className="toolbar-btn" onClick={() => duplicateElement(selectedId!)} title="Nhân đôi (Ctrl+D)">
              📋
            </button>
            <button className="toolbar-btn btn-danger" onClick={() => deleteElement(selectedId!)} title="Xóa (Delete)">
              🗑
            </button>
          </div>
        )}

        <div className="toolbar-section">
          <div className="toolbar-divider" />
          <button
            className={`toolbar-btn ${showNotes ? 'active' : ''}`}
            onClick={() => setShowNotes(!showNotes)}
            title="Ghi chú giáo viên"
          >
            📝 Notes
          </button>
          <button className="toolbar-btn btn-primary" onClick={onSave} title="Lưu (Ctrl+S)">
            💾 Lưu
          </button>
        </div>
      </div>

      {/* Template Picker */}
      {showTemplates && (
        <div className="template-picker">
          <div className="template-picker-header">
            <span>Chọn mẫu slide</span>
            <button onClick={() => setShowTemplates(false)}>×</button>
          </div>
          <div className="template-grid">
            {SLIDE_TEMPLATES.map(template => (
              <div
                key={template.id}
                className="template-item"
                onClick={() => applyTemplate(template)}
              >
                <div className="template-preview">
                  <span className="template-icon">{template.icon}</span>
                </div>
                <span className="template-name">{template.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="pro-canvas"
        style={{
          backgroundColor: slide.backgroundColor || '#ffffff',
          backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={handleCanvasClick}
      >
        {/* Grid overlay */}
        <div className="canvas-grid" />

        {/* Elements */}
        {slide.elements.map((element) => (
          <div
            key={element.id}
            className={`canvas-element ${selectedId === element.id ? 'selected' : ''} ${isDragging && selectedId === element.id ? 'dragging' : ''}`}
            style={{
              left: `${element.position.x}%`,
              top: `${element.position.y}%`,
              width: `${element.position.width}%`,
              minHeight: `${element.position.height}%`,
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element)}
            onDoubleClick={() => element.type === 'text' && setEditingTextId(element.id)}
          >
            {element.type === 'text' && (
              editingTextId === element.id ? (
                <textarea
                  autoFocus
                  className="element-text-editor"
                  value={element.content}
                  onChange={(e) => updateElement(element.id, { content: e.target.value })}
                  onBlur={() => setEditingTextId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingTextId(null);
                  }}
                  style={{
                    fontSize: element.style?.fontSize,
                    fontWeight: element.style?.fontWeight,
                    color: element.style?.color,
                    textAlign: element.style?.textAlign as React.CSSProperties['textAlign'],
                  }}
                />
              ) : (
                <div
                  className="element-text"
                  style={{
                    fontSize: element.style?.fontSize,
                    fontWeight: element.style?.fontWeight,
                    color: element.style?.color,
                    textAlign: element.style?.textAlign as React.CSSProperties['textAlign'],
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {element.content}
                </div>
              )
            )}
            {element.type === 'image' && (
              element.content ? (
                <img src={element.content} alt="" className="element-image" />
              ) : (
                <div className="element-placeholder">
                  <span>🖼</span>
                  <small>Double-click để thêm URL</small>
                </div>
              )
            )}
            {selectedId === element.id && !isDragging && (
              <div className="resize-handles">
                <div className="resize-handle nw" />
                <div className="resize-handle ne" />
                <div className="resize-handle sw" />
                <div className="resize-handle se" />
              </div>
            )}
          </div>
        ))}

        {/* Add menu */}
        {showAddMenu && addMenuPos && (
          <div
            className="add-menu"
            style={{ left: `${addMenuPos.x}%`, top: `${addMenuPos.y}%` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { addElement('text', addMenuPos.x, addMenuPos.y); setShowAddMenu(false); }}>
              <span>T</span> Thêm Text
            </button>
            <button onClick={() => {
              const url = prompt('Nhập URL hình ảnh:');
              if (url) addElement('image', addMenuPos.x, addMenuPos.y, url);
              setShowAddMenu(false);
            }}>
              <span>🖼</span> Thêm Ảnh
            </button>
            <button onClick={() => setShowAddMenu(false)} className="cancel">
              Hủy
            </button>
          </div>
        )}
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div className="pro-notes-panel">
          <div className="notes-header">
            <span>📝 Ghi chú giáo viên (chỉ bạn thấy khi trình chiếu)</span>
          </div>
          <textarea
            value={slide.notes || ''}
            onChange={(e) => onChange({ ...slide, notes: e.target.value })}
            placeholder="Nhập ghi chú cho slide này..."
          />
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="shortcuts-hint">
        <span>Double-click: Edit</span>
        <span>Drag: Move</span>
        <span>Del: Delete</span>
        <span>Ctrl+D: Duplicate</span>
        <span>Arrows: Nudge</span>
        <span>Ctrl+S: Save</span>
      </div>
    </div>
  );
}
