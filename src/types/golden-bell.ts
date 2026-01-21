// Golden Bell Game Types - "Rung Chuông Vàng"
// Elimination-style quiz game where wrong answers eliminate players

import type { JLPTLevel } from './flashcard';

// Question difficulty levels
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

// Question category types
export type QuestionCategory = 'grammar' | 'vocabulary' | 'kanji' | 'culture';

// Player status in game
export type PlayerStatus = 'alive' | 'eliminated' | 'winner';

// Game status
export type GoldenBellGameStatus =
  | 'waiting'       // Waiting for players
  | 'starting'      // Countdown before game
  | 'question'      // Showing question
  | 'answering'     // Players answering
  | 'revealing'     // Showing correct answer & eliminations
  | 'finished';     // Game over

// Question structure
export interface GoldenBellQuestion {
  id: string;
  questionText: string;
  options: string[];          // 4 options (A, B, C, D)
  correctIndex: number;       // Index of correct answer (0-3)
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  timeLimit: number;          // Seconds to answer
  explanation?: string;       // Optional explanation for answer
}

// Player in Golden Bell game
export interface GoldenBellPlayer {
  odinhId: string;            // Player unique ID
  displayName: string;
  avatar: string;
  role?: string;              // User role for VIP styling
  status: PlayerStatus;
  correctAnswers: number;
  totalAnswers: number;
  currentAnswer?: number;     // Index of selected answer
  answerTime?: number;        // Time taken to answer (ms)
  eliminatedAt?: number;      // Question number when eliminated
  streak: number;             // Consecutive correct answers
  isBot?: boolean;            // Whether this is a bot player
}

// Game settings
export interface GoldenBellSettings {
  maxPlayers: number;         // 10-100 players
  minPlayers: number;         // Minimum to start (default 2)
  questionCount: number;      // Total questions
  timePerQuestion: number;    // Seconds per question
  jlptLevel: JLPTLevel;
  categories: QuestionCategory[];
  difficultyProgression: boolean;  // Start easy, get harder
  contentSource: 'flashcard' | 'jlpt';
  lessonId?: string;
}

// Main game state
export interface GoldenBellGame {
  id: string;
  code: string;               // 6-digit join code
  hostId: string;
  title: string;
  settings: GoldenBellSettings;
  status: GoldenBellGameStatus;
  players: Record<string, GoldenBellPlayer>;
  questions: GoldenBellQuestion[];
  currentQuestionIndex: number;
  questionStartTime?: number;
  alivePlayers: number;       // Count of players still alive
  eliminatedThisRound: string[];  // Player IDs eliminated this round
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Player result for final rankings
export interface GoldenBellPlayerResult {
  odinhId: string;
  displayName: string;
  avatar: string;
  rank: number;               // Final position (1 = winner)
  correctAnswers: number;
  accuracy: number;           // Percentage correct
  survivedRounds: number;     // How many questions they survived
  longestStreak: number;
  isWinner: boolean;
}

// Game results
export interface GoldenBellResults {
  gameId: string;
  winner: GoldenBellPlayerResult | null;
  rankings: GoldenBellPlayerResult[];
  totalQuestions: number;
  totalPlayers: number;
}

// Create game form data
export interface CreateGoldenBellData {
  title: string;
  jlptLevel: JLPTLevel;
  contentSource: 'flashcard' | 'jlpt';
  lessonId?: string;
  questionCount: number;
  timePerQuestion: number;
  maxPlayers: number;
  categories: QuestionCategory[];
  difficultyProgression: boolean;
}

// Category display info
export const CATEGORY_INFO: Record<QuestionCategory, { name: string; emoji: string; color: string }> = {
  grammar: { name: 'Ngữ pháp', emoji: '📖', color: '#4ecdc4' },
  vocabulary: { name: 'Từ vựng', emoji: '📝', color: '#ff6b6b' },
  kanji: { name: 'Kanji', emoji: '🈳', color: '#ffd93d' },
  culture: { name: 'Văn hóa', emoji: '🎌', color: '#6c5ce7' },
};

// Difficulty display info
export const DIFFICULTY_INFO: Record<QuestionDifficulty, { name: string; emoji: string; color: string }> = {
  easy: { name: 'Dễ', emoji: '⭐', color: '#2ecc71' },
  medium: { name: 'Trung bình', emoji: '⭐⭐', color: '#f39c12' },
  hard: { name: 'Khó', emoji: '⭐⭐⭐', color: '#e74c3c' },
};

// Answer option labels
export const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

// Answer option colors (Kahoot-style)
export const ANSWER_COLORS = [
  'linear-gradient(135deg, #e21b3c, #c0172a)',  // Red - A
  'linear-gradient(135deg, #1368ce, #0f5fc0)',  // Blue - B
  'linear-gradient(135deg, #d89e00, #c68f00)',  // Yellow - C
  'linear-gradient(135deg, #26890c, #1f7009)',  // Green - D
];

// Answer option shapes
export const ANSWER_SHAPES = ['▲', '◆', '●', '■'];
