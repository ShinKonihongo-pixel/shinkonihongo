// Slide canvas component for designing puzzle questions

import { useRef } from 'react';
import { Image, Type, Trash2, Upload, Move } from 'lucide-react';
import type { SlideElement } from './types';
import { generateId } from './utils';
import { useElementDrag } from './use-element-drag';

interface SlideCanvasProps {
  elements: SlideElement[];
  onElementsChange: (elements: SlideElement[]) => void;
}

export function SlideCanvas({ elements, onElementsChange }: SlideCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const {
    selectedElement,
    setSelectedElement,
    handleDragStart: dragStart,
    handleDragMove: dragMove,
    handleDragEnd,
  } = useElementDrag();

  // Add image to slide
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          const newElement: SlideElement = {
            id: generateId(),
            type: 'image',
            content: base64,
            x: 10 + (elements.length * 5),
            y: 10 + (elements.length * 5),
            width: 40,
            height: 50,
          };
          onElementsChange([...elements, newElement]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add text to slide
  const handleAddText = () => {
    const newElement: SlideElement = {
      id: generateId(),
      type: 'text',
      content: 'Nhập text...',
      x: 10 + (elements.length * 5),
      y: 10 + (elements.length * 5),
      width: 60,
      height: 15,
      fontSize: 24,
      fontColor: '#333333',
    };
    onElementsChange([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  // Delete selected element
  const handleDeleteElement = () => {
    if (!selectedElement) return;
    onElementsChange(elements.filter(el => el.id !== selectedElement));
    setSelectedElement(null);
  };

  // Drag handlers with context
  const handleDragStart = (e: React.MouseEvent, elementId: string) => {
    dragStart(e, elementId, slideRef, elements);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    dragMove(e, slideRef, elements, onElementsChange);
  };

  // Update text content
  const updateTextContent = (id: string, content: string) => {
    onElementsChange(elements.map(el => el.id === id ? { ...el, content } : el));
  };

  return (
    <div className="pg-slide-section">
      <div className="pg-slide-toolbar">
        <span className="pg-slide-label">Thiết kế câu hỏi</span>
        <div className="pg-slide-tools">
          <button onClick={() => fileInputRef.current?.click()}>
            <Image size={18} />
            Thêm ảnh
          </button>
          <button onClick={handleAddText}>
            <Type size={18} />
            Thêm text
          </button>
          {selectedElement && (
            <button className="delete-btn" onClick={handleDeleteElement}>
              <Trash2 size={18} />
              Xóa
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAddImage}
          style={{ display: 'none' }}
        />
      </div>

      {/* Slide Canvas */}
      <div
        ref={slideRef}
        className="pg-slide-canvas"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onClick={() => setSelectedElement(null)}
      >
        {elements.length === 0 ? (
          <div className="pg-slide-placeholder">
            <Upload size={40} />
            <p>Thêm hình ảnh hoặc text để thiết kế câu hỏi</p>
          </div>
        ) : (
          elements.map(element => (
            <div
              key={element.id}
              className={`pg-slide-element ${element.type} ${selectedElement === element.id ? 'selected' : ''}`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
              }}
              onClick={e => { e.stopPropagation(); setSelectedElement(element.id); }}
              onMouseDown={e => { e.stopPropagation(); handleDragStart(e, element.id); }}
            >
              {element.type === 'image' ? (
                <img src={element.content} alt="Hint" draggable={false} />
              ) : (
                <textarea
                  value={element.content}
                  onChange={e => updateTextContent(element.id, e.target.value)}
                  style={{
                    fontSize: element.fontSize,
                    color: element.fontColor,
                  }}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                />
              )}
              {selectedElement === element.id && (
                <div className="pg-element-handle">
                  <Move size={14} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
