// Hook for Custom Topics management - 題材拡張

import { useState, useEffect, useCallback } from 'react';
import type { CustomTopic, CustomTopicFolder, CustomTopicQuestion, CustomTopicFormData, CustomTopicQuestionFormData } from '../types/custom-topic';
import type { JLPTLevel } from '../types/kaiwa';
import {
  subscribeToCustomTopics,
  addCustomTopic as addTopic,
  updateCustomTopic as updateTopic,
  deleteCustomTopic as deleteTopic,
  subscribeToCustomTopicFolders,
  addCustomTopicFolder as addFolder,
  updateCustomTopicFolder as updateFolder,
  deleteCustomTopicFolder as deleteFolder,
  subscribeToCustomTopicQuestions,
  addCustomTopicQuestion as addQuestion,
  updateCustomTopicQuestion as updateQuestion,
  deleteCustomTopicQuestion as deleteQuestion,
} from '../services/firestore';

export function useCustomTopics() {
  const [topics, setTopics] = useState<CustomTopic[]>([]);
  const [folders, setFolders] = useState<CustomTopicFolder[]>([]);
  const [questions, setQuestions] = useState<CustomTopicQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let topicsLoaded = false;
    let foldersLoaded = false;
    let questionsLoaded = false;

    const checkAllLoaded = () => {
      if (topicsLoaded && foldersLoaded && questionsLoaded) {
        setLoading(false);
      }
    };

    const unsubTopics = subscribeToCustomTopics((data) => {
      setTopics(data);
      topicsLoaded = true;
      checkAllLoaded();
    });

    const unsubFolders = subscribeToCustomTopicFolders((data) => {
      setFolders(data);
      foldersLoaded = true;
      checkAllLoaded();
    });

    const unsubQuestions = subscribeToCustomTopicQuestions((data) => {
      setQuestions(data);
      questionsLoaded = true;
      checkAllLoaded();
    });

    return () => {
      unsubTopics();
      unsubFolders();
      unsubQuestions();
    };
  }, []);

  // Topic CRUD
  const addCustomTopic = useCallback(async (data: CustomTopicFormData, createdBy: string): Promise<CustomTopic | null> => {
    try {
      return await addTopic(data, createdBy);
    } catch (error) {
      console.error('Error adding custom topic:', error);
      return null;
    }
  }, []);

  const updateCustomTopic = useCallback(async (id: string, data: Partial<CustomTopicFormData>): Promise<boolean> => {
    try {
      await updateTopic(id, data);
      return true;
    } catch (error) {
      console.error('Error updating custom topic:', error);
      return false;
    }
  }, []);

  const deleteCustomTopic = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteTopic(id);
      return true;
    } catch (error) {
      console.error('Error deleting custom topic:', error);
      return false;
    }
  }, []);

  // Folder CRUD
  const addCustomTopicFolder = useCallback(async (topicId: string, name: string, createdBy: string, level: JLPTLevel = 'N5'): Promise<CustomTopicFolder | null> => {
    try {
      return await addFolder(topicId, name, createdBy, level);
    } catch (error) {
      console.error('Error adding custom topic folder:', error);
      return null;
    }
  }, []);

  const updateCustomTopicFolder = useCallback(async (id: string, name: string): Promise<boolean> => {
    try {
      await updateFolder(id, name);
      return true;
    } catch (error) {
      console.error('Error updating custom topic folder:', error);
      return false;
    }
  }, []);

  const deleteCustomTopicFolder = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteFolder(id);
      return true;
    } catch (error) {
      console.error('Error deleting custom topic folder:', error);
      return false;
    }
  }, []);

  // Question CRUD
  const addCustomTopicQuestion = useCallback(async (data: CustomTopicQuestionFormData, createdBy: string): Promise<CustomTopicQuestion | null> => {
    try {
      return await addQuestion(data, createdBy);
    } catch (error) {
      console.error('Error adding custom topic question:', error);
      return null;
    }
  }, []);

  const updateCustomTopicQuestion = useCallback(async (id: string, data: Partial<CustomTopicQuestionFormData>): Promise<boolean> => {
    try {
      await updateQuestion(id, data);
      return true;
    } catch (error) {
      console.error('Error updating custom topic question:', error);
      return false;
    }
  }, []);

  const deleteCustomTopicQuestion = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteQuestion(id);
      return true;
    } catch (error) {
      console.error('Error deleting custom topic question:', error);
      return false;
    }
  }, []);

  // Helper functions
  const getTopicById = useCallback((id: string) => {
    return topics.find(t => t.id === id);
  }, [topics]);

  const getFoldersByTopic = useCallback((topicId: string) => {
    return folders.filter(f => f.topicId === topicId).sort((a, b) => a.order - b.order);
  }, [folders]);

  const getQuestionsByTopic = useCallback((topicId: string) => {
    return questions.filter(q => q.topicId === topicId);
  }, [questions]);

  const getQuestionsByFolder = useCallback((folderId: string) => {
    return questions.filter(q => q.folderId === folderId);
  }, [questions]);

  const getUnfolderedQuestions = useCallback((topicId: string) => {
    return questions.filter(q => q.topicId === topicId && !q.folderId);
  }, [questions]);

  const getPublicTopics = useCallback(() => {
    return topics.filter(t => t.isPublic);
  }, [topics]);

  const getTopicsByUser = useCallback((userId: string) => {
    return topics.filter(t => t.createdBy === userId);
  }, [topics]);

  return {
    // Data
    topics,
    folders,
    questions,
    loading,

    // Topic CRUD
    addCustomTopic,
    updateCustomTopic,
    deleteCustomTopic,

    // Folder CRUD
    addCustomTopicFolder,
    updateCustomTopicFolder,
    deleteCustomTopicFolder,

    // Question CRUD
    addCustomTopicQuestion,
    updateCustomTopicQuestion,
    deleteCustomTopicQuestion,

    // Helpers
    getTopicById,
    getFoldersByTopic,
    getQuestionsByTopic,
    getQuestionsByFolder,
    getUnfolderedQuestions,
    getPublicTopics,
    getTopicsByUser,
  };
}
