// Cards Management Types - Shared types for all card management tabs

import type { Flashcard, FlashcardFormData, Lesson, JLPTLevel } from '../../types/flashcard';
import type { CurrentUser, User, UserRole } from '../../types/user';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTLevel as JLPTQuestionLevel, QuestionCategory, JLPTAnswer, JLPTFolder } from '../../types/jlpt-question';
import type { Lecture, LectureFolder } from '../../types/lecture';
import type { KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder } from '../../types/kaiwa-question';
import type { JLPTLevel as KaiwaJLPTLevel, ConversationTopic, ConversationStyle } from '../../types/kaiwa';
import type { Classroom } from '../../types/classroom';

export type ManagementTab = 'flashcards' | 'lectures' | 'jlpt' | 'kaiwa' | 'game' | 'assignments' | 'tests' | 'users';

// Navigation state types
export type FlashcardNavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'parentLesson'; level: JLPTLevel; lessonId: string; lessonName: string }
  | { type: 'childLesson'; level: JLPTLevel; parentId: string; parentName: string; lessonId: string; lessonName: string };

export type JLPTNavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTQuestionLevel }
  | { type: 'category'; level: JLPTQuestionLevel; category: QuestionCategory; categoryLabel: string }
  | { type: 'folder'; level: JLPTQuestionLevel; category: QuestionCategory; categoryLabel: string; folderId: string; folderName: string };

export type KaiwaNavState =
  | { type: 'root' }
  | { type: 'level'; level: KaiwaJLPTLevel }
  | { type: 'topic'; level: KaiwaJLPTLevel; topic: ConversationTopic; topicLabel: string }
  | { type: 'folder'; level: KaiwaJLPTLevel; topic: ConversationTopic; topicLabel: string; folderId: string; folderName: string };

export type LectureNavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'folder'; level: JLPTLevel; folderId: string; folderName: string };

// Constants
export const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
export const JLPT_QUESTION_LEVELS: JLPTQuestionLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
export const KAIWA_LEVELS: KaiwaJLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
export const QUESTION_CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: 'vocabulary', label: 'Từ vựng' },
  { value: 'grammar', label: 'Ngữ pháp' },
  { value: 'reading', label: 'Đọc hiểu' },
  { value: 'listening', label: 'Nghe' },
];

export const defaultAnswers: JLPTAnswer[] = [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

// Tab Props Interfaces
export interface FlashcardsTabProps {
  cards: Flashcard[];
  onAddCard: (data: FlashcardFormData, createdBy?: string) => void;
  onUpdateCard: (id: string, data: Partial<Flashcard>) => void;
  onDeleteCard: (id: string) => void;
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onAddLesson: (name: string, level: JLPTLevel, parentId?: string | null, createdBy?: string) => void;
  onUpdateLesson: (id: string, name: string) => void;
  onDeleteLesson: (id: string) => void;
  onToggleLock: (lessonId: string) => void;
  onToggleHide: (lessonId: string) => void;
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export interface JLPTTabProps {
  questions: JLPTQuestion[];
  onAddQuestion: (data: JLPTQuestionFormData) => Promise<void>;
  onUpdateQuestion: (id: string, data: Partial<JLPTQuestion>) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onAddFolder: (name: string, level: JLPTQuestionLevel, category: QuestionCategory) => Promise<void>;
  onUpdateFolder: (id: string, data: Partial<JLPTFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  getFoldersByLevelAndCategory: (level: JLPTQuestionLevel, category: QuestionCategory) => JLPTFolder[];
  getQuestionsByFolder: (folderId: string) => JLPTQuestion[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export interface KaiwaTabProps {
  questions: KaiwaDefaultQuestion[];
  folders: KaiwaFolder[];
  onAddQuestion?: (data: KaiwaQuestionFormData, createdBy?: string) => Promise<KaiwaDefaultQuestion>;
  onUpdateQuestion?: (id: string, data: Partial<KaiwaDefaultQuestion>) => Promise<void>;
  onDeleteQuestion?: (id: string) => Promise<void>;
  onAddFolder?: (name: string, level: KaiwaJLPTLevel, topic: ConversationTopic, createdBy?: string) => Promise<KaiwaFolder>;
  onUpdateFolder?: (id: string, data: Partial<KaiwaFolder>) => Promise<void>;
  onDeleteFolder?: (id: string) => Promise<void>;
  getFoldersByLevelAndTopic?: (level: KaiwaJLPTLevel, topic: ConversationTopic) => KaiwaFolder[];
  getQuestionsByFolder?: (folderId: string) => KaiwaDefaultQuestion[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export interface LecturesTabProps {
  lectures: Lecture[];
  loading: boolean;
  onDeleteLecture: (id: string) => Promise<void>;
  onToggleHide: (id: string) => void;
  onAddFolder: (name: string, level: JLPTLevel, createdBy: string) => Promise<void>;
  onUpdateFolder: (id: string, data: Partial<LectureFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  getFoldersByLevel: (level: JLPTLevel) => LectureFolder[];
  getLecturesByFolder: (folderId: string) => Lecture[];
  onNavigateToEditor?: (lectureId?: string, folderId?: string, level?: JLPTLevel) => void;
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export interface UsersTabProps {
  users: User[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateVipExpiration: (userId: string, date: string | undefined) => void;
  onRegister: (username: string, password: string, role: UserRole, createdBy?: string) => Promise<{ success: boolean; error?: string }>;
}

// Re-export needed types
export type {
  Flashcard, FlashcardFormData, Lesson, JLPTLevel,
  CurrentUser, User, UserRole,
  JLPTQuestion, JLPTQuestionFormData, JLPTQuestionLevel, QuestionCategory, JLPTAnswer, JLPTFolder,
  Lecture, LectureFolder,
  KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder,
  KaiwaJLPTLevel, ConversationTopic, ConversationStyle,
  Classroom,
};
