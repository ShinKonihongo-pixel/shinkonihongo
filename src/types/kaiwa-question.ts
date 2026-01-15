// Types for Kaiwa default questions management
// Allows admins to create preset questions for conversation practice

import type { JLPTLevel, ConversationStyle, ConversationTopic } from './kaiwa';

// Folder for organizing Kaiwa questions by level and topic
export interface KaiwaFolder {
  id: string;
  name: string;
  level: JLPTLevel;
  topic: ConversationTopic;
  order: number;
  createdBy?: string;
  createdAt: string;
}

// Default question for Kaiwa practice
export interface KaiwaDefaultQuestion {
  id: string;
  level: JLPTLevel;
  topic: ConversationTopic;
  folderId?: string;
  questionJa: string;           // Japanese question text
  questionVi?: string;          // Vietnamese translation
  situationContext?: string;    // Situation description for context
  suggestedAnswers?: string[];  // Sample answers for reference
  style: ConversationStyle;     // casual/polite/formal
  createdBy?: string;
  createdAt: string;
}

// Form data for adding/editing questions
export interface KaiwaQuestionFormData {
  level: JLPTLevel;
  topic: ConversationTopic;
  folderId?: string;
  questionJa: string;
  questionVi?: string;
  situationContext?: string;
  suggestedAnswers?: string[];
  style: ConversationStyle;
}
