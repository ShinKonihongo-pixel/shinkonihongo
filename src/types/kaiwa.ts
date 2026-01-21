// Types for Kaiwa (Japanese conversation) assistant feature

export type JapaneseVoiceGender = 'male' | 'female';

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type ConversationStyle = 'casual' | 'polite' | 'formal';

// Send mode for auto/manual control
export type KaiwaSendMode = 'auto' | 'manual';

// Conversation topics
export type ConversationTopic =
  | 'free' // Free conversation
  | 'greetings' // 挨拶
  | 'self_intro' // 自己紹介
  | 'shopping' // 買い物
  | 'restaurant' // レストラン
  | 'travel' // 旅行
  | 'work' // 仕事
  | 'hobbies' // 趣味
  | 'weather' // 天気
  | 'directions'; // 道案内

// Role definition for conversation scenarios
export interface KaiwaRole {
  id: string;
  name: string;        // Japanese name: "店員", "客", "先生"
  nameVi: string;      // Vietnamese translation
  emoji: string;       // Display emoji
}

// Scenario with defined roles
export interface KaiwaScenario {
  id: string;
  topic: ConversationTopic;
  title: string;       // Japanese title
  titleVi: string;     // Vietnamese title
  roles: KaiwaRole[];
  defaultUserRole: string; // ID of default user role
  startRole: string;   // Which role starts the conversation
}

// Conversation metrics for evaluation
export interface KaiwaMetrics {
  totalExchanges: number;
  durationMinutes: number;
  avgPronunciationAccuracy: number;
  pronunciationAttempts: number;
  wordsUsed: Set<string>;
  grammarPatterns: string[];
}

// AI evaluation result
export interface KaiwaEvaluation {
  overallScore: number;           // 1-10
  grammarScore: number;           // 1-10
  vocabularyScore: number;        // 1-10
  pronunciationScore: number;     // 1-10
  fluencyScore: number;           // 1-10
  strengths: string[];            // Japanese with Vietnamese translation
  weaknesses: string[];
  suggestions: string[];
  recommendedLevel: JLPTLevel;
  encouragement: string;          // Personalized message in Vietnamese
}

// Voice information for Japanese TTS
export interface JapaneseVoice {
  voiceURI: string;
  name: string;
  lang: string;
  gender: JapaneseVoiceGender;
}

// Single message in conversation
export interface KaiwaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string; // Vietnamese translation
  timestamp: string;
}

// Vocabulary hint for answer template
export interface VocabularyHint {
  word: string;       // Japanese word (e.g., サッカー)
  meaning: string;    // Vietnamese meaning (e.g., bóng đá)
  reading?: string;   // Hiragana reading if kanji
}

// Suggested answer when assistant asks a question
export interface SuggestedAnswer {
  id: string;
  text: string;
  reading?: string; // Hiragana reading
}

// Answer template with vocabulary hints
export interface AnswerTemplate {
  pattern: string;              // e.g., "...が好きです。"
  hints: VocabularyHint[];      // Words to fill in
  explanation?: string;         // Brief explanation in Vietnamese
}

// Conversation context for AI
export interface KaiwaContext {
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
}

// AI API response (Gemini/Groq compatible)
export interface GeminiKaiwaResponse {
  text: string;
  translation?: string;
  suggestions?: SuggestedAnswer[];
  answerTemplate?: AnswerTemplate;
  suggestedQuestions?: string[]; // Questions user can ask AI back
}

// Pronunciation comparison result
export interface PronunciationDiff {
  expected: string;
  spoken: string;
  position: number;
}

export interface PronunciationResult {
  accuracy: number; // 0-100
  isCorrect: boolean;
  differences: PronunciationDiff[];
  feedback: string;
  expectedText: string;
  spokenText: string;
}
