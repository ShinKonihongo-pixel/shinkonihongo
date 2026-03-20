import { createContext, useContext, type ReactNode } from 'react';
import { useJLPTQuestions } from '../hooks/use-jlpt-questions';
import { useKaiwaQuestions } from '../hooks/use-kaiwa-questions';
import { useKaiwaTopics } from '../hooks/use-kaiwa-topics';
import { useCustomTopics } from '../hooks/use-custom-topics';
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

interface JLPTDataContextValue {
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

const JLPTDataContext = createContext<JLPTDataContextValue | null>(null);

interface JLPTDataProviderProps {
  children: ReactNode;
  currentUserId: string;
  levelFilter?: string; // JLPT level filter — undefined = load all (admin mode)
}

export function JLPTDataProvider({ children, currentUserId, levelFilter }: JLPTDataProviderProps) {
  // JLPT Questions hook — filtered by level for regular users
  const {
    questions: jlptQuestions,
    folders: jlptFolders,
    addJLPTQuestion,
    updateJLPTQuestion,
    deleteJLPTQuestion,
    addJLPTFolder,
    updateJLPTFolder,
    deleteJLPTFolder,
    getFoldersByLevelAndCategory,
    getQuestionsByFolder,
  } = useJLPTQuestions(levelFilter);

  // Kaiwa Questions hook — filtered by level for regular users
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

  // Advanced Kaiwa Topics hook
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

  // Custom Topics hook
  const {
    topics: customTopics,
    questions: customTopicQuestions,
    getQuestionsByTopic: getCustomTopicQuestionsByTopic,
  } = useCustomTopics();

  const value: JLPTDataContextValue = {
    // JLPT Questions
    jlptQuestions,
    jlptFolders,
    addJLPTQuestion,
    updateJLPTQuestion,
    deleteJLPTQuestion,
    addJLPTFolder,
    updateJLPTFolder,
    deleteJLPTFolder,
    getFoldersByLevelAndCategory,
    getQuestionsByFolder,

    // Kaiwa Questions
    kaiwaQuestions,
    kaiwaFolders,
    addKaiwaQuestion,
    updateKaiwaQuestion,
    deleteKaiwaQuestion,
    addKaiwaFolder,
    updateKaiwaFolder,
    deleteKaiwaFolder,
    getFoldersByLevelAndTopic,
    getQuestionsByKaiwaFolder,
    getQuestionsByLevelAndTopic,

    // Advanced Kaiwa Topics
    advancedKaiwaTopics,
    advancedKaiwaQuestions,
    addAdvancedKaiwaTopic,
    updateAdvancedKaiwaTopic,
    deleteAdvancedKaiwaTopic,
    addAdvancedKaiwaQuestion,
    updateAdvancedKaiwaQuestion,
    deleteAdvancedKaiwaQuestion,
    getAdvancedKaiwaQuestionsByTopic,

    // Custom Topics
    customTopics,
    customTopicQuestions,
    getCustomTopicQuestionsByTopic,
  };

  return (
    <JLPTDataContext.Provider value={value}>
      {children}
    </JLPTDataContext.Provider>
  );
}

export function useJLPTData() {
  const ctx = useContext(JLPTDataContext);
  if (!ctx) {
    throw new Error('useJLPTData must be used within JLPTDataProvider');
  }
  return ctx;
}
