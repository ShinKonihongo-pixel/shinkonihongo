// Backward-compatible composition of domain-specific sub-contexts.
// Consumers using useJLPTData() continue to work unchanged.
// New consumers can import granular hooks for isolated re-render trees.

import { useMemo, type ReactNode } from 'react';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTFolder, JLPTLevel, QuestionCategory } from '../types/jlpt-question';
import type { KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder } from '../types/kaiwa-question';
import type { ConversationTopic } from '../types/kaiwa';
import type {
  KaiwaAdvancedTopic,
  KaiwaAdvancedQuestion,
  KaiwaAdvancedTopicFormData,
  KaiwaAdvancedQuestionFormData,
} from '../types/kaiwa-advanced';
import type { CustomTopic, CustomTopicQuestion } from '../types/custom-topic';

import { JLPTQuestionProvider, useJLPTQuestionData } from './jlpt-question-context';
import { KaiwaDataProvider, useKaiwaDataContext } from './kaiwa-data-context';
import { CustomTopicProvider, useCustomTopicData } from './custom-topic-context';

// Re-export granular hooks for new consumers
export { useJLPTQuestionData, useKaiwaDataContext, useCustomTopicData };

// ─── Backward-compatible interface ───────────────────────────────────────────

export interface JLPTDataContextValue {
  // JLPT Questions
  jlptQuestions: JLPTQuestion[];
  jlptFolders: JLPTFolder[];
  addJLPTQuestion: (data: JLPTQuestionFormData, createdBy?: string) => Promise<JLPTQuestion | null>;
  updateJLPTQuestion: (id: string, data: Partial<JLPTQuestion>) => Promise<void>;
  deleteJLPTQuestion: (id: string) => Promise<void>;
  addJLPTFolder: (name: string, level: JLPTLevel, category: QuestionCategory, createdBy?: string) => Promise<JLPTFolder | null>;
  updateJLPTFolder: (id: string, data: Partial<JLPTFolder>) => Promise<void>;
  deleteJLPTFolder: (id: string) => Promise<void>;
  getFoldersByLevelAndCategory: (level: JLPTLevel, category: QuestionCategory) => JLPTFolder[];
  getQuestionsByFolder: (folderId: string) => JLPTQuestion[];

  // Kaiwa Questions
  kaiwaQuestions: KaiwaDefaultQuestion[];
  kaiwaFolders: KaiwaFolder[];
  addKaiwaQuestion: (data: KaiwaQuestionFormData, createdBy?: string) => Promise<KaiwaDefaultQuestion | null>;
  updateKaiwaQuestion: (id: string, data: Partial<KaiwaDefaultQuestion>) => Promise<void>;
  deleteKaiwaQuestion: (id: string) => Promise<void>;
  addKaiwaFolder: (name: string, level: JLPTLevel, topic: ConversationTopic, createdBy?: string) => Promise<KaiwaFolder | null>;
  updateKaiwaFolder: (id: string, data: Partial<KaiwaFolder>) => Promise<void>;
  deleteKaiwaFolder: (id: string) => Promise<void>;
  getFoldersByLevelAndTopic: (level: JLPTLevel, topic: ConversationTopic) => KaiwaFolder[];
  getQuestionsByKaiwaFolder: (folderId: string) => KaiwaDefaultQuestion[];
  getQuestionsByLevelAndTopic: (level: JLPTLevel, topic: ConversationTopic) => KaiwaDefaultQuestion[];

  // Advanced Kaiwa Topics
  advancedKaiwaTopics: KaiwaAdvancedTopic[];
  advancedKaiwaQuestions: KaiwaAdvancedQuestion[];
  addAdvancedKaiwaTopic: (data: KaiwaAdvancedTopicFormData) => Promise<KaiwaAdvancedTopic | null>;
  updateAdvancedKaiwaTopic: (id: string, data: Partial<KaiwaAdvancedTopicFormData>) => Promise<boolean>;
  deleteAdvancedKaiwaTopic: (id: string) => Promise<boolean>;
  addAdvancedKaiwaQuestion: (data: KaiwaAdvancedQuestionFormData) => Promise<KaiwaAdvancedQuestion | null>;
  updateAdvancedKaiwaQuestion: (id: string, data: Partial<KaiwaAdvancedQuestionFormData>) => Promise<boolean>;
  deleteAdvancedKaiwaQuestion: (id: string) => Promise<boolean>;
  getAdvancedKaiwaQuestionsByTopic: (topicId: string) => KaiwaAdvancedQuestion[];

  // Custom Topics
  customTopics: CustomTopic[];
  customTopicQuestions: CustomTopicQuestion[];
  getCustomTopicQuestionsByTopic: (topicId: string) => CustomTopicQuestion[];
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface JLPTDataProviderProps {
  children: ReactNode;
  currentUserId: string;
  levelFilter?: string;
}

export function JLPTDataProvider({ children, currentUserId, levelFilter }: JLPTDataProviderProps) {
  return (
    <JLPTQuestionProvider levelFilter={levelFilter}>
      <KaiwaDataProvider currentUserId={currentUserId} levelFilter={levelFilter}>
        <CustomTopicProvider>
          {children}
        </CustomTopicProvider>
      </KaiwaDataProvider>
    </JLPTQuestionProvider>
  );
}

// ─── Backward-compatible aggregate hook ───────────────────────────────────────

export function useJLPTData(): JLPTDataContextValue {
  const jlpt = useJLPTQuestionData();
  const kaiwa = useKaiwaDataContext();
  const custom = useCustomTopicData();

  return useMemo(() => ({
    ...jlpt,
    ...kaiwa,
    ...custom,
  }), [jlpt, kaiwa, custom]);
}
