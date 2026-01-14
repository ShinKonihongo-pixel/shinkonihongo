// Hook for lectures/slideshow management

import { useState, useEffect, useCallback } from 'react';
import type { Lecture, LectureFormData, Slide, SlideFormData } from '../types/lecture';
import * as lectureService from '../services/lecture-firestore';

export function useLectures(isAdmin: boolean = false) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to lectures (all for admin, published only for users)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = isAdmin
      ? lectureService.subscribeToLectures((data) => {
          setLectures(data);
          setLoading(false);
        })
      : lectureService.subscribeToPublishedLectures((data) => {
          setLectures(data);
          setLoading(false);
        });

    return () => unsubscribe();
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

  // Get lecture by ID
  const getLecture = useCallback(async (id: string): Promise<Lecture | null> => {
    try {
      return await lectureService.getLectureById(id);
    } catch (err) {
      console.error('Error getting lecture:', err);
      return null;
    }
  }, []);

  return {
    lectures,
    loading,
    createLecture,
    updateLecture,
    deleteLecture,
    getLecture,
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
