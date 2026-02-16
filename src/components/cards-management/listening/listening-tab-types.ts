// Types and constants for Listening Tab
import type { JLPTLevel } from '../../../types/flashcard';
import type { CurrentUser } from '../../../types/user';
import type { ListeningAudio, ListeningFolder, ListeningLessonType, KaiwaLine, TtsMode } from '../../../types/listening';
import { BookOpen, MessageCircle, FileText, Type, Quote, Layers } from 'lucide-react';

export type NavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'lesson'; level: JLPTLevel; lessonNumber: number }
  | { type: 'lessonType'; level: JLPTLevel; lessonNumber: number; lessonType: ListeningLessonType };

export interface ListeningTabProps {
  audios: ListeningAudio[];
  folders: ListeningFolder[];
  onAddAudio: (data: Omit<ListeningAudio, 'id' | 'createdAt' | 'createdBy'>, file: File) => Promise<void>;
  onAddTextAudio: (data: { title: string; description: string; textContent: string; jlptLevel: JLPTLevel; folderId: string; ttsMode?: TtsMode; kaiwaLines?: KaiwaLine[] }) => Promise<void>;
  onUpdateAudio: (id: string, data: Partial<ListeningAudio>) => Promise<void>;
  onDeleteAudio: (id: string) => Promise<void>;
  onAddFolder: (name: string, level: JLPTLevel, lessonType: ListeningLessonType, lessonNumber?: number) => Promise<void>;
  onUpdateFolder: (id: string, data: Partial<ListeningFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  getFoldersByLevel: (level: JLPTLevel) => ListeningFolder[];
  getFoldersByLevelAndType: (level: JLPTLevel, lessonType: ListeningLessonType) => ListeningFolder[];
  getFoldersByLevelLessonAndType: (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => ListeningFolder[];
  getAudiosByFolder: (folderId: string) => ListeningAudio[];
  getAudioUrl: (audio: ListeningAudio) => Promise<string | null>;
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export { JLPT_LEVELS } from '../../../constants/jlpt';

// Lesson type configurations with Japanese labels
export const LESSON_TYPES: { value: ListeningLessonType; label: string; icon: typeof BookOpen }[] = [
  { value: 'practice', label: '練習', icon: BookOpen },
  { value: 'conversation', label: '会話', icon: MessageCircle },
  { value: 'reading', label: '読解', icon: FileText },
  { value: 'bunpou', label: '文型', icon: Type },
  { value: 'reibun', label: '例文', icon: Quote },
  { value: 'other', label: 'その他', icon: Layers },
];

// Lesson type theme configurations
export const LESSON_TYPE_THEMES: Record<ListeningLessonType, { gradient: string; glow: string }> = {
  practice: { gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', glow: 'rgba(34, 197, 94, 0.4)' },
  conversation: { gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', glow: 'rgba(236, 72, 153, 0.4)' },
  reading: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.4)' },
  bunpou: { gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', glow: 'rgba(6, 182, 212, 0.4)' },
  reibun: { gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', glow: 'rgba(249, 115, 22, 0.4)' },
  other: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139, 92, 246, 0.4)' },
};
