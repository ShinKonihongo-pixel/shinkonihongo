import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useKaiwaQuestions } from '../hooks/use-kaiwa-questions';
import { useKaiwaTopics } from '../hooks/use-kaiwa-topics';
import type { KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder } from '../types/kaiwa-question';
import type { JLPTLevel, ConversationTopic } from '../types/kaiwa';
import type {
  KaiwaAdvancedTopic,
  KaiwaAdvancedQuestion,
  KaiwaAdvancedTopicFormData,
  KaiwaAdvancedQuestionFormData,
} from '../types/kaiwa-advanced';

interface KaiwaDataContextValue {
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
}

const KaiwaDataContext = createContext<KaiwaDataContextValue | null>(null);

interface KaiwaDataProviderProps {
  children: ReactNode;
  currentUserId: string;
  levelFilter?: string;
}

export function KaiwaDataProvider({ children, currentUserId, levelFilter }: KaiwaDataProviderProps) {
  const {
    questions: kaiwaQuestions,
    folders: kaiwaFolders,
    addKaiwaQuestion,
    updateKaiwaQuestion,
    deleteKaiwaQuestion,
    addKaiwaFolder,
    updateKaiwaFolder,
    deleteKaiwaFolder,
    getFoldersByLevelAndTopic,
    getQuestionsByFolder: getQuestionsByKaiwaFolder,
    getQuestionsByLevelAndTopic,
  } = useKaiwaQuestions(levelFilter);

  const {
    topics: advancedKaiwaTopics,
    questions: advancedKaiwaQuestions,
    addTopic: addAdvancedKaiwaTopic,
    updateTopic: updateAdvancedKaiwaTopic,
    deleteTopic: deleteAdvancedKaiwaTopic,
    addQuestion: addAdvancedKaiwaQuestion,
    updateQuestion: updateAdvancedKaiwaQuestion,
    deleteQuestion: deleteAdvancedKaiwaQuestion,
    getQuestionsByTopic: getAdvancedKaiwaQuestionsByTopic,
  } = useKaiwaTopics({ currentUserId });

  const value = useMemo<KaiwaDataContextValue>(() => ({
    kaiwaQuestions, kaiwaFolders,
    addKaiwaQuestion, updateKaiwaQuestion, deleteKaiwaQuestion,
    addKaiwaFolder, updateKaiwaFolder, deleteKaiwaFolder,
    getFoldersByLevelAndTopic, getQuestionsByKaiwaFolder, getQuestionsByLevelAndTopic,
    advancedKaiwaTopics, advancedKaiwaQuestions,
    addAdvancedKaiwaTopic, updateAdvancedKaiwaTopic, deleteAdvancedKaiwaTopic,
    addAdvancedKaiwaQuestion, updateAdvancedKaiwaQuestion, deleteAdvancedKaiwaQuestion,
    getAdvancedKaiwaQuestionsByTopic,
  }), [
    kaiwaQuestions, kaiwaFolders,
    addKaiwaQuestion, updateKaiwaQuestion, deleteKaiwaQuestion,
    addKaiwaFolder, updateKaiwaFolder, deleteKaiwaFolder,
    getFoldersByLevelAndTopic, getQuestionsByKaiwaFolder, getQuestionsByLevelAndTopic,
    advancedKaiwaTopics, advancedKaiwaQuestions,
    addAdvancedKaiwaTopic, updateAdvancedKaiwaTopic, deleteAdvancedKaiwaTopic,
    addAdvancedKaiwaQuestion, updateAdvancedKaiwaQuestion, deleteAdvancedKaiwaQuestion,
    getAdvancedKaiwaQuestionsByTopic,
  ]);

  return (
    <KaiwaDataContext.Provider value={value}>
      {children}
    </KaiwaDataContext.Provider>
  );
}

export function useKaiwaDataContext(): KaiwaDataContextValue {
  const ctx = useContext(KaiwaDataContext);
  if (!ctx) {
    throw new Error('useKaiwaDataContext must be used within KaiwaDataProvider');
  }
  return ctx;
}
