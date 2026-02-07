// Main kanji study page - entry point
import type { KanjiCard, KanjiLesson } from '../../types/kanji';
import type { JLPTLevel } from '../../types/flashcard';
import { LevelLessonSelector } from '../study/level-lesson-selector';
import { useStudyState } from './kanji-study/use-study-state';
import { StudyView } from './kanji-study/study-view';
import { EmptyState } from './kanji-study/empty-state';
import { SettingsModal } from './kanji-study/settings-modal';
import { styles } from './kanji-study/styles';

interface KanjiStudyPageProps {
  kanjiCards: KanjiCard[];
  lessons: KanjiLesson[];
  getLessonsByLevel: (level: JLPTLevel) => KanjiLesson[];
  getChildLessons: (parentId: string) => KanjiLesson[];
  onGoHome: () => void;
  onUpdateKanjiCard: (id: string, data: Partial<KanjiCard>) => void;
}

export function KanjiStudyPage({
  kanjiCards, lessons, getLessonsByLevel, getChildLessons, onGoHome, onUpdateKanjiCard,
}: KanjiStudyPageProps) {
  const state = useStudyState(kanjiCards, lessons, getLessonsByLevel, getChildLessons);

  const handleToggleMemorization = (status: 'memorized' | 'not_memorized') => {
    const card = state.displayCards[state.currentIndex];
    if (!card) return;
    const newStatus = card.memorizationStatus === status ? undefined : status;
    onUpdateKanjiCard(card.id, { memorizationStatus: newStatus });
  };

  const handleRestart = () => {
    state.setCurrentIndex(0);
    state.setIsFlipped(false);
  };

  if (state.viewMode === 'select') {
    return (
      <LevelLessonSelector
        type="kanji"
        cards={kanjiCards}
        getLessonsByLevel={getLessonsByLevel}
        getChildLessons={getChildLessons}
        onStart={(lessonIds, level) => state.handleStartStudy(level, lessonIds)}
        onGoHome={onGoHome}
        levels={['BT', 'N5', 'N4', 'N3', 'N2', 'N1']}
      />
    );
  }

  return (
    <div className="kanji-study-page">
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
          touchStartX={state.touchStartX}
          touchStartY={state.touchStartY}
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
