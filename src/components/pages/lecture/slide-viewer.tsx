// Slide viewer component

import { SlideRenderer } from '../../lecture/slide-renderer';
import type { Slide } from '../../../types/lecture';

interface SlideViewerProps {
  currentSlide: Slide | undefined;
  currentSlideIndex: number;
  slideDirection: 'next' | 'prev' | null;
  showFloatingNotes: boolean;
  currentSlideUserNote: string;
  onSlideClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onToggleFloatingNotes: () => void;
  onSaveNote: (slideId: string, note: string) => void;
}

export function SlideViewer({
  currentSlide,
  currentSlideIndex,
  slideDirection,
  showFloatingNotes,
  currentSlideUserNote,
  onSlideClick,
  onDoubleClick,
  onTouchStart,
  onTouchEnd,
  onToggleFloatingNotes,
  onSaveNote,
}: SlideViewerProps) {
  return (
    <div
      className={`slide-viewer ${slideDirection ? `slide-${slideDirection}` : ''}`}
      onClick={onSlideClick}
      onDoubleClick={onDoubleClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={`slide-content ${slideDirection ? `animate-${slideDirection}` : ''}`}>
        {currentSlide && <SlideRenderer slide={currentSlide} slideKey={currentSlideIndex} />}
      </div>
      <div className="click-area-left" />
      <div className="click-area-right" />

      {showFloatingNotes && currentSlide && (
        <div className="floating-notes-panel" onClick={(e) => e.stopPropagation()}>
          <div className="floating-notes-header">
            <span>✏️ Ghi chú của tôi</span>
            <button
              className="btn-minimize"
              onClick={onToggleFloatingNotes}
              title="Ẩn ghi chú"
            >
              −
            </button>
          </div>
          <textarea
            className="floating-notes-textarea"
            placeholder="Ghi chú cho slide này..."
            value={currentSlideUserNote}
            onChange={(e) => currentSlide && onSaveNote(currentSlide.id, e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
