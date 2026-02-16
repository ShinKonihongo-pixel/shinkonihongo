// React effects for editor

import { useEffect } from 'react';
import type { Lecture } from '../../../types/lecture';
import type { Slide, SlideFormData } from '../../../types/lecture';
import type { LectureFormState } from './types';

// Load existing lecture
export function useLoadLecture(
  lectureId: string | undefined,
  setCurrentLectureId: (id: string | null) => void,
  getLecture: (id: string) => Promise<Lecture | null>,
  setLectureForm: (form: LectureFormState) => void
) {
  useEffect(() => {
    if (lectureId && lectureId !== 'new') {
      setCurrentLectureId(lectureId);
      getLecture(lectureId).then((lecture) => {
        if (lecture) {
          setLectureForm({
            title: lecture.title,
            description: lecture.description || '',
            coverImage: lecture.coverImage || '',
            jlptLevel: lecture.jlptLevel,
            isPublished: lecture.isPublished,
            folderId: lecture.folderId,
          });
        }
      });
    }
  }, [lectureId, getLecture, setCurrentLectureId, setLectureForm]);
}

// Sync selected slide with slides array
export function useSyncSlide(
  slides: Slide[],
  selectedSlideIndex: number,
  hasUnsavedChanges: boolean,
  slidesLoading: boolean,
  setEditingSlide: (slide: SlideFormData | null) => void,
  setSelectedSlideIndex: (idx: number) => void
) {
  useEffect(() => {
    if (slides.length > 0 && selectedSlideIndex >= 0) {
      const idx = Math.min(selectedSlideIndex, slides.length - 1);
      const slide = slides[idx];

      if (slide && !hasUnsavedChanges) {
        setEditingSlide({
          layout: slide.layout,
          title: slide.title || '',
          elements: slide.elements ? [...slide.elements] : [],
          backgroundColor: slide.backgroundColor || '#ffffff',
          backgroundImage: slide.backgroundImage,
          notes: slide.notes,
          animation: slide.animation || 'none',
          transition: slide.transition || 'fade',
          animationDuration: slide.animationDuration || 500,
        });
        if (idx !== selectedSlideIndex) {
          setSelectedSlideIndex(idx);
        }
      }
    } else if (slides.length === 0 && !slidesLoading) {
      setEditingSlide(null);
    }
  }, [slides, selectedSlideIndex, hasUnsavedChanges, slidesLoading, setEditingSlide, setSelectedSlideIndex]);
}
