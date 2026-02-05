// Presentation mode component

import { SlideRenderer } from '../../lecture/slide-renderer';
import { HelpOverlay } from './help-overlay';
import { JumpDialog } from './jump-dialog';
import { PresentationControls } from './presentation-controls';
import type { Slide } from '../../../types/lecture';

interface PresentationModeProps {
  currentSlide: Slide | undefined;
  nextSlide: Slide | undefined;
  currentSlideIndex: number;
  totalSlides: number;
  slideDirection: 'next' | 'prev' | null;
  blankScreen: 'black' | 'white' | null;
  showHelp: boolean;
  showJumpDialog: boolean;
  showLaser: boolean;
  showNotes: boolean;
  showNextPreview: boolean;
  jumpInput: string;
  laserPosition: { x: number; y: number };
  presentationTime: number;
  onSlideClick: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onToggleBlack: () => void;
  onToggleWhite: () => void;
  onToggleLaser: () => void;
  onToggleNotes: () => void;
  onShowJump: () => void;
  onCloseJump: () => void;
  onJumpToSlide: () => void;
  onJumpInputChange: (value: string) => void;
  onShowHelp: () => void;
  onCloseHelp: () => void;
  onExit: () => void;
}

export function PresentationMode({
  currentSlide,
  nextSlide,
  currentSlideIndex,
  totalSlides,
  slideDirection,
  blankScreen,
  showHelp,
  showJumpDialog,
  showLaser,
  showNotes,
  showNextPreview,
  jumpInput,
  laserPosition,
  presentationTime,
  onSlideClick,
  onMouseMove,
  onPrevSlide,
  onNextSlide,
  onToggleBlack,
  onToggleWhite,
  onToggleLaser,
  onToggleNotes,
  onShowJump,
  onCloseJump,
  onJumpToSlide,
  onJumpInputChange,
  onShowHelp,
  onCloseHelp,
  onExit,
}: PresentationModeProps) {
  return (
    <div
      className={`presentation-mode ${slideDirection ? `slide-${slideDirection}` : ''} ${showLaser ? 'laser-active' : ''}`}
      onClick={onSlideClick}
      onMouseMove={onMouseMove}
    >
      {blankScreen && <div className={`blank-screen blank-${blankScreen}`} />}

      {showHelp && <HelpOverlay onClose={onCloseHelp} />}

      {showJumpDialog && (
        <JumpDialog
          maxSlides={totalSlides}
          jumpInput={jumpInput}
          onInputChange={onJumpInputChange}
          onJump={onJumpToSlide}
          onClose={onCloseJump}
        />
      )}

      {showLaser && (
        <div
          className="laser-pointer"
          style={{ left: laserPosition.x, top: laserPosition.y }}
        />
      )}

      <div className={`presentation-slide ${slideDirection ? `animate-${slideDirection}` : ''} ${showNotes ? 'with-notes' : ''}`}>
        {currentSlide && <SlideRenderer slide={currentSlide} isPresenting={true} slideKey={currentSlideIndex} />}
      </div>

      {showNotes && currentSlide?.notes && (
        <div className="presenter-notes" onClick={(e) => e.stopPropagation()}>
          <h4>Ghi chú</h4>
          <p>{currentSlide.notes}</p>
        </div>
      )}

      {showNextPreview && nextSlide && (
        <div className="next-slide-preview" onClick={(e) => e.stopPropagation()}>
          <div className="preview-label">Tiếp theo</div>
          <div className="preview-content">
            <SlideRenderer slide={nextSlide} isPresenting={false} />
          </div>
        </div>
      )}

      <PresentationControls
        presentationTime={presentationTime}
        currentSlideIndex={currentSlideIndex}
        totalSlides={totalSlides}
        blankScreen={blankScreen}
        showLaser={showLaser}
        showNotes={showNotes}
        onPrev={onPrevSlide}
        onNext={onNextSlide}
        onToggleBlack={onToggleBlack}
        onToggleWhite={onToggleWhite}
        onToggleLaser={onToggleLaser}
        onToggleNotes={onToggleNotes}
        onShowJump={onShowJump}
        onShowHelp={onShowHelp}
        onExit={onExit}
      />

      <div className="click-hint-left" title="Click để quay lại" />
      <div className="click-hint-right" title="Click để tiếp tục" />
    </div>
  );
}
