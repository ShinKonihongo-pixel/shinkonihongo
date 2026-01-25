// Kaiwa Advanced Session Types - Session Nâng Cao
// Allows creating custom conversation topics with questions and vocabulary

import type { JLPTLevel, ConversationStyle } from './kaiwa';

// Predefined topic icons for quick selection
export const KAIWA_TOPIC_ICONS = [
  '💼', '✈️', '🏥', '🎓', '🏢', '🛒', '📞', '🏠', '👔', '🎌',
  '💻', '📚', '🍣', '🎬', '🗣️', '✍️', '📝', '🏯', '🌸', '👨‍👩‍👧',
  '🚗', '🏨', '📰', '⚽', '🎵', '🎮', '🔬', '⚖️', '💑', '🎎',
] as const;

// Predefined topic colors
export const KAIWA_TOPIC_COLORS = [
  { id: 'blue', value: '#3b82f6', label: 'Xanh dương' },
  { id: 'green', value: '#22c55e', label: 'Xanh lá' },
  { id: 'purple', value: '#a855f7', label: 'Tím' },
  { id: 'orange', value: '#f97316', label: 'Cam' },
  { id: 'red', value: '#ef4444', label: 'Đỏ' },
  { id: 'teal', value: '#14b8a6', label: 'Xanh ngọc' },
  { id: 'indigo', value: '#6366f1', label: 'Chàm' },
  { id: 'pink', value: '#ec4899', label: 'Hồng' },
  { id: 'amber', value: '#f59e0b', label: 'Vàng' },
  { id: 'slate', value: '#64748b', label: 'Xám' },
] as const;

// Predefined topic templates
export const KAIWA_TOPIC_TEMPLATES = [
  { icon: '💼', name: 'Phỏng vấn xin việc', description: 'Luyện tập phỏng vấn tìm việc làm', color: '#3b82f6', level: 'N3' as JLPTLevel },
  { icon: '🏢', name: 'Giao tiếp văn phòng', description: 'Hội thoại trong môi trường công sở', color: '#6366f1', level: 'N3' as JLPTLevel },
  { icon: '🏥', name: 'Khám bệnh', description: 'Giao tiếp tại bệnh viện, phòng khám', color: '#ef4444', level: 'N4' as JLPTLevel },
  { icon: '🏠', name: 'Thuê nhà', description: 'Hỏi đáp về thuê phòng, ký hợp đồng', color: '#22c55e', level: 'N4' as JLPTLevel },
  { icon: '📞', name: 'Gọi điện thoại', description: 'Luyện tập đàm thoại qua điện thoại', color: '#f97316', level: 'N4' as JLPTLevel },
  { icon: '🎓', name: 'Học đường', description: 'Giao tiếp với giáo viên, bạn học', color: '#a855f7', level: 'N5' as JLPTLevel },
  { icon: '✈️', name: 'Du lịch', description: 'Hỏi đường, đặt phòng, mua vé', color: '#14b8a6', level: 'N4' as JLPTLevel },
  { icon: '🛒', name: 'Mua sắm nâng cao', description: 'Thương lượng, đổi trả hàng', color: '#ec4899', level: 'N3' as JLPTLevel },
] as const;

// Vocabulary item for a topic
export interface KaiwaVocabulary {
  id: string;
  word: string;           // Japanese word
  reading?: string;       // Hiragana reading
  meaning: string;        // Vietnamese meaning
  example?: string;       // Example sentence
}

// Question bank item - AI uses these as conversation starters
export interface KaiwaQuestionBankItem {
  id: string;
  questionJa: string;           // Japanese question
  questionVi?: string;          // Vietnamese translation
  level: JLPTLevel;             // Difficulty level
  tags?: string[];              // Optional tags for categorization
}

// Answer bank item - Sample answers for AI to understand context
export interface KaiwaAnswerBankItem {
  id: string;
  answerJa: string;             // Japanese answer
  answerVi?: string;            // Vietnamese translation
  level: JLPTLevel;             // Difficulty level
  tags?: string[];              // Optional tags for categorization
}

// Question in advanced topic
export interface KaiwaAdvancedQuestion {
  id: string;
  topicId: string;
  questionJa: string;           // Japanese question
  questionVi?: string;          // Vietnamese translation
  situationContext?: string;    // Context/situation description
  suggestedAnswers?: string[];  // Sample answers
  vocabulary?: KaiwaVocabulary[]; // Related vocabulary for this question
  order: number;
  createdBy: string;
  createdAt: string;
}

// Advanced Topic - Custom conversation topic
export interface KaiwaAdvancedTopic {
  id: string;
  name: string;                   // Topic name (e.g., "Phỏng vấn xin việc")
  description: string;            // Brief description
  icon: string;                   // Emoji icon
  color: string;                  // Theme color (hex)
  level: JLPTLevel;               // Recommended JLPT level
  style: ConversationStyle;       // Conversation style
  vocabulary: KaiwaVocabulary[];  // Common vocabulary for the topic
  questionBank: KaiwaQuestionBankItem[];  // Question bank - AI conversation starters
  answerBank: KaiwaAnswerBankItem[];      // Answer bank - sample responses
  questionCount: number;          // Cached count
  isPublic: boolean;              // Visible to all users
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Form data for creating/editing topics
export interface KaiwaAdvancedTopicFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  level: JLPTLevel;
  style: ConversationStyle;
  vocabulary: KaiwaVocabulary[];
  questionBank: KaiwaQuestionBankItem[];
  answerBank: KaiwaAnswerBankItem[];
  isPublic: boolean;
}

// Form data for creating/editing questions
export interface KaiwaAdvancedQuestionFormData {
  topicId: string;
  questionJa: string;
  questionVi?: string;
  situationContext?: string;
  suggestedAnswers?: string[];
  vocabulary?: KaiwaVocabulary[];
}

// Default form values
export const DEFAULT_KAIWA_TOPIC_FORM: KaiwaAdvancedTopicFormData = {
  name: '',
  description: '',
  icon: '💬',
  color: '#3b82f6',
  level: 'N4',
  style: 'polite',
  vocabulary: [],
  questionBank: [],
  answerBank: [],
  isPublic: false,
};

export const DEFAULT_KAIWA_QUESTION_FORM: KaiwaAdvancedQuestionFormData = {
  topicId: '',
  questionJa: '',
  questionVi: '',
  situationContext: '',
  suggestedAnswers: [],
  vocabulary: [],
};

// Statistics for a topic
export interface KaiwaTopicStats {
  totalQuestions: number;
  practiceCount: number;
  avgScore: number;
}
