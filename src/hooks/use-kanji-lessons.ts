// Hook for managing kanji lessons (separate from vocabulary/grammar lessons)

import { useState, useEffect, useCallback } from 'react';
import type { KanjiLesson } from '../types/kanji';
import type { JLPTLevel } from '../types/flashcard';
import * as firestoreService from '../services/firestore';

export function useKanjiLessons() {
  const [lessons, setLessons] = useState<KanjiLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToKanjiLessons((data) => {
      const sorted = data.sort((a, b) => a.order - b.order);
      setLessons(sorted);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getParentLessonsByLevel = useCallback((level: JLPTLevel) => {
    return lessons.filter(l => l.jlptLevel === level && l.parentId === null);
  }, [lessons]);

  const getChildLessons = useCallback((parentId: string) => {
    return lessons.filter(l => l.parentId === parentId);
  }, [lessons]);

  const hasChildren = useCallback((lessonId: string) => {
    return lessons.some(l => l.parentId === lessonId);
  }, [lessons]);

  const getLessonCountByLevel = useCallback((level: JLPTLevel) => {
    return lessons.filter(l => l.jlptLevel === level && l.parentId === null).length;
  }, [lessons]);

  const addLesson = useCallback(async (
    name: string,
    level: JLPTLevel,
    parentId: string | null,
    createdBy: string
  ): Promise<KanjiLesson> => {
    const siblings = parentId
      ? lessons.filter(l => l.parentId === parentId)
      : lessons.filter(l => l.jlptLevel === level && l.parentId === null);
    const maxOrder = siblings.length > 0
      ? Math.max(...siblings.map(l => l.order))
      : 0;

    const data: Omit<KanjiLesson, 'id'> = {
      name,
      jlptLevel: level,
      parentId,
      order: maxOrder + 1,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    return await firestoreService.addKanjiLesson(data);
  }, [lessons]);

  const updateLesson = useCallback(async (id: string, name: string) => {
    await firestoreService.updateKanjiLesson(id, { name });
  }, []);

  const deleteLesson = useCallback(async (id: string) => {
    const children = lessons.filter(l => l.parentId === id);
    for (const child of children) {
      await firestoreService.deleteKanjiLesson(child.id);
    }
    await firestoreService.deleteKanjiLesson(id);
  }, [lessons]);

  const reorderLessons = useCallback(async (
    reorderedLessons: { id: string; order: number }[]
  ): Promise<void> => {
    await Promise.all(
      reorderedLessons.map(({ id, order }) =>
        firestoreService.updateKanjiLesson(id, { order })
      )
    );
  }, []);

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
      const existing = lessons.find(
        l => l.name === lessonName && l.jlptLevel === level && l.parentId === null
      );
      if (existing) continue;

      const parent = await addLesson(lessonName, level, null, createdBy);
      created++;

      for (const folderName of childFolders) {
        await firestoreService.addKanjiLesson({
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
