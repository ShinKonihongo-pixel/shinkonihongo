// Hook for managing exercises - CRUD operations with Firestore

import { useState, useEffect, useCallback } from 'react';
import type { Exercise, ExerciseFormData } from '../types/exercise';
import {
  subscribeToExercises,
  addExercise as addExerciseService,
  updateExercise as updateExerciseService,
  deleteExercise as deleteExerciseService,
} from '../services/firestore/exercise-service';

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to exercises
  useEffect(() => {
    const unsubscribe = subscribeToExercises((data) => {
      setExercises(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addExercise = useCallback(async (data: ExerciseFormData, createdBy: string): Promise<Exercise | null> => {
    try {
      return await addExerciseService(data, createdBy);
    } catch (error) {
      console.error('Error adding exercise:', error);
      return null;
    }
  }, []);

  const updateExercise = useCallback(async (id: string, data: Partial<Exercise>): Promise<boolean> => {
    try {
      await updateExerciseService(id, data);
      return true;
    } catch (error) {
      console.error('Error updating exercise:', error);
      return false;
    }
  }, []);

  const deleteExercise = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteExerciseService(id);
      return true;
    } catch (error) {
      console.error('Error deleting exercise:', error);
      return false;
    }
  }, []);

  const togglePublish = useCallback(async (id: string): Promise<boolean> => {
    const exercise = exercises.find(e => e.id === id);
    if (!exercise) return false;
    return updateExercise(id, { isPublished: !exercise.isPublished });
  }, [exercises, updateExercise]);

  // Get published exercises for users
  const getPublishedExercises = useCallback(() => {
    return exercises.filter(e => e.isPublished);
  }, [exercises]);

  // Get exercises by level
  const getExercisesByLevel = useCallback((level: string) => {
    return exercises.filter(e => e.jlptLevel === level);
  }, [exercises]);

  return {
    exercises,
    loading,
    addExercise,
    updateExercise,
    deleteExercise,
    togglePublish,
    getPublishedExercises,
    getExercisesByLevel,
  };
}
