import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useJLPTQuestions } from '../hooks/use-jlpt-questions';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTFolder, JLPTLevel, QuestionCategory } from '../types/jlpt-question';

interface JLPTQuestionContextValue {
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
}

const JLPTQuestionContext = createContext<JLPTQuestionContextValue | null>(null);

interface JLPTQuestionProviderProps {
  children: ReactNode;
  levelFilter?: string;
}

export function JLPTQuestionProvider({ children, levelFilter }: JLPTQuestionProviderProps) {
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

  const value = useMemo<JLPTQuestionContextValue>(() => ({
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
  }), [
    jlptQuestions, jlptFolders,
    addJLPTQuestion, updateJLPTQuestion, deleteJLPTQuestion,
    addJLPTFolder, updateJLPTFolder, deleteJLPTFolder,
    getFoldersByLevelAndCategory, getQuestionsByFolder,
  ]);

  return (
    <JLPTQuestionContext.Provider value={value}>
      {children}
    </JLPTQuestionContext.Provider>
  );
}

export function useJLPTQuestionData(): JLPTQuestionContextValue {
  const ctx = useContext(JLPTQuestionContext);
  if (!ctx) {
    throw new Error('useJLPTQuestionData must be used within JLPTQuestionProvider');
  }
  return ctx;
}
