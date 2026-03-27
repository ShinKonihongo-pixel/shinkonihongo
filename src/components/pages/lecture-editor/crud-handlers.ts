// CRUD operations for lectures and slides

import { useCallback } from 'react';
import type { LectureFormData, SlideFormData, Slide, Lecture } from '../../../types/lecture';
import type { PPTXImportOptions } from '../../../types/pptx';
import type { LectureFormState, DeleteSlideConfirm } from './types';

// Lecture operations
export function useLectureHandlers(
  currentLectureId: string | null,
  lectureForm: LectureFormState,
  currentUser: any,
  isNew: boolean,
  setSaving: (val: boolean) => void,
  setError: (error: string | null) => void,
  setCurrentLectureId: (id: string | null) => void,
  createLecture: (data: LectureFormData, userId: string, userName: string) => Promise<Lecture | null>,
  updateLecture: (id: string, data: any) => Promise<any>
) {
  const handleSaveLecture = useCallback(async () => {
    if (!lectureForm.title.trim()) {
      setError('Vui lòng nhập tiêu đề bài giảng');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const newLecture = await createLecture(
          lectureForm as LectureFormData,
          currentUser!.id,
          currentUser!.displayName || currentUser!.username
        );
        if (newLecture) {
          setCurrentLectureId(newLecture.id);
        }
      } else if (currentLectureId) {
        await updateLecture(currentLectureId, lectureForm as LectureFormData);
      }
    } catch (err) {
      setError('Lỗi khi lưu bài giảng');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [lectureForm, currentUser, isNew, currentLectureId, createLecture, updateLecture, setSaving, setError, setCurrentLectureId]);

  return { handleSaveLecture };
}

// Slide operations
export function useSlideHandlers(
  currentLectureId: string | null,
  slides: Slide[],
  selectedSlideIndex: number,
  editingSlide: SlideFormData | null,
  hasUnsavedChanges: boolean,
  setEditingSlide: (slide: SlideFormData | null) => void,
  setSelectedSlideIndex: (idx: number) => void,
  setHasUnsavedChanges: (val: boolean) => void,
  setSelectedElementId: (id: string | null) => void,
  setError: (error: string | null) => void,
  updateSlide: (id: string, data: any) => Promise<any>,
  addSlide: (data: SlideFormData, order: number) => Promise<Slide | null>,
  deleteSlide: (id: string) => Promise<any>,
  _updateEditingSlide: (updates: Partial<SlideFormData>) => void
) {
  const handleSaveSlide = useCallback(async () => {
    if (!editingSlide || selectedSlideIndex < 0 || selectedSlideIndex >= slides.length) return;
    const slide = slides[selectedSlideIndex];
    await updateSlide(slide.id, editingSlide);
    setHasUnsavedChanges(false);
  }, [editingSlide, selectedSlideIndex, slides, updateSlide, setHasUnsavedChanges]);

  const handleAddSlide = useCallback(async () => {
    if (!currentLectureId) {
      setError('Lưu bài giảng trước khi thêm slide');
      return;
    }
    if (hasUnsavedChanges) await handleSaveSlide();

    const newSlideData: SlideFormData = {
      layout: 'content',
      title: `Slide ${slides.length + 1}`,
      elements: [],
      backgroundColor: '#ffffff',
      animation: 'none',
      transition: 'fade',
      animationDuration: 500,
    };

    const newSlide = await addSlide(newSlideData, slides.length);
    if (newSlide) {
      const newIndex = slides.length;
      setTimeout(() => {
        setSelectedSlideIndex(newIndex);
        setHasUnsavedChanges(false);
      }, 300);
    }
  }, [currentLectureId, hasUnsavedChanges, handleSaveSlide, slides, addSlide, setSelectedSlideIndex, setHasUnsavedChanges, setError]);

  const handleSelectSlide = useCallback(async (index: number) => {
    if (hasUnsavedChanges) await handleSaveSlide();

    const slide = slides[index];
    if (slide) {
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
    }

    setSelectedSlideIndex(index);
    setSelectedElementId(null);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, handleSaveSlide, slides, setEditingSlide, setSelectedSlideIndex, setSelectedElementId, setHasUnsavedChanges]);

  const handleDeleteSlideConfirm = useCallback(async (
    deleteSlideConfirm: DeleteSlideConfirm | null,
    setDeleteSlideConfirm: (val: DeleteSlideConfirm | null) => void
  ) => {
    if (!deleteSlideConfirm) return;
    const slide = slides[deleteSlideConfirm.index];
    await deleteSlide(slide.id);
    if (selectedSlideIndex >= slides.length - 1) {
      setSelectedSlideIndex(Math.max(0, slides.length - 2));
    }
    setHasUnsavedChanges(false);
    setDeleteSlideConfirm(null);
  }, [slides, selectedSlideIndex, deleteSlide, setSelectedSlideIndex, setHasUnsavedChanges]);

  return { handleSaveSlide, handleAddSlide, handleSelectSlide, handleDeleteSlideConfirm };
}

// Import/Export handlers
export function useImportExportHandlers(
  currentLectureId: string | null,
  slides: Slide[],
  lectureForm: LectureFormState,
  currentUser: any,
  setError: (error: string | null) => void,
  setSelectedSlideIndex: (idx: number) => void,
  setHasUnsavedChanges: (val: boolean) => void,
  addSlide: (data: SlideFormData, order: number) => Promise<Slide | null>,
  deleteAllSlides: (() => Promise<boolean>) | undefined,
  exportPPTX: (lecture: Lecture, slides: Slide[], options: { includeNotes: boolean }) => Promise<void>
) {
  const handleImportSlides = useCallback(async (importedSlides: SlideFormData[], mode: PPTXImportOptions['mode']) => {
    if (!currentLectureId) {
      setError('Vui lòng lưu bài giảng trước khi import');
      return;
    }

    const startOrder = mode === 'replace' ? 0 : slides.length;
    if (mode === 'replace' && slides.length > 0) {
      await deleteAllSlides?.();
    }

    for (let i = 0; i < importedSlides.length; i++) {
      try {
        await addSlide(importedSlides[i], startOrder + i);
      } catch (err) {
        console.error(`Error adding slide ${i + 1}:`, err);
      }
    }

    setTimeout(() => {
      const firstImportedIndex = mode === 'replace' ? 0 : startOrder;
      setSelectedSlideIndex(firstImportedIndex);
      setHasUnsavedChanges(false);
    }, 500);
  }, [currentLectureId, slides, addSlide, deleteAllSlides, setSelectedSlideIndex, setHasUnsavedChanges, setError]);

  const handleExportPPTX = useCallback(async () => {
    if (!currentLectureId || slides.length === 0) return;

    const lecture: Lecture = {
      id: currentLectureId,
      title: lectureForm.title || 'Untitled',
      description: lectureForm.description,
      coverImage: lectureForm.coverImage,
      authorId: currentUser!.id,
      authorName: currentUser!.displayName || currentUser!.username,
      jlptLevel: lectureForm.jlptLevel,
      isPublished: lectureForm.isPublished,
      isHidden: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slideCount: slides.length,
      viewCount: 0,
    };

    await exportPPTX(lecture, slides, { includeNotes: true });
  }, [currentLectureId, slides, lectureForm, currentUser, exportPPTX]);

  return { handleImportSlides, handleExportPPTX };
}

// Image upload handlers
export function useImageHandlers(
  selectedElementId: string | null,
  selectedElement: any,
  editingSlide: SlideFormData | null,
  updateElement: (id: string, updates: Partial<any>) => void,
  updateEditingSlide: (updates: Partial<SlideFormData>) => void,
  setSelectedElementId: (id: string | null) => void
) {
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (selectedElementId && selectedElement?.type === 'image') {
        updateElement(selectedElementId, { content: reader.result as string });
      } else {
        const newElement: any = {
          id: `el-${Date.now()}`,
          type: 'image',
          content: reader.result as string,
          position: { x: 10, y: 20, width: 60, height: 50 },
        };
        updateEditingSlide({ elements: [...(editingSlide?.elements || []), newElement] });
        setSelectedElementId(newElement.id);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [selectedElementId, selectedElement, editingSlide, updateElement, updateEditingSlide, setSelectedElementId]);

  const handleBackgroundImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateEditingSlide({ backgroundImage: reader.result as string });
      reader.readAsDataURL(file);
    }
  }, [updateEditingSlide]);

  return { handleImageUpload, handleBackgroundImageUpload };
}
