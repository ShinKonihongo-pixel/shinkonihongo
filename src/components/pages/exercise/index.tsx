// Exercise Page - Main Orchestrator
// Flow: Level Selection → Exercise List → Session → Result

import { PenTool } from 'lucide-react';
import { useFlashcardData } from '../../../contexts/flashcard-data-context';
import { JLPTLevelSelector } from '../../ui/jlpt-level-selector';
import { useExerciseState } from './use-exercise-state';
import { ExerciseListView } from './exercise-list-view';
import { ExerciseSessionView } from './exercise-session-view';
import { ExerciseResultView } from './exercise-result-view';
import './exercise.css';

export function ExercisePage() {
  const { getPublishedExercises, cards: flashcards } = useFlashcardData();
  const exercises = getPublishedExercises();
  const state = useExerciseState(exercises, flashcards);

  // Render level select view
  if (state.view === 'level-select') {
    return (
      <JLPTLevelSelector
        title="Bài Tập"
        subtitle="Chọn cấp độ JLPT để bắt đầu"
        icon={<PenTool size={32} />}
        countByLevel={state.countByLevel}
        countLabel="bài tập"
        onSelectLevel={state.selectLevel}
      />
    );
  }

  // Render list view
  if (state.view === 'list' && state.selectedLevel) {
    return (
      <ExerciseListView
        selectedLevel={state.selectedLevel}
        filteredExercises={state.filteredExercises}
        countByLevel={state.countByLevel}
        onStartExercise={state.startExercise}
        onGoBack={state.goBackToLevelSelect}
      />
    );
  }

  // Render session view
  if (state.view === 'session' && state.session && state.currentExercise) {
    return (
      <ExerciseSessionView
        session={state.session}
        currentExercise={state.currentExercise}
        selectedAnswer={state.selectedAnswer}
        textAnswer={state.textAnswer}
        showResult={state.showResult}
        isListening={state.isListening}
        listenCount={state.listenCount}
        isAnimating={state.isAnimating}
        timeLeft={state.timeLeft}
        onSetSelectedAnswer={state.setSelectedAnswer}
        onSetTextAnswer={state.setTextAnswer}
        onHandleAnswer={state.handleAnswer}
        onHandleTextSubmit={state.handleTextSubmit}
        onNextQuestion={state.nextQuestion}
        onSpeakQuestion={state.speakQuestion}
        onQuit={() => state.setView('list')}
      />
    );
  }

  // Render result view
  if (state.view === 'result' && state.session && state.currentExercise) {
    const score = state.calculateScore();
    return (
      <ExerciseResultView
        session={state.session}
        currentExercise={state.currentExercise}
        score={score}
        onRestart={() => state.startExercise(state.currentExercise!)}
        onGoToList={() => state.setView('list')}
      />
    );
  }

  return null;
}

// Re-export types for backward compatibility
export type { ExercisePageProps } from './exercise-types';
