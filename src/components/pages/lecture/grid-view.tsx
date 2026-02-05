// Grid view - All slides overview

import { SlideRenderer } from '../../lecture/slide-renderer';
import type { Slide } from '../../../types/lecture';

interface GridViewProps {
  lectureTitle: string;
  currentSlides: Slide[];
  currentSlideIndex: number;
  onBack: () => void;
  onSwitchToView: () => void;
  onEnterPresent: () => void;
  onSelectSlide: (index: number) => void;
}

export function GridView({
  lectureTitle,
  currentSlides,
  currentSlideIndex,
  onBack,
  onSwitchToView,
  onEnterPresent,
  onSelectSlide,
}: GridViewProps) {
  return (
    <div className="lecture-view">
      <div className="lecture-view-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Quay lại
        </button>
        <h2>{lectureTitle}</h2>
        <div className="lecture-view-actions">
          <button className="btn btn-secondary" onClick={onSwitchToView}>
            Slide đơn
          </button>
          <button className="btn btn-present" onClick={onEnterPresent}>
            🖥️ Present (F)
          </button>
        </div>
      </div>

      <div className="slides-grid-view">
        {currentSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`grid-slide-item ${index === currentSlideIndex ? 'active' : ''}`}
            onClick={() => onSelectSlide(index)}
          >
            <div className="grid-slide-preview">
              <SlideRenderer slide={slide} isPresenting={false} />
            </div>
            <div className="grid-slide-number">{index + 1}</div>
            {slide.title && <div className="grid-slide-title">{slide.title}</div>}
          </div>
        ))}
      </div>

      <div className="keyboard-hints">
        <span>O xem slide đơn</span>
        <span>F toàn màn hình</span>
        <span>ESC quay lại</span>
      </div>
    </div>
  );
}
