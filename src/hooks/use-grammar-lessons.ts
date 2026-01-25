// Hook for managing grammar lessons (separate from vocabulary lessons)

import { useState, useEffect, useCallback } from 'react';
import type { GrammarLesson, JLPTLevel } from '../types/flashcard';
import * as firestoreService from '../services/firestore';

export function useGrammarLessons() {
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to grammar lessons
  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToGrammarLessons((data) => {
      // Sort by order
      const sorted = data.sort((a, b) => a.order - b.order);
      setLessons(sorted);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Get parent lessons by level (no parentId)
  const getParentLessonsByLevel = useCallback((level: JLPTLevel) => {
    return lessons.filter(l => l.jlptLevel === level && l.parentId === null);
  }, [lessons]);

  // Get child lessons by parent ID
  const getChildLessons = useCallback((parentId: string) => {
    return lessons.filter(l => l.parentId === parentId);
  }, [lessons]);

  // Check if lesson has children
  const hasChildren = useCallback((lessonId: string) => {
    return lessons.some(l => l.parentId === lessonId);
  }, [lessons]);

  // Get lesson count by level
  const getLessonCountByLevel = useCallback((level: JLPTLevel) => {
    return lessons.filter(l => l.jlptLevel === level && l.parentId === null).length;
  }, [lessons]);

  // Add lesson
  const addLesson = useCallback(async (
    name: string,
    level: JLPTLevel,
    parentId: string | null,
    createdBy: string
  ): Promise<GrammarLesson> => {
    // Get next order number
    const siblings = parentId
      ? lessons.filter(l => l.parentId === parentId)
      : lessons.filter(l => l.jlptLevel === level && l.parentId === null);
    const maxOrder = siblings.length > 0
      ? Math.max(...siblings.map(l => l.order))
      : 0;

    const data: Omit<GrammarLesson, 'id'> = {
      name,
      jlptLevel: level,
      parentId,
      order: maxOrder + 1,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    return await firestoreService.addGrammarLesson(data);
  }, [lessons]);

  // Update lesson
  const updateLesson = useCallback(async (id: string, name: string) => {
    await firestoreService.updateGrammarLesson(id, { name });
  }, []);

  // Delete lesson (will also delete child lessons and their cards)
  const deleteLesson = useCallback(async (id: string) => {
    // First delete all children
    const children = lessons.filter(l => l.parentId === id);
    for (const child of children) {
      await firestoreService.deleteGrammarLesson(child.id);
    }
    // Then delete the lesson itself
    await firestoreService.deleteGrammarLesson(id);
  }, [lessons]);

  // Reorder lessons (swap positions)
  const reorderLessons = useCallback(async (
    reorderedLessons: { id: string; order: number }[]
  ): Promise<void> => {
    // Update all lessons in parallel
    await Promise.all(
      reorderedLessons.map(({ id, order }) =>
        firestoreService.updateGrammarLesson(id, { order })
      )
    );
  }, []);

  // Seed lessons for a level
  const seedLessons = useCallback(async (
    level: JLPTLevel,
    startNum: number,
    endNum: number,
    childFolders: string[],
    createdBy: string
  ): Promise<number> => {
    let created = 0;

    for (let i = startNum; i <= endNum; i++) {
      const lessonName = `Bài ${i}`;

      // Check if already exists
      const existing = lessons.find(
        l => l.name === lessonName && l.jlptLevel === level && l.parentId === null
      );
      if (existing) continue;

      // Create parent lesson
      const parent = await addLesson(lessonName, level, null, createdBy);
      created++;

      // Create child folders
      for (const folderName of childFolders) {
        await firestoreService.addGrammarLesson({
          name: folderName,
          jlptLevel: level,
          parentId: parent.id,
          order: childFolders.indexOf(folderName) + 1,
          createdBy,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return created;
  }, [lessons, addLesson]);

  return {
    lessons,
    loading,
    getParentLessonsByLevel,
    getChildLessons,
    hasChildren,
    getLessonCountByLevel,
    addLesson,
    updateLesson,
    deleteLesson,
    seedLessons,
    reorderLessons,
  };
}
