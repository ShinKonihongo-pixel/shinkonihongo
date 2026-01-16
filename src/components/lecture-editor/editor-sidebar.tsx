// Lecture Editor Sidebar - Slide thumbnails

import { CopyPlus, Trash2 } from 'lucide-react';
import type { EditorSidebarProps } from './editor-types';

export function EditorSidebar({
  slides, selectedSlideIndex, onSelectSlide, onDuplicateSlide,
  onDeleteSlideClick, onAddSlide, isLoading, isNew,
}: EditorSidebarProps) {
  const renderThumbnail = (slide: typeof slides[0], index: number) => (
    <div
      key={slide.id}
      className={`ppt-thumbnail ${selectedSlideIndex === index ? 'active' : ''}`}
      onClick={() => onSelectSlide(index)}
    >
      <span className="ppt-thumbnail-num">{index + 1}</span>
      <div
        className="ppt-thumbnail-preview"
        style={{
          backgroundColor: slide.backgroundColor || '#fff',
          backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
          backgroundSize: 'cover',
        }}
      >
        {slide.title && <div className="ppt-thumb-title">{slide.title}</div>}
        {slide.elements.slice(0, 2).map(el => (
          <div key={el.id} className="ppt-thumb-element">
            {el.type === 'text'
              ? el.content.substring(0, 15) + (el.content.length > 15 ? '...' : '')
              : `[${el.type}]`}
          </div>
        ))}
      </div>
      <div className="ppt-thumbnail-actions">
        <button onClick={(e) => { e.stopPropagation(); onDuplicateSlide(slide.id); }} title="Nhân đôi">
          <CopyPlus size={12} />
        </button>
        <button onClick={(e) => onDeleteSlideClick(index, e)} title="Xóa">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <aside className="ppt-sidebar">
      <div className="ppt-sidebar-header">
        <span>Slides ({slides.length})</span>
      </div>
      <div className="ppt-thumbnails">
        {isLoading ? (
          <div className="ppt-loading">Đang tải...</div>
        ) : slides.length === 0 ? (
          <div className="ppt-empty">
            {isNew ? 'Lưu bài giảng trước' : 'Chưa có slide'}
          </div>
        ) : (
          slides.map((slide, idx) => renderThumbnail(slide, idx))
        )}
      </div>
      <button className="ppt-add-slide-btn" onClick={onAddSlide} disabled={isNew}>
        + Thêm Slide
      </button>
    </aside>
  );
}
