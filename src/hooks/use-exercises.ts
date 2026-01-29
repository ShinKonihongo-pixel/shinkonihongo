// Hook for managing exercises - CRUD operations with Firestore

import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Exercise, ExerciseFormData } from '../types/exercise';

const COLLECTION = 'exercises';

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to exercises
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Exercise[];
      setExercises(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addExercise = useCallback(async (data: ExerciseFormData, createdBy: string): Promise<Exercise | null> => {
    try {
      const newExercise = {
        ...data,
        createdBy,
        createdAt: new Date().toISOString(),
        isPublished: false,
      };
      const docRef = await addDoc(collection(db, COLLECTION), newExercise);
      return { id: docRef.id, ...newExercise };
    } catch (error) {
      console.error('Error adding exercise:', error);
      return null;
    }
  }, []);

  const updateExercise = useCallback(async (id: string, data: Partial<Exercise>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, COLLECTION, id), data);
      return true;
    } catch (error) {
      console.error('Error updating exercise:', error);
      return false;
    }
  }, []);

  const deleteExercise = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
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
