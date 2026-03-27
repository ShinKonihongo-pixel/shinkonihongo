// Props interface for KaiwaSetupView

import type { JLPTLevel, ConversationStyle, ConversationTopic } from '../../../types/kaiwa';
import type { SessionMode } from './kaiwa-types';

export interface KaiwaSetupViewProps {
  // State from hook
  sessionMode: SessionMode;
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  slowMode: boolean;
  questionSelectorState: any;
  selectedDefaultQuestion: any;
  selectedAdvancedTopic: any;
  selectedAdvancedQuestion: any;
  selectedCustomTopic: any;
  selectedScenario: any;
  userRole: string | null;

  // Data
  defaultQuestions: any[];
  advancedTopics: any[];
  customTopics: any[];
  settings: any;

  // Setters
  setSessionMode: (mode: SessionMode) => void;
  setLevel: (level: JLPTLevel) => void;
  setStyle: (style: ConversationStyle) => void;
  setSlowMode: (slow: boolean) => void;
  setQuestionSelectorState: (state: any) => void;
  setSelectedDefaultQuestion: (q: any) => void;
  setSelectedAdvancedTopic: (t: any) => void;
  setSelectedAdvancedQuestion: (q: any) => void;
  setSelectedCustomTopic: (t: any) => void;
  setSelectedCustomQuestion: (q: any) => void;
  setUserRole: (role: string | null) => void;

  // Handlers
  handleTopicChange: (topic: ConversationTopic) => void;
  handleStart: () => void;

  // Computed
  getQuestionsForSelector: () => any[];
  getFoldersForSelector: () => any[];
  getAdvancedQuestionsForTopic: () => any[];
  getCustomQuestionsForTopic: () => any[];

  // Speech support
  recognitionSupported: boolean;
}
