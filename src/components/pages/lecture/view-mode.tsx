// View mode - single lecture with slides

import { HelpOverlay } from './help-overlay';
import { ResumeDialog } from './resume-dialog';
import { ViewHeader } from './view-header';
import { SlideViewer } from './slide-viewer';
import { TeacherNotesPanel } from './teacher-notes-panel';
import { SlideNavigation } from './slide-navigation';
import type { Slide } from '../../../types/lecture';

interface ViewModeProps {
  lectureTitle: string;
  currentSlides: Slide[];
  currentSlide: Slide | undefined;
  currentSlideIndex: number;
  slidesLoading: boolean;
  slideDirection: 'next' | 'prev' | null;
  autoAdvance: boolean;
  autoAdvanceInterval: number;
  showFloatingNotes: boolean;
  showNotes: boolean;
  showHelp: boolean;
  resumePrompt: { lectureId: string; slideIndex: number } | null;
  currentSlideUserNote: string;
  progressPercent: number;
  isAdmin: boolean;
  onBack: () => void;
  onToggleAutoAdvance: () => void;
  onAutoIntervalChange: (interval: number) => void;
  onToggleGrid: () => void;
  onToggleFloatingNotes: () => void;
  onToggleNotes: () => void;
  onEnterPresent: () => void;
  onSlideClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onGoToSlide: (index: number) => void;
  onSaveNote: (slideId: string, note: string) => void;
  onResume: () => void;
  onStartOver: () => void;
  onCloseHelp: () => void;
}

export function ViewMode({
  lectureTitle,
  currentSlides,
  currentSlide,
  currentSlideIndex,
  slidesLoading,
  slideDirection,
  autoAdvance,
  autoAdvanceInterval,
  showFloatingNotes,
  showNotes,
  showHelp,
  resumePrompt,
  currentSlideUserNote,
  progressPercent,
  isAdmin,
  onBack,
  onToggleAutoAdvance,
  onAutoIntervalChange,
  onToggleGrid,
  onToggleFloatingNotes,
  onToggleNotes,
  onEnterPresent,
  onSlideClick,
  onDoubleClick,
  onTouchStart,
  onTouchEnd,
  onPrevSlide,
  onNextSlide,
  onGoToSlide,
  onSaveNote,
  onResume,
  onStartOver,
  onCloseHelp,
}: ViewModeProps) {
  return (
    <div className="lecture-view">
      <ViewHeader
        lectureTitle={lectureTitle}
        autoAdvance={autoAdvance}
        autoAdvanceInterval={autoAdvanceInterval}
        showFloatingNotes={showFloatingNotes}
        showNotes={showNotes}
        isAdmin={isAdmin}
        onBack={onBack}
        onToggleAutoAdvance={onToggleAutoAdvance}
        onAutoIntervalChange={onAutoIntervalChange}
        onToggleGrid={onToggleGrid}
        onToggleFloatingNotes={onToggleFloatingNotes}
        onToggleNotes={onToggleNotes}
        onEnterPresent={onEnterPresent}
      />

      <div className="lecture-progress-bar">
        <div className="lecture-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {resumePrompt && (
        <ResumeDialog
          slideIndex={resumePrompt.slideIndex}
          onResume={onResume}
          onStartOver={onStartOver}
        />
      )}

      {showHelp && <HelpOverlay onClose={onCloseHelp} />}

      <div className="lecture-view-content">
        {slidesLoading ? (
          <div className="loading-state">Đang tải slides...</div>
        ) : currentSlides.length === 0 ? (
          <div className="empty-state">
            <p>Bài giảng chưa có slide nào</p>
          </div>
        ) : (
          <>
            <SlideViewer
              currentSlide={currentSlide}
              currentSlideIndex={currentSlideIndex}
              slideDirection={slideDirection}
              showFloatingNotes={showFloatingNotes}
              currentSlideUserNote={currentSlideUserNote}
              onSlideClick={onSlideClick}
              onDoubleClick={onDoubleClick}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onToggleFloatingNotes={onToggleFloatingNotes}
              onSaveNote={onSaveNote}
            />

            {isAdmin && showNotes && (
              <TeacherNotesPanel notes={currentSlide?.notes} onClose={onToggleNotes} />
            )}

            <SlideNavigation
              currentSlideIndex={currentSlideIndex}
              totalSlides={currentSlides.length}
              slides={currentSlides}
              onPrevSlide={onPrevSlide}
              onNextSlide={onNextSlide}
              onGoToSlide={onGoToSlide}
            />
          </>
        )}
      </div>
    </div>
  );
}
