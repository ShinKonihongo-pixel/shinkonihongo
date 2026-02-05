// Slide navigation component

import type { Slide } from '../../../types/lecture';

interface SlideNavigationProps {
  currentSlideIndex: number;
  totalSlides: number;
  slides: Slide[];
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onGoToSlide: (index: number) => void;
}

export function SlideNavigation({
  currentSlideIndex,
  totalSlides,
  slides,
  onPrevSlide,
  onNextSlide,
  onGoToSlide,
}: SlideNavigationProps) {
  return (
    <>
      <div className="slide-navigation">
        <button className="nav-btn" onClick={onPrevSlide} disabled={currentSlideIndex === 0}>
          ← Trước
        </button>
        <span className="slide-counter">
          {currentSlideIndex + 1} / {totalSlides}
        </span>
        <button
          className="nav-btn"
          onClick={onNextSlide}
          disabled={currentSlideIndex >= totalSlides - 1}
        >
          Tiếp →
        </button>
      </div>

      <div className="slide-thumbnails">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`thumbnail ${index === currentSlideIndex ? 'active' : ''} ${index < currentSlideIndex ? 'viewed' : ''}`}
            onClick={() => onGoToSlide(index)}
          >
            <span>{index + 1}</span>
            {slide.title && <small>{slide.title}</small>}
          </div>
        ))}
      </div>

      <div className="keyboard-hints">
        <span>← → điều hướng</span>
        <span>Double-click fullscreen</span>
        <span>O grid</span>
        <span>G jump</span>
        <span>? help</span>
      </div>
    </>
  );
}
