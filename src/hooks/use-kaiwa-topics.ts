// Hook for managing Kaiwa Advanced Topics
// Provides CRUD operations for custom conversation topics

import { useState, useCallback, useEffect } from 'react';
import type {
  KaiwaAdvancedTopic,
  KaiwaAdvancedQuestion,
  KaiwaAdvancedTopicFormData,
  KaiwaAdvancedQuestionFormData,
  KaiwaVocabulary,
} from '../types/kaiwa-advanced';

const STORAGE_KEY_TOPICS = 'kaiwa-advanced-topics';
const STORAGE_KEY_QUESTIONS = 'kaiwa-advanced-questions';

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface UseKaiwaTopicsOptions {
  currentUserId: string;
}

export function useKaiwaTopics({ currentUserId }: UseKaiwaTopicsOptions) {
  const [topics, setTopics] = useState<KaiwaAdvancedTopic[]>([]);
  const [questions, setQuestions] = useState<KaiwaAdvancedQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedTopics = localStorage.getItem(STORAGE_KEY_TOPICS);
      const savedQuestions = localStorage.getItem(STORAGE_KEY_QUESTIONS);

      if (savedTopics) {
        setTopics(JSON.parse(savedTopics));
      }
      if (savedQuestions) {
        setQuestions(JSON.parse(savedQuestions));
      }
    } catch (error) {
      console.error('Failed to load kaiwa topics:', error);
    }
    setLoading(false);
  }, []);

  // Save topics to localStorage
  const saveTopics = useCallback((newTopics: KaiwaAdvancedTopic[]) => {
    setTopics(newTopics);
    localStorage.setItem(STORAGE_KEY_TOPICS, JSON.stringify(newTopics));
  }, []);

  // Save questions to localStorage
  const saveQuestions = useCallback((newQuestions: KaiwaAdvancedQuestion[]) => {
    setQuestions(newQuestions);
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(newQuestions));
  }, []);

  // ==================== TOPIC CRUD ====================

  // Add new topic
  const addTopic = useCallback(async (data: KaiwaAdvancedTopicFormData): Promise<KaiwaAdvancedTopic | null> => {
    const now = new Date().toISOString();
    const newTopic: KaiwaAdvancedTopic = {
      id: generateId(),
      ...data,
      questionCount: 0,
      createdBy: currentUserId,
      createdAt: now,
      updatedAt: now,
    };

    saveTopics([...topics, newTopic]);
    return newTopic;
  }, [topics, currentUserId, saveTopics]);

  // Update topic
  const updateTopic = useCallback(async (id: string, data: Partial<KaiwaAdvancedTopicFormData>): Promise<boolean> => {
    const index = topics.findIndex(t => t.id === id);
    if (index === -1) return false;

    const updatedTopics = [...topics];
    updatedTopics[index] = {
      ...updatedTopics[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    saveTopics(updatedTopics);
    return true;
  }, [topics, saveTopics]);

  // Delete topic (and all its questions)
  const deleteTopic = useCallback(async (id: string): Promise<boolean> => {
    const filtered = topics.filter(t => t.id !== id);
    const filteredQuestions = questions.filter(q => q.topicId !== id);

    saveTopics(filtered);
    saveQuestions(filteredQuestions);
    return true;
  }, [topics, questions, saveTopics, saveQuestions]);

  // ==================== QUESTION CRUD ====================

  // Add new question
  const addQuestion = useCallback(async (data: KaiwaAdvancedQuestionFormData): Promise<KaiwaAdvancedQuestion | null> => {
    const topicQuestions = questions.filter(q => q.topicId === data.topicId);
    const maxOrder = topicQuestions.length > 0
      ? Math.max(...topicQuestions.map(q => q.order))
      : 0;

    const newQuestion: KaiwaAdvancedQuestion = {
      id: generateId(),
      topicId: data.topicId,
      questionJa: data.questionJa,
      questionVi: data.questionVi,
      situationContext: data.situationContext,
      suggestedAnswers: data.suggestedAnswers || [],
      vocabulary: data.vocabulary || [],
      order: maxOrder + 1,
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
    };

    const newQuestions = [...questions, newQuestion];
    saveQuestions(newQuestions);

    // Update topic question count
    const topic = topics.find(t => t.id === data.topicId);
    if (topic) {
      updateTopic(topic.id, { ...topic, questionCount: topic.questionCount + 1 } as KaiwaAdvancedTopicFormData);
    }

    return newQuestion;
  }, [questions, topics, currentUserId, saveQuestions, updateTopic]);

  // Update question
  const updateQuestion = useCallback(async (id: string, data: Partial<KaiwaAdvancedQuestionFormData>): Promise<boolean> => {
    const index = questions.findIndex(q => q.id === id);
    if (index === -1) return false;

    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      ...data,
    };

    saveQuestions(updatedQuestions);
    return true;
  }, [questions, saveQuestions]);

  // Delete question
  const deleteQuestion = useCallback(async (id: string): Promise<boolean> => {
    const question = questions.find(q => q.id === id);
    if (!question) return false;

    const filtered = questions.filter(q => q.id !== id);
    saveQuestions(filtered);

    // Update topic question count
    const topic = topics.find(t => t.id === question.topicId);
    if (topic) {
      updateTopic(topic.id, { ...topic, questionCount: Math.max(0, topic.questionCount - 1) } as KaiwaAdvancedTopicFormData);
    }

    return true;
  }, [questions, topics, saveQuestions, updateTopic]);

  // ==================== VOCABULARY ====================

  // Add vocabulary to topic
  const addVocabularyToTopic = useCallback(async (topicId: string, vocab: KaiwaVocabulary): Promise<boolean> => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return false;

    const newVocab = { ...vocab, id: vocab.id || generateId() };
    const updatedVocabulary = [...(topic.vocabulary || []), newVocab];

    return updateTopic(topicId, { vocabulary: updatedVocabulary } as Partial<KaiwaAdvancedTopicFormData>);
  }, [topics, updateTopic]);

  // Remove vocabulary from topic
  const removeVocabularyFromTopic = useCallback(async (topicId: string, vocabId: string): Promise<boolean> => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return false;

    const updatedVocabulary = (topic.vocabulary || []).filter(v => v.id !== vocabId);
    return updateTopic(topicId, { vocabulary: updatedVocabulary } as Partial<KaiwaAdvancedTopicFormData>);
  }, [topics, updateTopic]);

  // ==================== QUERIES ====================

  // Get questions for a topic
  const getQuestionsByTopic = useCallback((topicId: string): KaiwaAdvancedQuestion[] => {
    return questions
      .filter(q => q.topicId === topicId)
      .sort((a, b) => a.order - b.order);
  }, [questions]);

  // Get topic by ID
  const getTopicById = useCallback((id: string): KaiwaAdvancedTopic | undefined => {
    return topics.find(t => t.id === id);
  }, [topics]);

  // Get random question from topic
  const getRandomQuestion = useCallback((topicId: string): KaiwaAdvancedQuestion | null => {
    const topicQuestions = getQuestionsByTopic(topicId);
    if (topicQuestions.length === 0) return null;
    return topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
  }, [getQuestionsByTopic]);

  // Get public topics
  const getPublicTopics = useCallback((): KaiwaAdvancedTopic[] => {
    return topics.filter(t => t.isPublic);
  }, [topics]);

  // Get user's topics
  const getUserTopics = useCallback((): KaiwaAdvancedTopic[] => {
    return topics.filter(t => t.createdBy === currentUserId);
  }, [topics, currentUserId]);

  return {
    topics,
    questions,
    loading,
    // Topic CRUD
    addTopic,
    updateTopic,
    deleteTopic,
    // Question CRUD
    addQuestion,
    updateQuestion,
    deleteQuestion,
    // Vocabulary
    addVocabularyToTopic,
    removeVocabularyFromTopic,
    // Queries
    getQuestionsByTopic,
    getTopicById,
    getRandomQuestion,
    getPublicTopics,
    getUserTopics,
  };
}
