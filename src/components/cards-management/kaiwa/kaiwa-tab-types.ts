// Kaiwa Tab Internal Types
// Shared types and interfaces for kaiwa tab sub-views

import type { ConversationTopic, ConversationStyle } from '../../../types/kaiwa';

export type KaiwaSubTab = 'questions' | 'import' | 'settings' | 'custom_topics';

export interface KaiwaPracticeSettings {
  aiResponseDelay: number; // seconds
  userResponseTime: number; // seconds, 0 = unlimited
  autoSuggestions: boolean;
  voiceEnabled: boolean;
  furiganaDefault: boolean;
  slowModeDefault: boolean;
}

export const DEFAULT_SETTINGS: KaiwaPracticeSettings = {
  aiResponseDelay: 1,
  userResponseTime: 0,
  autoSuggestions: true,
  voiceEnabled: true,
  furiganaDefault: true,
  slowModeDefault: false,
};

export interface ImportResults {
  questions: Array<{
    level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
    topic: ConversationTopic;
    questionJa: string;
    questionVi?: string;
    situationContext?: string;
    suggestedAnswers?: string[];
    style: ConversationStyle;
  }>;
  errors: string[];
}
