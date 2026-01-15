// Hook for Kaiwa default questions and folders management

import { useState, useEffect, useCallback } from 'react';
import type { KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder } from '../types/kaiwa-question';
import type { JLPTLevel, ConversationTopic } from '../types/kaiwa';
import {
  subscribeToKaiwaQuestions,
  addKaiwaQuestion as addQuestion,
  updateKaiwaQuestion as updateQuestion,
  deleteKaiwaQuestion as deleteQuestion,
  subscribeToKaiwaFolders,
  addKaiwaFolder as addFolder,
  updateKaiwaFolder as updateFolder,
  deleteKaiwaFolder as deleteFolder,
} from '../services/firestore';

export function useKaiwaQuestions() {
  const [questions, setQuestions] = useState<KaiwaDefaultQuestion[]>([]);
  const [folders, setFolders] = useState<KaiwaFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let questionsLoaded = false;
    let foldersLoaded = false;

    const unsubQuestions = subscribeToKaiwaQuestions((data) => {
      setQuestions(data);
      questionsLoaded = true;
      if (foldersLoaded) setLoading(false);
    });

    const unsubFolders = subscribeToKaiwaFolders((data) => {
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
  const addKaiwaQuestion = useCallback(async (data: KaiwaQuestionFormData, createdBy?: string) => {
    return addQuestion(data, createdBy);
  }, []);

  const updateKaiwaQuestion = useCallback(async (id: string, data: Partial<KaiwaDefaultQuestion>) => {
    return updateQuestion(id, data);
  }, []);

  const deleteKaiwaQuestion = useCallback(async (id: string) => {
    return deleteQuestion(id);
  }, []);

  // Folder functions
  const addKaiwaFolder = useCallback(async (
    name: string,
    level: JLPTLevel,
    topic: ConversationTopic,
    createdBy?: string
  ) => {
    return addFolder(name, level, topic, createdBy);
  }, []);

  const updateKaiwaFolder = useCallback(async (id: string, data: Partial<KaiwaFolder>) => {
    return updateFolder(id, data);
  }, []);

  const deleteKaiwaFolder = useCallback(async (id: string) => {
    // Also delete questions in this folder
    const questionsInFolder = questions.filter(q => q.folderId === id);
    await Promise.all(questionsInFolder.map(q => deleteQuestion(q.id)));
    return deleteFolder(id);
  }, [questions]);

  // Helper functions
  const getFoldersByLevelAndTopic = useCallback((level: JLPTLevel, topic: ConversationTopic) => {
    return folders.filter(f => f.level === level && f.topic === topic).sort((a, b) => a.order - b.order);
  }, [folders]);

  const getQuestionsByFolder = useCallback((folderId: string) => {
    return questions.filter(q => q.folderId === folderId);
  }, [questions]);

  const getQuestionsByLevelAndTopic = useCallback((level: JLPTLevel, topic: ConversationTopic) => {
    return questions.filter(q => q.level === level && q.topic === topic && !q.folderId);
  }, [questions]);

  return {
    questions,
    folders,
    loading,
    addKaiwaQuestion,
    updateKaiwaQuestion,
    deleteKaiwaQuestion,
    addKaiwaFolder,
    updateKaiwaFolder,
    deleteKaiwaFolder,
    getFoldersByLevelAndTopic,
    getQuestionsByFolder,
    getQuestionsByLevelAndTopic,
  };
}
