// Student evaluations management hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { StudentEvaluation, EvaluationFormData } from '../../types/classroom';
import type { User } from '../../types/user';
import * as classroomService from '../../services/classroom-firestore';

export function useStudentEvaluations(classroomId: string | null, users: User[]) {
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to evaluations
  useEffect(() => {
    if (!classroomId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEvaluations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = classroomService.subscribeToEvaluations(classroomId, (data) => {
      // Sort by evaluatedAt descending
      data.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
      setEvaluations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classroomId]);

  // Create evaluation
  const createEvaluation = useCallback(async (
    data: EvaluationFormData,
    evaluatorId: string
  ): Promise<StudentEvaluation | null> => {
    if (!classroomId) return null;
    try {
      return await classroomService.createEvaluation(classroomId, data, evaluatorId);
    } catch (err) {
      console.error('Error creating evaluation:', err);
      return null;
    }
  }, [classroomId]);

  // Update evaluation
  const updateEvaluation = useCallback(async (
    evaluationId: string,
    data: Partial<StudentEvaluation>
  ): Promise<boolean> => {
    try {
      await classroomService.updateEvaluation(evaluationId, data);
      return true;
    } catch (err) {
      console.error('Error updating evaluation:', err);
      return false;
    }
  }, []);

  // Delete evaluation
  const deleteEvaluation = useCallback(async (evaluationId: string): Promise<boolean> => {
    try {
      await classroomService.deleteEvaluation(evaluationId);
      return true;
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      return false;
    }
  }, []);

  // Get evaluations with user info
  const evaluationsWithUsers = useMemo(() => {
    return evaluations.map(evaluation => ({
      ...evaluation,
      user: users.find(u => u.id === evaluation.userId),
      evaluator: users.find(u => u.id === evaluation.evaluatorId),
    }));
  }, [evaluations, users]);

  // Get evaluations for a specific user
  const getEvaluationsByUser = useCallback((userId: string): StudentEvaluation[] => {
    return evaluations.filter(e => e.userId === userId);
  }, [evaluations]);

  // Get latest evaluation for each user
  const latestEvaluationByUser = useMemo(() => {
    const map = new Map<string, StudentEvaluation>();
    evaluations.forEach(e => {
      const existing = map.get(e.userId);
      if (!existing || new Date(e.evaluatedAt) > new Date(existing.evaluatedAt)) {
        map.set(e.userId, e);
      }
    });
    return map;
  }, [evaluations]);

  // Calculate average rating for a user
  const getAverageRating = useCallback((userId: string): number => {
    const userEvals = evaluations.filter(e => e.userId === userId);
    if (userEvals.length === 0) return 0;
    const sum = userEvals.reduce((acc, e) => acc + e.overallRating, 0);
    return sum / userEvals.length;
  }, [evaluations]);

  return {
    evaluations,
    evaluationsWithUsers,
    loading,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    getEvaluationsByUser,
    latestEvaluationByUser,
    getAverageRating,
  };
}
