// Main study session component - orchestrates all sub-components
import { useState } from 'react';
import type { StudySessionProps } from './types';
import { useIsMobile } from './use-is-mobile';
import { EmptyState } from './empty-state';
import { StudyHeader } from './study-header';
import { CardArea } from './card-area';
import { ActionButtons } from './action-buttons';
import { StudySettingsModal } from './settings-modal';

export function StudySession({
  currentCard,
  currentIndex,
  totalCards,
  isFlipped,
  onFlip,
  onSetMemorization,
  onSetDifficulty,
  filterMemorization,
  onFilterMemorizationChange,
  filterDifficulty,
  onFilterDifficultyChange,
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
}: StudySessionProps) {
  const isMobile = useIsMobile();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  if (!currentCard) {
    return (
      <>
        <EmptyState
          filterMemorization={filterMemorization}
          onFilterMemorizationChange={onFilterMemorizationChange}
          filterDifficulty={filterDifficulty}
          onFilterDifficultyChange={onFilterDifficultyChange}
          onBack={onBack}
          onSettingsClick={() => setShowSettingsModal(true)}
        />
        {showSettingsModal && (
          <StudySettingsModal
            filterMemorization={filterMemorization}
            onFilterMemorizationChange={onFilterMemorizationChange}
            filterDifficulty={filterDifficulty}
            onFilterDifficultyChange={onFilterDifficultyChange}
            frontFontSize={frontFontSize}
            onFrontFontSizeChange={onFrontFontSizeChange}
            settings={settings}
            onSettingsChange={onSettingsChange}
            onClose={() => setShowSettingsModal(false)}
            isMobile={isMobile}
          />
        )}
      </>
    );
  }

  return (
    <div className="study-session">
      <StudyHeader
        selectedLevel={selectedLevel}
        filterMemorization={filterMemorization}
        onFilterMemorizationChange={onFilterMemorizationChange}
        filterDifficulty={filterDifficulty}
        onFilterDifficultyChange={onFilterDifficultyChange}
        currentIndex={currentIndex}
        totalCards={totalCards}
        isShuffled={isShuffled}
        onShuffle={onShuffle}
        onResetOrder={onResetOrder}
        onSettingsClick={() => setShowSettingsModal(true)}
        onBack={onBack}
        isMobile={isMobile}
        currentCard={currentCard}
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
        onSetDifficulty={onSetDifficulty}
        settings={settings}
        clickCount={clickCount}
        isMobile={isMobile}
      />

      {showSettingsModal && (
        <StudySettingsModal
          filterMemorization={filterMemorization}
          onFilterMemorizationChange={onFilterMemorizationChange}
          filterDifficulty={filterDifficulty}
          onFilterDifficultyChange={onFilterDifficultyChange}
          frontFontSize={frontFontSize}
          onFrontFontSizeChange={onFrontFontSizeChange}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setShowSettingsModal(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
