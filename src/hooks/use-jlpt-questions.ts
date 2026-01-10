// Hook for JLPT questions and folders management

import { useState, useEffect, useCallback } from 'react';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTFolder, JLPTLevel, QuestionCategory } from '../types/jlpt-question';
import {
  subscribeToJLPTQuestions,
  addJLPTQuestion as addQuestion,
  updateJLPTQuestion as updateQuestion,
  deleteJLPTQuestion as deleteQuestion,
  subscribeToJLPTFolders,
  addJLPTFolder as addFolder,
  updateJLPTFolder as updateFolder,
  deleteJLPTFolder as deleteFolder,
} from '../services/firestore';

export function useJLPTQuestions() {
  const [questions, setQuestions] = useState<JLPTQuestion[]>([]);
  const [folders, setFolders] = useState<JLPTFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let questionsLoaded = false;
    let foldersLoaded = false;

    const unsubQuestions = subscribeToJLPTQuestions((data) => {
      setQuestions(data);
      questionsLoaded = true;
      if (foldersLoaded) setLoading(false);
    });

    const unsubFolders = subscribeToJLPTFolders((data) => {
      setFolders(data);
      foldersLoaded = true;
      if (questionsLoaded) setLoading(false);
    });

    return () => {
      unsubQuestions();
      unsubFolders();
    };
  }, []);

  // Question functions
  const addJLPTQuestion = useCallback(async (data: JLPTQuestionFormData, createdBy?: string) => {
    return addQuestion(data, createdBy);
  }, []);

  const updateJLPTQuestion = useCallback(async (id: string, data: Partial<JLPTQuestion>) => {
    return updateQuestion(id, data);
  }, []);

  const deleteJLPTQuestion = useCallback(async (id: string) => {
    return deleteQuestion(id);
  }, []);

  // Folder functions
  const addJLPTFolder = useCallback(async (
    name: string,
    level: JLPTLevel,
    category: QuestionCategory,
    createdBy?: string
  ) => {
    return addFolder(name, level, category, createdBy);
  }, []);

  const updateJLPTFolder = useCallback(async (id: string, data: Partial<JLPTFolder>) => {
    return updateFolder(id, data);
  }, []);

  const deleteJLPTFolder = useCallback(async (id: string) => {
    // Also delete questions in this folder
    const questionsInFolder = questions.filter(q => q.folderId === id);
    await Promise.all(questionsInFolder.map(q => deleteQuestion(q.id)));
    return deleteFolder(id);
  }, [questions]);

  // Helper functions
  const getFoldersByLevelAndCategory = useCallback((level: JLPTLevel, category: QuestionCategory) => {
    return folders.filter(f => f.level === level && f.category === category).sort((a, b) => a.order - b.order);
  }, [folders]);

  const getQuestionsByFolder = useCallback((folderId: string) => {
    return questions.filter(q => q.folderId === folderId);
  }, [questions]);

  return {
    questions,
    folders,
    loading,
    addJLPTQuestion,
    updateJLPTQuestion,
    deleteJLPTQuestion,
    addJLPTFolder,
    updateJLPTFolder,
    deleteJLPTFolder,
    getFoldersByLevelAndCategory,
    getQuestionsByFolder,
  };
}
