// Hook for filtering lessons by visibility (hidden/locked) based on user permissions
// Extracted from App.tsx to enable reuse across pages that need filtered lesson lists

import { useMemo, useCallback } from 'react';
import type { JLPTLevel, Lesson } from '../types/flashcard';
import { useUserData } from '../contexts/user-data-context';
import { useFlashcardData } from '../contexts/flashcard-data-context';

export function useLessonFiltering() {
  const { currentUser, isSuperAdmin, canAccessLocked } = useUserData();
  const { getLessonsByLevel, getChildLessons } = useFlashcardData();

  // Check if user can see hidden lessons (creator or super_admin)
  const canSeeHiddenLesson = useCallback((lesson: Lesson): boolean => {
    if (isSuperAdmin) return true;
    return lesson.createdBy === currentUser?.id;
  }, [isSuperAdmin, currentUser?.id]);

  // Filter hidden/locked lessons for non-authorized users
  const filteredGetLessonsByLevel = useMemo(() => {
    return (level: JLPTLevel): Lesson[] => {
      const lessonList = getLessonsByLevel(level);
      return lessonList.filter(l => {
        if (l.isHidden && !canSeeHiddenLesson(l)) return false;
        if (l.isLocked && !canAccessLocked) return false;
        return true;
      });
    };
  }, [getLessonsByLevel, canAccessLocked, canSeeHiddenLesson]);

  const filteredGetChildLessons = useMemo(() => {
    return (parentId: string): Lesson[] => {
      const lessonList = getChildLessons(parentId);
      return lessonList.filter(l => {
        if (l.isHidden && !canSeeHiddenLesson(l)) return false;
        if (l.isLocked && !canAccessLocked) return false;
        return true;
      });
    };
  }, [getChildLessons, canAccessLocked, canSeeHiddenLesson]);

  return { filteredGetLessonsByLevel, filteredGetChildLessons };
}
