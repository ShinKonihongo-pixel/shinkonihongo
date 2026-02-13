// Type definitions for Kaiwa page components
// Extracted from kaiwa-page.tsx

import type { AppSettings } from '../../../hooks/use-settings';
import type { JLPTLevel, ConversationTopic } from '../../../types/kaiwa';
import type { KaiwaDefaultQuestion, KaiwaFolder } from '../../../types/kaiwa-question';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion } from '../../../types/kaiwa-advanced';
import type { CustomTopic, CustomTopicQuestion } from '../../../types/custom-topic';

// Main component props
export interface KaiwaPageProps {
  settings: AppSettings;
  defaultQuestions?: KaiwaDefaultQuestion[];
  kaiwaFolders?: KaiwaFolder[];
  getFoldersByLevelAndTopic?: (level: JLPTLevel, topic: ConversationTopic) => KaiwaFolder[];
  getQuestionsByFolder?: (folderId: string) => KaiwaDefaultQuestion[];
  getQuestionsByLevelAndTopic?: (level: JLPTLevel, topic: ConversationTopic) => KaiwaDefaultQuestion[];
  advancedTopics?: KaiwaAdvancedTopic[];
  advancedQuestions?: KaiwaAdvancedQuestion[];
  getAdvancedQuestionsByTopic?: (topicId: string) => KaiwaAdvancedQuestion[];
  customTopics?: CustomTopic[];
  customTopicQuestions?: CustomTopicQuestion[];
  getCustomTopicQuestionsByTopic?: (topicId: string) => CustomTopicQuestion[];
}

// Session mode type
export type SessionMode = 'default' | 'advanced' | 'custom' | 'speaking';

// Navigation state for question selector
export type QuestionSelectorState =
  | { type: 'hidden' }
  | { type: 'level' }
  | { type: 'topic'; level: JLPTLevel }
  | { type: 'list'; level: JLPTLevel; topic: ConversationTopic; folderId?: string; folderName?: string };
