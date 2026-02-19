import { useState, useEffect, useCallback } from 'react';
import type { CustomGoldenBellQuestion } from '../../types/golden-bell';
import {
  createCustomQuestion,
  updateCustomQuestion,
  deleteCustomQuestion,
  subscribeToCustomQuestions,
} from '../../services/golden-bell-questions';

export function useCustomQuestions() {
  const [questions, setQuestions] = useState<CustomGoldenBellQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = subscribeToCustomQuestions((qs) => {
      setQuestions(qs);
      setLoading(false);
    });
    return unsub;
  }, []);

  const create = useCallback(async (data: Omit<CustomGoldenBellQuestion, 'id'>) => {
    return createCustomQuestion(data);
  }, []);

  const update = useCallback(async (id: string, data: Partial<CustomGoldenBellQuestion>) => {
    return updateCustomQuestion(id, data);
  }, []);

  const remove = useCallback(async (id: string) => {
    return deleteCustomQuestion(id);
  }, []);

  return {
    questions,
    loading,
    createQuestion: create,
    updateQuestion: update,
    deleteQuestion: remove,
  };
}
