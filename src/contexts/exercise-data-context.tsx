// Domain context: exercises
// Isolated so exercise state changes don't re-render vocab/grammar/kanji/reading consumers

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Exercise } from '../types/exercise';
import { useExercises } from '../hooks/use-exercises';

export interface ExerciseDataContextValue {
  getPublishedExercises: () => Exercise[];
}

const ExerciseDataContext = createContext<ExerciseDataContextValue | null>(null);

interface Props {
  children: ReactNode;
}

export function ExerciseDataProvider({ children }: Props) {
  const { getPublishedExercises } = useExercises();

  const value = useMemo<ExerciseDataContextValue>(() => ({
    getPublishedExercises,
  }), [getPublishedExercises]);

  return <ExerciseDataContext.Provider value={value}>{children}</ExerciseDataContext.Provider>;
}

export function useExerciseData() {
  const ctx = useContext(ExerciseDataContext);
  if (!ctx) throw new Error('useExerciseData must be used within ExerciseDataProvider');
  return ctx;
}
