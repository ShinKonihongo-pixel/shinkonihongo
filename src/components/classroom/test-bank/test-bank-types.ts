// Shared types, interfaces, and constants for Test Bank Panel

import type { TestTemplate, TestFolder, TestType, TestQuestion, DifficultyLevel } from '../../../types/classroom';
import type { TestTemplateFormData } from '../../../services/classroom-firestore';
import type { Flashcard } from '../../../types/flashcard';
import type { JLPTQuestion } from '../../../types/jlpt-question';

// Props for TestBankPanel
export interface TestBankPanelProps {
  templates: TestTemplate[];
  folders: TestFolder[];
  loading: boolean;
  onCreate: (data: TestTemplateFormData) => Promise<TestTemplate | null>;
  onUpdate: (id: string, data: Partial<TestTemplateFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onCreateFolder: (name: string, level: string, type: TestType) => Promise<TestFolder | null>;
  onUpdateFolder: (id: string, data: { name: string }) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  getFoldersByLevelAndType: (level: string, type: TestType) => TestFolder[];
  getTemplatesByFolder: (folderId: string) => TestTemplate[];
  // For import
  flashcards?: Flashcard[];
  jlptQuestions?: JLPTQuestion[];
  currentUserId: string;
}

// Navigation state type
export type NavState =
  | { type: 'root' }
  | { type: 'level'; level: string }
  | { type: 'folder'; level: string; folderId: string; folderName: string };

// Difficulty options for UI
export const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'easy', label: 'Dễ', color: '#27ae60' },
  { value: 'medium', label: 'Trung bình', color: '#f39c12' },
  { value: 'hard', label: 'Khó', color: '#e74c3c' },
];

// Source mix configuration
export interface SourcesEnabled {
  flashcard: boolean;
  jlpt: boolean;
  testbank: boolean;
}

export interface SourceMixPct {
  flashcard: number;
  jlpt: number;
  testbank: number;
}

// Difficulty mix presets
export const DIFFICULTY_PRESETS = [
  { name: 'Cân bằng', easy: 30, medium: 50, hard: 20 },
  { name: 'Dễ hơn', easy: 50, medium: 40, hard: 10 },
  { name: 'Khó hơn', easy: 10, medium: 40, hard: 50 },
  { name: 'Chỉ TB', easy: 0, medium: 100, hard: 0 },
];

// Source mix presets
export const SOURCE_MIX_PRESETS = [
  { name: 'Chỉ Flashcard', flashcard: 100, jlpt: 0, testbank: 0 },
  { name: 'Chỉ JLPT', flashcard: 0, jlpt: 100, testbank: 0 },
  { name: 'Mix FC+JLPT', flashcard: 50, jlpt: 50, testbank: 0 },
  { name: 'Tất cả', flashcard: 40, jlpt: 40, testbank: 20 },
];

// Helper functions
export const flashcardToQuestion = (card: Flashcard, difficulty: DifficultyLevel, defaultPoints: number): TestQuestion => ({
  id: `fc_${card.id}`,
  questionType: 'text',
  question: `${card.vocabulary} の意味は？${card.kanji ? ` (${card.kanji})` : ''}`,
  correctAnswer: card.meaning,
  points: defaultPoints,
  difficulty,
  explanation: card.sinoVietnamese ? `Hán Việt: ${card.sinoVietnamese}` : undefined,
});

export const jlptToQuestion = (jq: JLPTQuestion, difficulty: DifficultyLevel, defaultPoints: number): TestQuestion => ({
  id: `jlpt_${jq.id}`,
  questionType: 'multiple_choice',
  question: jq.question,
  options: jq.answers.map(a => a.text),
  correctAnswer: jq.answers.findIndex(a => a.isCorrect),
  points: defaultPoints,
  difficulty,
  explanation: jq.explanation,
});
