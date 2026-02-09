// Grammar study page - Main entry point
import type { GrammarCard, JLPTLevel, GrammarLesson } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import { LevelLessonSelector } from '../study/level-lesson-selector';
import { useStudyState } from './grammar-study/use-study-state';
import { EmptyState } from './grammar-study/empty-state';
import { StudyView } from './grammar-study/study-view';
import { SettingsModal } from './grammar-study/settings-modal';
import { styles } from './grammar-study/styles';

interface GrammarStudyPageProps {
  grammarCards: GrammarCard[];
  lessons: GrammarLesson[];
  getLessonsByLevel: (level: JLPTLevel) => GrammarLesson[];
  getChildLessons: (parentId: string) => GrammarLesson[];
  onGoHome: () => void;
  settings?: AppSettings;
  onUpdateGrammarCard?: (id: string, data: Partial<GrammarCard>) => void;
}

export function GrammarStudyPage({
  grammarCards,
  lessons,
  getLessonsByLevel,
  getChildLessons,
  onGoHome,
  onUpdateGrammarCard,
}: GrammarStudyPageProps) {
  const state = useStudyState({ grammarCards, getChildLessons });

  const handleToggleMemorization = (status: 'memorized' | 'not_memorized') => {
    const currentCard = state.displayCards[state.currentIndex];
    if (currentCard && onUpdateGrammarCard) {
      onUpdateGrammarCard(currentCard.id, { memorizationStatus: status });
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
        onGoHome={onGoHome}
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

      <style>{styles}</style>
    </div>
  );
}
