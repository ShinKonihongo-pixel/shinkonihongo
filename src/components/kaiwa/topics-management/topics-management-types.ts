// Shared types for Kaiwa Topics Management

import type {
  KaiwaAdvancedTopic,
  KaiwaAdvancedQuestion,
  KaiwaAdvancedTopicFormData,
  KaiwaAdvancedQuestionFormData,
} from '../../../types/kaiwa-advanced';

// Navigation state types
export type ViewMode = 'grid' | 'list';
export type NavType = 'topics' | 'topic-detail';

export interface NavState {
  type: NavType;
  topicId?: string;
}

// Props interfaces
export interface KaiwaTopicsManagementProps {
  topics: KaiwaAdvancedTopic[];
  questions: KaiwaAdvancedQuestion[];
  currentUserId: string;
  isSuperAdmin: boolean;
  // Topic CRUD
  onAddTopic: (data: KaiwaAdvancedTopicFormData) => Promise<KaiwaAdvancedTopic | null>;
  onUpdateTopic: (id: string, data: Partial<KaiwaAdvancedTopicFormData>) => Promise<boolean>;
  onDeleteTopic: (id: string) => Promise<boolean>;
  // Question CRUD
  onAddQuestion: (data: KaiwaAdvancedQuestionFormData) => Promise<KaiwaAdvancedQuestion | null>;
  onUpdateQuestion: (id: string, data: Partial<KaiwaAdvancedQuestionFormData>) => Promise<boolean>;
  onDeleteQuestion: (id: string) => Promise<boolean>;
}

// Form state types
export interface VocabFormState {
  word: string;
  reading: string;
  meaning: string;
  example: string;
}

export interface QuestionBankFormState {
  questionJa: string;
  questionVi: string;
  level: string;
  tags: string[];
}

export interface AnswerBankFormState {
  answerJa: string;
  answerVi: string;
  level: string;
  tags: string[];
}

// Shared state interface for orchestrator
export interface TopicsManagementState {
  navState: NavState;
  viewMode: ViewMode;
  searchQuery: string;

  // Modal states
  showTopicModal: boolean;
  editingTopic: KaiwaAdvancedTopic | null;
  topicForm: KaiwaAdvancedTopicFormData;

  showQuestionModal: boolean;
  editingQuestion: KaiwaAdvancedQuestion | null;
  questionForm: KaiwaAdvancedQuestionFormData;

  // Delete confirmation
  deleteTopicTarget: KaiwaAdvancedTopic | null;
  deleteQuestionTarget: KaiwaAdvancedQuestion | null;
}

// Permission checker types
export type CanModifyTopicFn = (topic: KaiwaAdvancedTopic) => boolean;
export type CanModifyQuestionFn = (question: KaiwaAdvancedQuestion) => boolean;
