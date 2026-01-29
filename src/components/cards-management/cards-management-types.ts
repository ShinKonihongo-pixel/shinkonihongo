// Cards Management Types - Shared types for all card management tabs

import type { Flashcard, FlashcardFormData, Lesson, JLPTLevel, GrammarCard, GrammarCardFormData, GrammarLesson } from '../../types/flashcard';
import type { CurrentUser, User, UserRole } from '../../types/user';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTLevel as JLPTQuestionLevel, QuestionCategory, JLPTAnswer, JLPTFolder } from '../../types/jlpt-question';
import type { Lecture, LectureFolder } from '../../types/lecture';
import type { KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder } from '../../types/kaiwa-question';
import type { JLPTLevel as KaiwaJLPTLevel, ConversationTopic, ConversationStyle } from '../../types/kaiwa';
import type { Classroom } from '../../types/classroom';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion, KaiwaAdvancedTopicFormData, KaiwaAdvancedQuestionFormData } from '../../types/kaiwa-advanced';
import type { CustomTopic, CustomTopicFolder, CustomTopicQuestion, CustomTopicFormData, CustomTopicQuestionFormData } from '../../types/custom-topic';

export type ManagementTab = 'vocabulary' | 'grammar' | 'reading' | 'lectures' | 'jlpt' | 'kaiwa' | 'custom_topics' | 'game' | 'assignments' | 'tests' | 'users';

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
export interface VocabularyTabProps {
  cards: Flashcard[];
  onAddCard: (data: FlashcardFormData, createdBy?: string) => void;
  onUpdateCard: (id: string, data: Partial<Flashcard>) => void;
  onDeleteCard: (id: string) => void;
  // Lessons
  lessons: Lesson[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onAddLesson: (name: string, level: JLPTLevel, parentId?: string | null, createdBy?: string) => void;
  onUpdateLesson: (id: string, name: string) => void;
  onDeleteLesson: (id: string) => void;
  onToggleLock: (lessonId: string) => void;
  onToggleHide: (lessonId: string) => void;
  onReorderLessons: (reorderedLessons: { id: string; order: number }[]) => Promise<void>;
  // Import handlers
  onImportLesson?: (data: Omit<Lesson, 'id'>) => Promise<Lesson>;
  onImportFlashcard?: (data: Omit<Flashcard, 'id'>) => Promise<Flashcard>;
  // Grammar cards for example generation
  grammarCards?: GrammarCard[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export interface GrammarTabProps {
  grammarCards: GrammarCard[];
  onAddGrammarCard: (data: GrammarCardFormData, createdBy?: string) => void;
  onUpdateGrammarCard: (id: string, data: Partial<GrammarCard>) => void;
  onDeleteGrammarCard: (id: string) => void;
  // Grammar lessons (separate from vocabulary)
  grammarLessons: GrammarLesson[];
  getParentLessonsByLevel: (level: JLPTLevel) => GrammarLesson[];
  getChildLessons: (parentId: string) => GrammarLesson[];
  hasChildren: (lessonId: string) => boolean;
  getLessonCountByLevel: (level: JLPTLevel) => number;
  onAddLesson: (name: string, level: JLPTLevel, parentId: string | null, createdBy: string) => Promise<GrammarLesson>;
  onUpdateLesson: (id: string, name: string) => Promise<void>;
  onDeleteLesson: (id: string) => Promise<void>;
  onSeedLessons: (level: JLPTLevel, startNum: number, endNum: number, childFolders: string[], createdBy: string) => Promise<number>;
  onReorderLessons: (reorderedLessons: { id: string; order: number }[]) => Promise<void>;
  // Import handlers
  onImportGrammarCard?: (data: Omit<GrammarCard, 'id'>) => Promise<GrammarCard>;
  // Vocabulary for AI example generation
  vocabularyCards?: Flashcard[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

// Legacy alias for FlashcardsTabProps (combines both for backward compatibility)
export interface FlashcardsTabProps extends VocabularyTabProps {
  grammarCards: GrammarCard[];
  onAddGrammarCard: (data: GrammarCardFormData, createdBy?: string) => void;
  onUpdateGrammarCard: (id: string, data: Partial<GrammarCard>) => void;
  onDeleteGrammarCard: (id: string) => void;
  onImportGrammarCard?: (data: Omit<GrammarCard, 'id'>) => Promise<GrammarCard>;
}

export interface JLPTTabProps {
  questions: JLPTQuestion[];
  folders: JLPTFolder[]; // Full array for export
  onAddQuestion: (data: JLPTQuestionFormData) => Promise<void>;
  onUpdateQuestion: (id: string, data: Partial<JLPTQuestion>) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onAddFolder: (name: string, level: JLPTQuestionLevel, category: QuestionCategory) => Promise<void>;
  onUpdateFolder: (id: string, data: Partial<JLPTFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  getFoldersByLevelAndCategory: (level: JLPTQuestionLevel, category: QuestionCategory) => JLPTFolder[];
  getQuestionsByFolder: (folderId: string) => JLPTQuestion[];
  // Import handlers
  onImportFolder?: (data: Omit<JLPTFolder, 'id'>) => Promise<JLPTFolder>;
  onImportQuestion?: (data: Omit<JLPTQuestion, 'id'>) => Promise<JLPTQuestion>;
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
  // Advanced Topics props
  advancedTopics?: KaiwaAdvancedTopic[];
  advancedQuestions?: KaiwaAdvancedQuestion[];
  onAddAdvancedTopic?: (data: KaiwaAdvancedTopicFormData) => Promise<KaiwaAdvancedTopic | null>;
  onUpdateAdvancedTopic?: (id: string, data: Partial<KaiwaAdvancedTopicFormData>) => Promise<boolean>;
  onDeleteAdvancedTopic?: (id: string) => Promise<boolean>;
  onAddAdvancedQuestion?: (data: KaiwaAdvancedQuestionFormData) => Promise<KaiwaAdvancedQuestion | null>;
  onUpdateAdvancedQuestion?: (id: string, data: Partial<KaiwaAdvancedQuestionFormData>) => Promise<boolean>;
  onDeleteAdvancedQuestion?: (id: string) => Promise<boolean>;
  // Custom Topics props (moved from separate tab)
  customTopics?: CustomTopic[];
  customTopicFolders?: CustomTopicFolder[];
  customTopicQuestions?: CustomTopicQuestion[];
  onAddCustomTopic?: (data: CustomTopicFormData) => Promise<CustomTopic | null>;
  onUpdateCustomTopic?: (id: string, data: Partial<CustomTopicFormData>) => Promise<boolean>;
  onDeleteCustomTopic?: (id: string) => Promise<boolean>;
  onAddCustomTopicFolder?: (topicId: string, name: string, level?: KaiwaJLPTLevel) => Promise<CustomTopicFolder | null>;
  onUpdateCustomTopicFolder?: (id: string, name: string, level?: KaiwaJLPTLevel) => Promise<boolean>;
  onDeleteCustomTopicFolder?: (id: string) => Promise<boolean>;
  onAddCustomTopicQuestion?: (data: CustomTopicQuestionFormData) => Promise<CustomTopicQuestion | null>;
  onUpdateCustomTopicQuestion?: (id: string, data: Partial<CustomTopicQuestionFormData>) => Promise<boolean>;
  onDeleteCustomTopicQuestion?: (id: string) => Promise<boolean>;
  // Flashcard lessons for custom topic linking
  lessons?: Lesson[];
  getLessonsByLevel?: (level: JLPTLevel) => Lesson[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export interface LecturesTabProps {
  lectures: Lecture[];
  loading: boolean;
  onDeleteLecture: (id: string) => Promise<boolean | void>;
  onToggleHide: (id: string) => void;
  onAddFolder: (name: string, level: JLPTLevel, createdBy: string) => Promise<LectureFolder | null | void>;
  onUpdateFolder: (id: string, data: Partial<LectureFolder>) => Promise<boolean | void>;
  onDeleteFolder: (id: string) => Promise<boolean | void>;
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
  Flashcard, FlashcardFormData, Lesson, JLPTLevel, GrammarCard, GrammarCardFormData, GrammarLesson,
  CurrentUser, User, UserRole,
  JLPTQuestion, JLPTQuestionFormData, JLPTQuestionLevel, QuestionCategory, JLPTAnswer, JLPTFolder,
  Lecture, LectureFolder,
  KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder,
  KaiwaJLPTLevel, ConversationTopic, ConversationStyle,
  Classroom,
  CustomTopic, CustomTopicFolder, CustomTopicQuestion, CustomTopicFormData, CustomTopicQuestionFormData,
};
