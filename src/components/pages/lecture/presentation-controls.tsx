// Presentation mode controls

import { formatTime } from './utils';

interface PresentationControlsProps {
  presentationTime: number;
  currentSlideIndex: number;
  totalSlides: number;
  blankScreen: 'black' | 'white' | null;
  showLaser: boolean;
  showNotes: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleBlack: () => void;
  onToggleWhite: () => void;
  onToggleLaser: () => void;
  onToggleNotes: () => void;
  onShowJump: () => void;
  onShowHelp: () => void;
  onExit: () => void;
}

export function PresentationControls({
  presentationTime,
  currentSlideIndex,
  totalSlides,
  blankScreen,
  showLaser,
  showNotes,
  onPrev,
  onNext,
  onToggleBlack,
  onToggleWhite,
  onToggleLaser,
  onToggleNotes,
  onShowJump,
  onShowHelp,
  onExit,
}: PresentationControlsProps) {
  return (
    <div className="presentation-controls">
      <span className="presentation-timer">{formatTime(presentationTime)}</span>
      <button onClick={onPrev} disabled={currentSlideIndex === 0}>
        ←
      </button>
      <span className="presentation-counter">
        {currentSlideIndex + 1} / {totalSlides}
      </span>
      <button onClick={onNext} disabled={currentSlideIndex >= totalSlides - 1}>
        →
      </button>
      <button
        onClick={onToggleBlack}
        className={blankScreen === 'black' ? 'active' : ''}
        title="B: Màn hình đen"
      >
        B
      </button>
      <button
        onClick={onToggleWhite}
        className={blankScreen === 'white' ? 'active' : ''}
        title="W: Màn hình trắng"
      >
        W
      </button>
      <button
        onClick={onToggleLaser}
        className={showLaser ? 'active' : ''}
        title="L: Laser pointer"
      >
        ●
      </button>
      <button
        onClick={onToggleNotes}
        className={showNotes ? 'active' : ''}
        title="S: Ghi chú"
      >
        📝
      </button>
      <button onClick={onShowJump} title="G: Chuyển đến slide">
        #
      </button>
      <button onClick={onShowHelp} title="H: Trợ giúp">
        ?
      </button>
      <button onClick={onExit} className="exit-btn">
        ESC
      </button>
    </div>
  );
}
