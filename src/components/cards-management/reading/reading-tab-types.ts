// Reading Tab - Shared types and constants

import type { ReadingPassage, ReadingPassageFormData, ReadingFolder, ReadingAnswer, ReadingVocabulary } from '../../../types/reading';
import type { JLPTLevel } from '../../../types/flashcard';
import type { CurrentUser } from '../../../types/user';

// Level theme configurations
export const LEVEL_THEMES: Record<JLPTLevel, { gradient: string; glow: string; icon: string; light: string }> = {
  BT: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', glow: 'rgba(139, 92, 246, 0.15)', icon: '部', light: '#f5f3ff' },
  N5: { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16, 185, 129, 0.15)', icon: '🌱', light: '#ecfdf5' },
  N4: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', glow: 'rgba(59, 130, 246, 0.15)', icon: '📘', light: '#eff6ff' },
  N3: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.15)', icon: '📖', light: '#f5f3ff' },
  N2: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.15)', icon: '📚', light: '#fffbeb' },
  N1: { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239, 68, 68, 0.15)', icon: '👑', light: '#fef2f2' },
};

export type NavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'folder'; level: JLPTLevel; folderId: string; folderName: string };

export interface ReadingTabProps {
  passages: ReadingPassage[];
  folders: ReadingFolder[];
  onAddPassage: (data: ReadingPassageFormData, createdBy?: string) => Promise<ReadingPassage>;
  onUpdatePassage: (id: string, data: Partial<ReadingPassage>) => Promise<void>;
  onDeletePassage: (id: string) => Promise<void>;
  onAddFolder: (name: string, level: JLPTLevel, createdBy?: string) => Promise<ReadingFolder>;
  onUpdateFolder: (id: string, data: Partial<ReadingFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  getFoldersByLevel: (level: JLPTLevel) => ReadingFolder[];
  getPassagesByFolder: (folderId: string) => ReadingPassage[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export const defaultAnswers: ReadingAnswer[] = [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

export interface PassageFormData {
  title: string;
  content: string;
  questions: { question: string; answers: ReadingAnswer[]; explanation?: string }[];
  vocabulary: ReadingVocabulary[];
  jlptLevel: JLPTLevel;
  folderId?: string;
}

// View-specific props
export interface RootViewProps {
  onSelectLevel: (level: JLPTLevel) => void;
  getPassageCountByLevel: (level: JLPTLevel) => number;
}

export interface LevelViewProps {
  level: JLPTLevel;
  folders: ReadingFolder[];
  onSelectFolder: (folderId: string, folderName: string) => void;
  onAddFolder: () => void;
  onEditFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string, name: string) => void;
  canModify: (createdBy?: string) => boolean;
  getPassageCountByFolder: (folderId: string) => number;
}

export interface FolderViewProps {
  level: JLPTLevel;
  folderName: string;
  passages: ReadingPassage[];
  onAddPassage: () => void;
  onEditPassage: (passage: ReadingPassage) => void;
  onDeletePassage: (id: string, name: string) => void;
  canModify: (createdBy?: string) => boolean;
}

export interface PassageFormProps {
  editingPassage: ReadingPassage | null;
  formData: PassageFormData;
  generatingFurigana: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onUpdateFormData: (data: Partial<PassageFormData>) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (idx: number) => void;
  onUpdateQuestion: (idx: number, field: string, value: string) => void;
  onUpdateAnswer: (qIdx: number, aIdx: number, text: string) => void;
  onSetCorrectAnswer: (qIdx: number, aIdx: number) => void;
  onAddVocabulary: () => void;
  onRemoveVocabulary: (idx: number) => void;
  onUpdateVocabulary: (idx: number, field: keyof ReadingVocabulary, value: string) => void;
  onGenerateFuriganaContent: () => void;
  onGenerateFuriganaQuestion: (qIdx: number) => void;
  onGenerateFuriganaAnswer: (qIdx: number, aIdx: number) => void;
  onGenerateAllFurigana: () => void;
}
