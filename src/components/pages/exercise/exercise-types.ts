// Exercise Page Type Definitions

import type { Exercise, ExerciseSession } from '../../../types/exercise';
import type { JLPTLevel } from '../../../types/flashcard';

export interface ExercisePageProps {}

export type ViewState = 'level-select' | 'list' | 'session' | 'result';

export interface ExerciseStateReturn {
  view: ViewState;
  selectedLevel: JLPTLevel | null;
  session: ExerciseSession | null;
  currentExercise: Exercise | null;
  selectedAnswer: number | null;
  textAnswer: string;
  showResult: boolean;
  isListening: boolean;
  listenCount: number;
  isAnimating: boolean;
  timeLeft: number | null;
  publishedExercises: Exercise[];
  filteredExercises: Exercise[];
  countByLevel: Record<JLPTLevel, number>;
  setView: (view: ViewState) => void;
  setSelectedLevel: (level: JLPTLevel | null) => void;
  setSession: (session: ExerciseSession | null) => void;
  setCurrentExercise: (exercise: Exercise | null) => void;
  setSelectedAnswer: (answer: number | null) => void;
  setTextAnswer: (text: string) => void;
  setShowResult: (show: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setListenCount: (count: number) => void;
  setIsAnimating: (animating: boolean) => void;
  setTimeLeft: (time: number | null) => void;
  selectLevel: (level: JLPTLevel) => void;
  goBackToLevelSelect: () => void;
  startExercise: (exercise: Exercise) => void;
  handleAnswer: (answer: number | string) => void;
  handleTextSubmit: () => void;
  nextQuestion: () => void;
  calculateScore: () => { correct: number; total: number; percentage: number };
  speakQuestion: (text: string) => void;
}
