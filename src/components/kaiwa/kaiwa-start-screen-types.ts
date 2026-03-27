// Types for kaiwa-start-screen and sub-components

import type { JLPTLevel, ConversationStyle, ConversationTopic, KaiwaScenario } from '../../types/kaiwa';
import type { KaiwaDefaultQuestion, KaiwaFolder } from '../../types/kaiwa-question';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion } from '../../types/kaiwa-advanced';

// Session mode type
export type SessionMode = 'default' | 'advanced';

// Navigation state for question selector
export type QuestionSelectorState =
  | { type: 'hidden' }
  | { type: 'level' }
  | { type: 'topic'; level: JLPTLevel }
  | { type: 'list'; level: JLPTLevel; topic: ConversationTopic; folderId?: string; folderName?: string };

export interface KaiwaStartScreenProps {
  // Settings
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  slowMode: boolean;
  voiceGender: 'male' | 'female';
  recognitionSupported: boolean;

  // Session mode
  sessionMode: SessionMode;
  onSessionModeChange: (mode: SessionMode) => void;

  // Level/style/topic handlers
  onLevelChange: (level: JLPTLevel) => void;
  onStyleChange: (style: ConversationStyle) => void;
  onTopicChange: (topic: ConversationTopic) => void;
  onSlowModeChange: (enabled: boolean) => void;

  // Default questions
  defaultQuestions: KaiwaDefaultQuestion[];
  questionSelectorState: QuestionSelectorState;
  selectedDefaultQuestion: KaiwaDefaultQuestion | null;
  onQuestionSelectorStateChange: (state: QuestionSelectorState) => void;
  onSelectDefaultQuestion: (question: KaiwaDefaultQuestion | null) => void;
  getFoldersByLevelAndTopic?: (level: JLPTLevel, topic: ConversationTopic) => KaiwaFolder[];
  getQuestionsByFolder?: (folderId: string) => KaiwaDefaultQuestion[];
  getQuestionsByLevelAndTopic?: (level: JLPTLevel, topic: ConversationTopic) => KaiwaDefaultQuestion[];

  // Advanced topics
  advancedTopics: KaiwaAdvancedTopic[];
  advancedQuestions: KaiwaAdvancedQuestion[];
  selectedAdvancedTopic: KaiwaAdvancedTopic | null;
  selectedAdvancedQuestion: KaiwaAdvancedQuestion | null;
  onSelectAdvancedTopic: (topic: KaiwaAdvancedTopic | null) => void;
  onSelectAdvancedQuestion: (question: KaiwaAdvancedQuestion | null) => void;
  getAdvancedQuestionsByTopic?: (topicId: string) => KaiwaAdvancedQuestion[];

  // Scenario/role
  selectedScenario: KaiwaScenario | null;
  userRole: string | null;
  onUserRoleChange: (roleId: string) => void;

  // Actions
  onStart: () => void;
}
