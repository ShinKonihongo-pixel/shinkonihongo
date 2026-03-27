// Main study session component - orchestrates all sub-components
import { useState } from 'react';
import type { StudySessionProps } from './types';
import { useIsMobile } from './use-is-mobile';
import { EmptyState } from './empty-state';
import { StudyHeader } from './study-header';
import { CardArea } from './card-area';
import { ActionButtons } from './action-buttons';
import { StudySettingsModal } from './settings-modal';
import '../../cards-management/cards-management.css';

export function StudySession({
  currentCard,
  currentIndex,
  totalCards,
  isFlipped,
  onFlip,
  onSetMemorization,
  onResetAll,
  filterMemorization,
  onFilterMemorizationChange,
  onShuffle,
  onResetOrder,
  isShuffled,
  clickCount,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  settings,
  onBack,
  selectedLevel,
  frontFontSize = 250,
  onFrontFontSizeChange,
  onSettingsChange,
  notebookHook,
}: StudySessionProps) {
  const isMobile = useIsMobile();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  if (!currentCard) {
    return (
      <>
        <EmptyState
          filterMemorization={filterMemorization}
          onFilterMemorizationChange={onFilterMemorizationChange}
          onBack={onBack}
          onSettingsClick={() => setShowSettingsModal(true)}
        />
        <StudySettingsModal
          isOpen={showSettingsModal}
          filterMemorization={filterMemorization}
          onFilterMemorizationChange={onFilterMemorizationChange}
          frontFontSize={frontFontSize}
          onFrontFontSizeChange={onFrontFontSizeChange}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setShowSettingsModal(false)}
          isMobile={isMobile}
        />
      </>
    );
  }

  return (
    <div className="study-session">
      <StudyHeader
        selectedLevel={selectedLevel}
        filterMemorization={filterMemorization}
        onFilterMemorizationChange={onFilterMemorizationChange}
        currentIndex={currentIndex}
        totalCards={totalCards}
        isShuffled={isShuffled}
        onShuffle={onShuffle}
        onResetOrder={onResetOrder}
        onSettingsClick={() => setShowSettingsModal(true)}
        onBack={onBack}
        isMobile={isMobile}
        currentCard={currentCard}
        onResetAll={onResetAll}
        notebookHook={notebookHook}
      />

      <CardArea
        currentCard={currentCard}
        currentIndex={currentIndex}
        totalCards={totalCards}
        isFlipped={isFlipped}
        onFlip={onFlip}
        onNext={onNext}
        onPrev={onPrev}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        settings={settings}
        isMobile={isMobile}
      />

      <ActionButtons
        currentCard={currentCard}
        onSetMemorization={onSetMemorization}
        settings={settings}
        clickCount={clickCount}
        isMobile={isMobile}
      />

      <StudySettingsModal
        isOpen={showSettingsModal}
        filterMemorization={filterMemorization}
        onFilterMemorizationChange={onFilterMemorizationChange}
        frontFontSize={frontFontSize}
        onFrontFontSizeChange={onFrontFontSizeChange}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onClose={() => setShowSettingsModal(false)}
        isMobile={isMobile}
      />
    </div>
  );
}
