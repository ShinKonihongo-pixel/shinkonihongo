// Custom Topic Extension Types - 題材拡張
// Custom conversation topics for Kaiwa practice with AI
// Questions are used for conversation prompts, not multiple choice quiz

import type { JLPTLevel } from './kaiwa';

// Difficulty levels for custom topics
export type TopicDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

// Predefined topic icons for quick selection
export const TOPIC_ICONS = [
  '💼', '✈️', '🎌', '🎮', '📺', '🎵', '🏥', '⚖️', '💻', '🔬',
  '📚', '🎨', '🍣', '⚽', '🎬', '🗾', '🏯', '🌸', '🎎', '📰',
  '🗣️', '✍️', '📝', '🎓', '🏢', '🛒', '🚗', '🏠', '💑', '👨‍👩‍👧',
] as const;

// Predefined topic colors
export const TOPIC_COLORS = [
  { id: 'red', value: '#ef4444', label: 'Đỏ' },
  { id: 'orange', value: '#f97316', label: 'Cam' },
  { id: 'amber', value: '#f59e0b', label: 'Vàng' },
  { id: 'green', value: '#22c55e', label: 'Xanh lá' },
  { id: 'teal', value: '#14b8a6', label: 'Xanh ngọc' },
  { id: 'blue', value: '#3b82f6', label: 'Xanh dương' },
  { id: 'indigo', value: '#6366f1', label: 'Chàm' },
  { id: 'purple', value: '#a855f7', label: 'Tím' },
  { id: 'pink', value: '#ec4899', label: 'Hồng' },
  { id: 'slate', value: '#64748b', label: 'Xám' },
] as const;

// Predefined topic templates for quick start
export const TOPIC_TEMPLATES = [
  { icon: '💼', name: 'Tiếng Nhật Kinh Doanh', description: 'Từ vựng và mẫu câu dùng trong công việc, họp hành, email', color: '#3b82f6' },
  { icon: '✈️', name: 'Du Lịch Nhật Bản', description: 'Giao tiếp tại sân bay, khách sạn, nhà hàng, mua sắm', color: '#22c55e' },
  { icon: '🎮', name: 'Anime & Manga', description: 'Từ vựng thông dụng trong anime, manga, game', color: '#a855f7' },
  { icon: '💻', name: 'IT & Công Nghệ', description: 'Thuật ngữ lập trình, công nghệ, internet bằng tiếng Nhật', color: '#6366f1' },
  { icon: '🏥', name: 'Y Tế & Sức Khỏe', description: 'Từ vựng y tế, triệu chứng, khám bệnh', color: '#ef4444' },
  { icon: '🍣', name: 'Ẩm Thực Nhật Bản', description: 'Tên món ăn, nguyên liệu, cách gọi món', color: '#f97316' },
  { icon: '📰', name: 'Tin Tức & Thời Sự', description: 'Từ vựng báo chí, chính trị, xã hội', color: '#64748b' },
  { icon: '🎬', name: 'Phim & Giải Trí', description: 'Từ vựng điện ảnh, âm nhạc, giải trí', color: '#ec4899' },
] as const;

// Custom Topic - A themed question collection
export interface CustomTopic {
  id: string;
  name: string;                    // Topic name (e.g., "Tiếng Nhật Kinh Doanh")
  description: string;             // Brief description
  icon: string;                    // Emoji icon
  color: string;                   // Theme color (hex)
  difficulty: TopicDifficulty;     // Overall difficulty
  tags: string[];                  // Searchable tags
  isPublic: boolean;               // Visible to all users or private
  questionCount: number;           // Cached count for display
  linkedLessonIds: string[];       // Linked Flashcard lesson IDs for vocabulary/grammar
  createdBy: string;               // User ID
  createdAt: string;               // ISO date
  updatedAt: string;               // ISO date
}

// Custom Topic Folder - Organize questions within a topic
export interface CustomTopicFolder {
  id: string;
  topicId: string;                 // Parent topic
  name: string;                    // Folder name
  level: JLPTLevel;                // JLPT level for this folder
  linkedLessonIds: string[];       // Linked Flashcard lesson IDs for vocabulary
  order: number;                   // Display order
  createdBy: string;
  createdAt: string;
}

// Custom Topic Question - Conversation prompt for AI Kaiwa practice
export interface CustomTopicQuestion {
  id: string;
  topicId: string;                 // Parent topic
  folderId?: string;               // Optional folder
  questionJa: string;              // Question in Japanese
  questionVi?: string;             // Vietnamese translation
  situationContext?: string;       // Conversation situation/context
  suggestedAnswers?: string[];     // Sample answer patterns for reference
  difficulty?: TopicDifficulty;    // Question-specific difficulty
  tags?: string[];                 // Additional tags
  createdBy: string;
  createdAt: string;
}

// Form data for creating/editing topics
export interface CustomTopicFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: TopicDifficulty;
  tags: string[];
  isPublic: boolean;
  linkedLessonIds?: string[];      // Linked Flashcard lesson IDs
}

// Form data for creating/editing questions
export interface CustomTopicQuestionFormData {
  topicId: string;
  folderId?: string;
  questionJa: string;
  questionVi?: string;
  situationContext?: string;
  suggestedAnswers?: string[];
  difficulty?: TopicDifficulty;
  tags?: string[];
}

// Form data for creating/editing folders
export interface CustomTopicFolderFormData {
  topicId: string;
  name: string;
  level: JLPTLevel;
  linkedLessonIds: string[];
}

// Statistics for a topic
export interface CustomTopicStats {
  totalQuestions: number;
  folderCount: number;
  practiceCount: number;           // Times practiced
  avgAccuracy: number;             // Average accuracy across sessions
}

// Default values
export const DEFAULT_TOPIC_FORM: CustomTopicFormData = {
  name: '',
  description: '',
  icon: '📚',
  color: '#3b82f6',
  difficulty: 'mixed',
  tags: [],
  isPublic: false,
  linkedLessonIds: [],
};

export const DEFAULT_QUESTION_FORM: CustomTopicQuestionFormData = {
  topicId: '',
  questionJa: '',
  questionVi: '',
  situationContext: '',
  suggestedAnswers: [],
};

export const DEFAULT_FOLDER_FORM: CustomTopicFolderFormData = {
  topicId: '',
  name: '',
  level: 'N5',
  linkedLessonIds: [],
};

// Difficulty labels in Vietnamese
export const DIFFICULTY_LABELS: Record<TopicDifficulty, { label: string; color: string }> = {
  beginner: { label: 'Cơ bản', color: '#22c55e' },
  intermediate: { label: 'Trung cấp', color: '#f59e0b' },
  advanced: { label: 'Nâng cao', color: '#ef4444' },
  mixed: { label: 'Hỗn hợp', color: '#6366f1' },
};
