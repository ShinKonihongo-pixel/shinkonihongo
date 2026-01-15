// Hook for lectures/slideshow management

import { useState, useEffect, useCallback } from 'react';
import type { Lecture, LectureFormData, Slide, SlideFormData, LectureFolder } from '../types/lecture';
import type { JLPTLevel } from '../types/flashcard';
import * as lectureService from '../services/lecture-firestore';

export function useLectures(isAdmin: boolean = false) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lectureFolders, setLectureFolders] = useState<LectureFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to lectures (all for admin, published only for users)
  useEffect(() => {
    setLoading(true);
    const unsubscribeLectures = isAdmin
      ? lectureService.subscribeToLectures((data) => {
          setLectures(data);
          setLoading(false);
        })
      : lectureService.subscribeToPublishedLectures((data) => {
          setLectures(data);
          setLoading(false);
        });

    // Subscribe to folders (only for admin)
    const unsubscribeFolders = isAdmin
      ? lectureService.subscribeToLectureFolders((data) => {
          setLectureFolders(data);
        })
      : () => {};

    return () => {
      unsubscribeLectures();
      if (isAdmin) unsubscribeFolders();
    };
  }, [isAdmin]);

  // Create lecture
  const createLecture = useCallback(async (
    data: LectureFormData,
    authorId: string,
    authorName: string
  ): Promise<Lecture | null> => {
    try {
      return await lectureService.addLecture(data, authorId, authorName);
    } catch (err) {
      console.error('Error creating lecture:', err);
      return null;
    }
  }, []);

  // Update lecture
  const updateLecture = useCallback(async (
    id: string,
    data: Partial<Lecture>
  ): Promise<boolean> => {
    try {
      await lectureService.updateLecture(id, data);
      return true;
    } catch (err) {
      console.error('Error updating lecture:', err);
      return false;
    }
  }, []);

  // Delete lecture
  const deleteLecture = useCallback(async (id: string): Promise<boolean> => {
    try {
      await lectureService.deleteLecture(id);
      return true;
    } catch (err) {
      console.error('Error deleting lecture:', err);
      return false;
    }
  }, []);

  // Toggle hide status (creator/super_admin only)
  const toggleHide = useCallback(async (id: string): Promise<boolean> => {
    const lecture = lectures.find(l => l.id === id);
    if (!lecture) return false;

    try {
      await lectureService.updateLecture(id, { isHidden: !lecture.isHidden });
      return true;
    } catch (err) {
      console.error('Error toggling hide:', err);
      return false;
    }
  }, [lectures]);

  // Get lecture by ID
  const getLecture = useCallback(async (id: string): Promise<Lecture | null> => {
    try {
      return await lectureService.getLectureById(id);
    } catch (err) {
      console.error('Error getting lecture:', err);
      return null;
    }
  }, []);

  // Folder management
  const addFolder = useCallback(async (
    name: string,
    level: JLPTLevel,
    createdBy: string
  ): Promise<LectureFolder | null> => {
    try {
      return await lectureService.addLectureFolder(name, level, createdBy);
    } catch (err) {
      console.error('Error adding folder:', err);
      return null;
    }
  }, []);

  const updateFolder = useCallback(async (
    id: string,
    data: Partial<LectureFolder>
  ): Promise<boolean> => {
    try {
      await lectureService.updateLectureFolder(id, data);
      return true;
    } catch (err) {
      console.error('Error updating folder:', err);
      return false;
    }
  }, []);

  const deleteFolder = useCallback(async (id: string): Promise<boolean> => {
    try {
      await lectureService.deleteLectureFolder(id);
      return true;
    } catch (err) {
      console.error('Error deleting folder:', err);
      return false;
    }
  }, []);

  // Helper functions
  const getFoldersByLevel = useCallback((level: JLPTLevel): LectureFolder[] => {
    return lectureService.getLectureFoldersByLevel(lectureFolders, level);
  }, [lectureFolders]);

  const getLecturesByFolder = useCallback((folderId: string): Lecture[] => {
    return lectureService.getLecturesByFolder(lectures, folderId);
  }, [lectures]);

  const getLecturesByLevel = useCallback((level: JLPTLevel): Lecture[] => {
    return lectureService.getLecturesByLevel(lectures, level);
  }, [lectures]);

  return {
    lectures,
    lectureFolders,
    loading,
    createLecture,
    updateLecture,
    deleteLecture,
    toggleHide,
    getLecture,
    addFolder,
    updateFolder,
    deleteFolder,
    getFoldersByLevel,
    getLecturesByFolder,
    getLecturesByLevel,
  };
}

// Hook for slides of a specific lecture
export function useSlides(lectureId: string | null) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lectureId) {
      setSlides([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = lectureService.subscribeToSlides(lectureId, (data) => {
      setSlides(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [lectureId]);

  // Add slide
  const addSlide = useCallback(async (data: SlideFormData): Promise<Slide | null> => {
    if (!lectureId) return null;
    try {
      const order = slides.length;
      return await lectureService.addSlide(lectureId, data, order);
    } catch (err) {
      console.error('Error adding slide:', err);
      return null;
    }
  }, [lectureId, slides.length]);

  // Update slide
  const updateSlide = useCallback(async (
    slideId: string,
    data: Partial<Slide>
  ): Promise<boolean> => {
    try {
      await lectureService.updateSlide(slideId, data);
      return true;
    } catch (err) {
      console.error('Error updating slide:', err);
      return false;
    }
  }, []);

  // Delete slide
  const deleteSlide = useCallback(async (slideId: string): Promise<boolean> => {
    if (!lectureId) return false;
    try {
      await lectureService.deleteSlide(slideId, lectureId);
      return true;
    } catch (err) {
      console.error('Error deleting slide:', err);
      return false;
    }
  }, [lectureId]);

  // Reorder slides
  const reorderSlides = useCallback(async (
    orderedSlides: { id: string; order: number }[]
  ): Promise<boolean> => {
    try {
      await lectureService.reorderSlides(orderedSlides);
      return true;
    } catch (err) {
      console.error('Error reordering slides:', err);
      return false;
    }
  }, []);

  // Duplicate slide
  const duplicateSlide = useCallback(async (slideId: string): Promise<Slide | null> => {
    if (!lectureId) return null;
    try {
      const slideToDuplicate = slides.find(s => s.id === slideId);
      if (!slideToDuplicate) return null;

      const newSlideData: SlideFormData = {
        layout: slideToDuplicate.layout,
        title: slideToDuplicate.title ? `${slideToDuplicate.title} (copy)` : 'Copy',
        elements: slideToDuplicate.elements.map(el => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
        backgroundColor: slideToDuplicate.backgroundColor,
        backgroundImage: slideToDuplicate.backgroundImage,
        notes: slideToDuplicate.notes,
      };

      const order = slides.length;
      return await lectureService.addSlide(lectureId, newSlideData, order);
    } catch (err) {
      console.error('Error duplicating slide:', err);
      return null;
    }
  }, [lectureId, slides]);

  return {
    slides,
    loading,
    addSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    duplicateSlide,
  };
}

// Hook for tracking lecture views
export function useLectureView(lectureId: string | null, userId: string | null) {
  const recordView = useCallback(async (
    lastSlideViewed: number,
    completed: boolean
  ): Promise<void> => {
    if (!lectureId || !userId) return;
    try {
      await lectureService.recordLectureView(lectureId, userId, lastSlideViewed, completed);
    } catch (err) {
      console.error('Error recording view:', err);
    }
  }, [lectureId, userId]);

  return { recordView };
}
