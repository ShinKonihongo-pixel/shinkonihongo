import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useCustomTopics } from '../hooks/use-custom-topics';
import type { CustomTopic, CustomTopicQuestion } from '../types/custom-topic';

interface CustomTopicContextValue {
  customTopics: CustomTopic[];
  customTopicQuestions: CustomTopicQuestion[];
  getCustomTopicQuestionsByTopic: (topicId: string) => CustomTopicQuestion[];
}

const CustomTopicContext = createContext<CustomTopicContextValue | null>(null);

interface CustomTopicProviderProps {
  children: ReactNode;
}

export function CustomTopicProvider({ children }: CustomTopicProviderProps) {
  const {
    topics: customTopics,
    questions: customTopicQuestions,
    getQuestionsByTopic: getCustomTopicQuestionsByTopic,
  } = useCustomTopics();

  const value = useMemo<CustomTopicContextValue>(() => ({
    customTopics,
    customTopicQuestions,
    getCustomTopicQuestionsByTopic,
  }), [customTopics, customTopicQuestions, getCustomTopicQuestionsByTopic]);

  return (
    <CustomTopicContext.Provider value={value}>
      {children}
    </CustomTopicContext.Provider>
  );
}

export function useCustomTopicData(): CustomTopicContextValue {
  const ctx = useContext(CustomTopicContext);
  if (!ctx) {
    throw new Error('useCustomTopicData must be used within CustomTopicProvider');
  }
  return ctx;
}
