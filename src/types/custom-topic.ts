// Custom Topic Extension Types - 題材拡張
// Custom conversation topics for Kaiwa practice with AI
// Questions are used for conversation prompts, not multiple choice quiz

import type { JLPTLevel } from './kaiwa';

// Difficulty levels for custom topics
export type TopicDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

// Professional topic icon identifiers (Lucide icon names)
export const TOPIC_ICONS = [
  // Business & Work
  'briefcase', 'building-2', 'handshake', 'presentation', 'landmark',
  // Education & Learning
  'graduation-cap', 'book-open', 'library', 'pencil-ruler', 'brain',
  // Technology
  'laptop', 'code-2', 'database', 'globe', 'smartphone',
  // Travel & Culture
  'plane', 'map-pin', 'compass', 'mountain', 'landmark',
  // Health & Life
  'heart-pulse', 'stethoscope', 'home', 'users', 'utensils',
  // Communication
  'message-square', 'mic', 'mail', 'phone', 'video',
  // Creative
  'palette', 'music', 'camera', 'film', 'sparkles',
] as const;

// Map icon names to display labels
export const TOPIC_ICON_LABELS: Record<string, string> = {
  'briefcase': 'Kinh doanh',
  'building-2': 'Công ty',
  'handshake': 'Giao dịch',
  'presentation': 'Thuyết trình',
  'landmark': 'Địa danh',
  'graduation-cap': 'Giáo dục',
  'book-open': 'Sách',
  'library': 'Thư viện',
  'pencil-ruler': 'Học tập',
  'brain': 'Tư duy',
  'laptop': 'Máy tính',
  'code-2': 'Lập trình',
  'database': 'Dữ liệu',
  'globe': 'Toàn cầu',
  'smartphone': 'Di động',
  'plane': 'Du lịch',
  'map-pin': 'Địa điểm',
  'compass': 'Khám phá',
  'mountain': 'Thiên nhiên',
  'heart-pulse': 'Sức khỏe',
  'stethoscope': 'Y tế',
  'home': 'Gia đình',
  'users': 'Xã hội',
  'utensils': 'Ẩm thực',
  'message-square': 'Giao tiếp',
  'mic': 'Nói chuyện',
  'mail': 'Email',
  'phone': 'Điện thoại',
  'video': 'Video',
  'palette': 'Nghệ thuật',
  'music': 'Âm nhạc',
  'camera': 'Nhiếp ảnh',
  'film': 'Phim',
  'sparkles': 'Sáng tạo',
};

// Predefined topic colors with categories
export const TOPIC_COLORS = [
  { id: 'blue', value: '#3b82f6', label: '🔵 Xanh Dương - Chuyên nghiệp' },
  { id: 'indigo', value: '#6366f1', label: '🟣 Chàm - Công nghệ' },
  { id: 'teal', value: '#14b8a6', label: '🩵 Ngọc - Học tập' },
  { id: 'green', value: '#22c55e', label: '🟢 Xanh Lá - Du lịch' },
  { id: 'amber', value: '#f59e0b', label: '🟡 Vàng - Năng lượng' },
  { id: 'orange', value: '#f97316', label: '🟠 Cam - Sáng tạo' },
  { id: 'red', value: '#ef4444', label: '🔴 Đỏ - Quan trọng' },
  { id: 'pink', value: '#ec4899', label: '🩷 Hồng - Văn hóa' },
  { id: 'purple', value: '#a855f7', label: '💜 Tím - Giải trí' },
  { id: 'slate', value: '#64748b', label: '⚪ Xám - Tin tức' },
] as const;

// Removed TOPIC_TEMPLATES - users create topics from scratch

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
  icon: 'book-open',
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
