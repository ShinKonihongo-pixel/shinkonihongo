// Grammar study page - Main entry point
import { useNavigate } from 'react-router-dom';
import { useFlashcardData } from '../../contexts/flashcard-data-context';
import { LevelLessonSelector } from '../study/level-lesson-selector';
import { useStudyState } from './grammar-study/use-study-state';
import { EmptyState } from './grammar-study/empty-state';
import { StudyView } from './grammar-study/study-view';
import { SettingsModal } from './grammar-study/settings-modal';
import './grammar-study-page.css';

export function GrammarStudyPage() {
  const navigate = useNavigate();
  const {
    grammarCards,
    grammarLessons: lessons,
    getGrammarLessonsByLevel: getLessonsByLevel,
    getGrammarChildLessons: getChildLessons,
    updateGrammarCard,
  } = useFlashcardData();
  const state = useStudyState({ grammarCards, getChildLessons });

  const handleToggleMemorization = (status: 'memorized' | 'not_memorized') => {
    const currentCard = state.displayCards[state.currentIndex];
    if (currentCard) {
      updateGrammarCard(currentCard.id, { memorizationStatus: status });
    }
  };

  const handleRestart = () => {
    state.setCurrentIndex(0);
    state.setIsFlipped(false);
  };

  if (state.viewMode === 'select') {
    return (
      <LevelLessonSelector
        type="grammar"
        cards={grammarCards}
        getLessonsByLevel={getLessonsByLevel}
        getChildLessons={getChildLessons}
        onStart={state.handleStart}
        onGoHome={() => navigate('/')}
      />
    );
  }

  return (
    <div className="grammar-study-page">
      {state.displayCards.length === 0 ? (
        <EmptyState
          selectedLevel={state.selectedLevel}
          memorizationFilter={state.memorizationFilter}
          isShuffled={state.isShuffled}
          onFilterChange={state.setMemorizationFilter}
          onShuffle={state.handleShuffle}
          onRestart={handleRestart}
          onBack={state.handleBackToSelect}
          onOpenSettings={() => state.setShowSettingsModal(true)}
        />
      ) : (
        <StudyView
          displayCards={state.displayCards}
          currentIndex={state.currentIndex}
          isFlipped={state.isFlipped}
          isShuffled={state.isShuffled}
          selectedLevel={state.selectedLevel}
          memorizationFilter={state.memorizationFilter}
          lessons={lessons}
          studySettings={state.studySettings}
          onNext={state.handleNext}
          onPrev={state.handlePrev}
          onFlip={() => state.setIsFlipped(!state.isFlipped)}
          onShuffle={state.handleShuffle}
          onRestart={handleRestart}
          onBack={state.handleBackToSelect}
          onOpenSettings={() => state.setShowSettingsModal(true)}
          onFilterChange={state.setMemorizationFilter}
          onToggleMemorization={handleToggleMemorization}
        />
      )}

      {state.showSettingsModal && (
        <SettingsModal
          settings={state.studySettings}
          onClose={() => state.setShowSettingsModal(false)}
          onUpdateSettings={state.setStudySettings}
        />
      )}
    </div>
  );
}
