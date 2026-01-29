// Word Scramble game types and interfaces
// Extracted from word-scramble-page.tsx for better maintainability

import type { Flashcard, JLPTLevel } from '../../../types/flashcard';

// Game configuration
export interface GameConfig {
  selectedLevels: JLPTLevel[];
  timePerQuestion: number;
  totalQuestions: number;
}

// Question state
export interface Question {
  word: Flashcard;
  scrambledLetters: string[];
  originalPositions: number[];
}

// Player role type
export type PlayerRole = 'user' | 'vip' | 'admin' | 'super_admin';

// Player in leaderboard
export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  correctAnswers: number;
  isCurrentUser: boolean;
  role?: PlayerRole;
}

// Hint state - 3 hints available
export interface HintState {
  hint1Shown: boolean;
  hint2Shown: boolean;
  hint3Shown: boolean;
  hint1Content: string;
  hint2Content: string;
  hint3Content: string;
}

// Game phase
export type GamePhase = 'setup' | 'playing' | 'result';

// Game state
export interface GameState {
  phase: GamePhase;
  currentQuestionIndex: number;
  questions: Question[];
  score: number;
  totalTime: number;
  correctAnswers: number;
  wrongAnswers: number;
  questionStartTime: number;
  timeRemaining: number;
  selectedLetters: number[];
  hints: HintState;
  isCorrect: boolean | null;
  showResult: boolean;
  streak: number;
  maxStreak: number;
  players: Player[];
  autoFillUsed: number; // 0-3 uses
  autoFilledPositions: number[]; // positions that were auto-filled
  isSoloMode: boolean;
}

// Component props
export interface WordScramblePageProps {
  onClose: () => void;
  flashcards: Flashcard[];
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: PlayerRole;
  };
}

// Scramble result
export interface ScrambleResult {
  letters: string[];
  positions: number[];
}
