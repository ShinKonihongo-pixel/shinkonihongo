// Hook for managing lessons with Firestore

import { useState, useCallback, useEffect } from 'react';
import type { Lesson, JLPTLevel } from '../types/flashcard';
import * as firestoreService from '../services/firestore';

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestoreService.subscribeToLessons((lessonsData) => {
      setLessons(lessonsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add new lesson (root or child)
  const addLesson = useCallback(async (name: string, jlptLevel: JLPTLevel, parentId: string | null = null, createdBy?: string) => {
    const siblings = parentId
      ? lessons.filter(l => l.parentId === parentId)
      : lessons.filter(l => l.jlptLevel === jlptLevel && l.parentId === null);
    const maxOrder = siblings.length > 0
      ? Math.max(...siblings.map(l => l.order))
      : 0;

    const newLessonData: Omit<Lesson, 'id'> = {
      name,
      jlptLevel,
      parentId,
      order: maxOrder + 1,
      isLocked: false,
      isHidden: false,
      createdBy,
    };

    try {
      const newLesson = await firestoreService.addLesson(newLessonData);
      return newLesson;
    } catch (err) {
      console.error('Error adding lesson:', err);
      throw err;
    }
  }, [lessons]);

  // Toggle lock status (creator/super_admin only)
  const toggleLock = useCallback(async (id: string) => {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    try {
      await firestoreService.updateLesson(id, { isLocked: !lesson.isLocked });
    } catch (err) {
      console.error('Error toggling lock:', err);
      throw err;
    }
  }, [lessons]);

  // Toggle hide status (creator/super_admin only)
  const toggleHide = useCallback(async (id: string) => {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    try {
      await firestoreService.updateLesson(id, { isHidden: !lesson.isHidden });
    } catch (err) {
      console.error('Error toggling hide:', err);
      throw err;
    }
  }, [lessons]);

  // Update lesson
  const updateLesson = useCallback(async (id: string, name: string) => {
    try {
      await firestoreService.updateLesson(id, { name });
    } catch (err) {
      console.error('Error updating lesson:', err);
      throw err;
    }
  }, []);

  // Delete lesson (and all its flashcards)
  const deleteLesson = useCallback(async (id: string) => {
    try {
      await firestoreService.deleteLesson(id);
    } catch (err) {
      console.error('Error deleting lesson:', err);
      throw err;
    }
  }, []);

  // Get root lessons by JLPT level (parentId = null)
  const getLessonsByLevel = useCallback((level: JLPTLevel) => {
    return lessons
      .filter(l => l.jlptLevel === level && l.parentId === null)
      .sort((a, b) => a.order - b.order);
  }, [lessons]);

  // Get child lessons by parent ID
  const getChildLessons = useCallback((parentId: string) => {
    return lessons
      .filter(l => l.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }, [lessons]);

  // Get lesson by ID
  const getLesson = useCallback((id: string | null) => {
    if (!id) return null;
    return lessons.find(l => l.id === id) || null;
  }, [lessons]);

  // Reorder lesson
  const reorderLesson = useCallback(async (id: string, newOrder: number) => {
    try {
      await firestoreService.updateLesson(id, { order: newOrder });
    } catch (err) {
      console.error('Error reordering lesson:', err);
      throw err;
    }
  }, []);

  return {
    lessons,
    loading,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessonsByLevel,
    getChildLessons,
    getLesson,
    reorderLesson,
    toggleLock,
    toggleHide,
  };
}
