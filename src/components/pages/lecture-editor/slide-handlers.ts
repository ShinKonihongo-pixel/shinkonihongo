// Slide-specific handlers

import { useCallback } from 'react';
import { hasFurigana, removeFurigana } from '../../../lib/furigana-utils';
import { generateId, TEXT_TEMPLATES } from '../../../components/lecture-editor';
import { createSlideFromTemplate, type SlideTemplate } from '../../../utils/slide-templates';
import type { SlideFormData, SlideElement, Slide, AdminNote } from '../../../types/lecture';
import type { TextSelection } from './types';

// Furigana handlers
export function useFuriganaHandlers(
  editingSlide: SlideFormData | null,
  selectedElement: SlideElement | null,
  updateElement: (id: string, updates: Partial<SlideElement>) => void,
  updateEditingSlide: (updates: Partial<SlideFormData>) => void,
  generateFurigana: (text: string) => Promise<string>,
  setError: (error: string | null) => void
) {
  const handleGenerateFurigana = useCallback(async () => {
    if (!selectedElement || selectedElement.type !== 'text') {
      setError('Vui lòng chọn một element text');
      return;
    }
    if (hasFurigana(selectedElement.content)) {
      setError('Text đã có furigana. Xóa furigana trước khi tạo mới.');
      return;
    }
    try {
      const textWithFurigana = await generateFurigana(selectedElement.content);
      updateElement(selectedElement.id, { content: textWithFurigana });
    } catch (err) {
      setError('Lỗi khi tạo furigana. Vui lòng thử lại.');
      console.error(err);
    }
  }, [selectedElement, generateFurigana, updateElement, setError]);

  const handleGenerateAllFurigana = useCallback(async () => {
    if (!editingSlide) return;
    const textElements = editingSlide.elements.filter(el => el.type === 'text' && !hasFurigana(el.content));
    if (textElements.length === 0) {
      setError('Không có text element nào cần thêm furigana');
      return;
    }
    try {
      const updatedElements = [...editingSlide.elements];
      for (const el of textElements) {
        const index = updatedElements.findIndex(e => e.id === el.id);
        if (index !== -1) {
          const textWithFurigana = await generateFurigana(el.content);
          updatedElements[index] = { ...updatedElements[index], content: textWithFurigana };
        }
      }
      updateEditingSlide({ elements: updatedElements });
    } catch (err) {
      setError('Lỗi khi tạo furigana. Vui lòng thử lại.');
      console.error(err);
    }
  }, [editingSlide, generateFurigana, updateEditingSlide, setError]);

  const handleRemoveFurigana = useCallback(() => {
    if (!selectedElement || selectedElement.type !== 'text') {
      setError('Vui lòng chọn một element text');
      return;
    }
    if (!hasFurigana(selectedElement.content)) {
      setError('Text không có furigana');
      return;
    }
    const textWithoutFurigana = removeFurigana(selectedElement.content);
    updateElement(selectedElement.id, { content: textWithoutFurigana });
  }, [selectedElement, updateElement, setError]);

  return { handleGenerateFurigana, handleGenerateAllFurigana, handleRemoveFurigana };
}

// Admin notes handlers
export function useAdminNotesHandlers(
  editingSlide: SlideFormData | null,
  textSelection: TextSelection | null,
  noteContent: string,
  editingNoteId: string | null,
  currentUser: any,
  setTextSelection: (selection: TextSelection | null) => void,
  setNoteContent: (content: string) => void,
  setShowNoteModal: (show: boolean) => void,
  setEditingNoteId: (id: string | null) => void,
  updateElement: (id: string, updates: Partial<SlideElement>) => void
) {
  const handleTextSelect = useCallback((elementId: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setTextSelection(null);
      return;
    }
    const text = selection.toString();
    const range = selection.getRangeAt(0);
    setTextSelection({ elementId, text, startOffset: range.startOffset, endOffset: range.endOffset });
  }, [setTextSelection]);

  const addAdminNote = useCallback(() => {
    if (!textSelection || !noteContent.trim() || !editingSlide || !currentUser) return;
    const element = editingSlide.elements.find(el => el.id === textSelection.elementId);
    if (!element) return;

    const newNote: AdminNote = {
      id: `note-${Date.now()}`,
      selectedText: textSelection.text,
      noteContent: noteContent.trim(),
      startOffset: textSelection.startOffset,
      endOffset: textSelection.endOffset,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.displayName || currentUser.username,
    };

    updateElement(textSelection.elementId, { adminNotes: [...(element.adminNotes || []), newNote] });
    setNoteContent('');
    setShowNoteModal(false);
    setTextSelection(null);
  }, [textSelection, noteContent, editingSlide, currentUser, updateElement, setNoteContent, setShowNoteModal, setTextSelection]);

  const updateAdminNote = useCallback(() => {
    if (!editingNoteId || !noteContent.trim() || !editingSlide) return;
    const element = editingSlide.elements.find(el => el.adminNotes?.some(n => n.id === editingNoteId));
    if (!element) return;

    const updatedNotes = element.adminNotes?.map(note =>
      note.id === editingNoteId ? { ...note, noteContent: noteContent.trim() } : note
    );
    updateElement(element.id, { adminNotes: updatedNotes });
    setNoteContent('');
    setEditingNoteId(null);
    setShowNoteModal(false);
  }, [editingNoteId, noteContent, editingSlide, updateElement, setNoteContent, setEditingNoteId, setShowNoteModal]);

  const deleteAdminNote = useCallback((elementId: string, noteId: string) => {
    if (!editingSlide) return;
    const element = editingSlide.elements.find(el => el.id === elementId);
    if (!element) return;
    updateElement(elementId, { adminNotes: element.adminNotes?.filter(n => n.id !== noteId) });
  }, [editingSlide, updateElement]);

  const openNoteForEdit = useCallback((note: AdminNote) => {
    setEditingNoteId(note.id);
    setNoteContent(note.noteContent);
    setShowNoteModal(true);
  }, [setEditingNoteId, setNoteContent, setShowNoteModal]);

  return { handleTextSelect, addAdminNote, updateAdminNote, deleteAdminNote, openNoteForEdit };
}

// Template and symbol handlers
export function useContentHandlers(
  editingSlide: SlideFormData | null,
  selectedElement: SlideElement | null,
  updateEditingSlide: (updates: Partial<SlideFormData>) => void,
  updateElement: (id: string, updates: Partial<SlideElement>) => void,
  setSelectedElementId: (id: string | null) => void,
  setShowSymbolPicker: (show: boolean) => void
) {
  const insertSymbol = useCallback((symbol: string) => {
    if (!selectedElement || selectedElement.type !== 'text') {
      if (!editingSlide) return;
      const newElement: SlideElement = {
        id: generateId(),
        type: 'text',
        content: symbol,
        position: { x: 40, y: 40, width: 20, height: 15 },
        style: { fontSize: '48px', textAlign: 'center' },
      };
      updateEditingSlide({ elements: [...editingSlide.elements, newElement] });
      setSelectedElementId(newElement.id);
    } else {
      updateElement(selectedElement.id, { content: selectedElement.content + symbol });
    }
    setShowSymbolPicker(false);
  }, [selectedElement, editingSlide, updateElement, updateEditingSlide, setSelectedElementId, setShowSymbolPicker]);

  const addTextTemplate = useCallback((template: typeof TEXT_TEMPLATES[0]) => {
    if (!editingSlide) return;
    const newElement: SlideElement = {
      id: generateId(),
      type: 'text',
      content: template.content,
      position: { x: 10, y: 20, width: 80, height: 15 },
      style: template.style,
    };
    updateEditingSlide({ elements: [...editingSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
  }, [editingSlide, updateEditingSlide, setSelectedElementId]);

  const handleApplyTemplate = useCallback(async (
    template: SlideTemplate,
    currentLectureId: string | null,
    hasUnsavedChanges: boolean,
    handleSaveSlide: () => Promise<void>,
    addSlide: (data: SlideFormData, order: number) => Promise<Slide | null>,
    slides: Slide[],
    setSelectedSlideIndex: (idx: number) => void,
    setHasUnsavedChanges: (val: boolean) => void,
    setShowTemplatesPanel: (show: boolean) => void,
    setError: (error: string | null) => void
  ) => {
    if (!currentLectureId) {
      setError('Vui lòng lưu bài giảng trước');
      return;
    }
    if (hasUnsavedChanges) await handleSaveSlide();

    const newSlideData = createSlideFromTemplate(template);
    const newSlide = await addSlide(newSlideData, slides.length);
    if (newSlide) {
      setTimeout(() => {
        setSelectedSlideIndex(slides.length);
        setHasUnsavedChanges(false);
      }, 300);
    }
    setShowTemplatesPanel(false);
  }, []);

  return { insertSymbol, addTextTemplate, handleApplyTemplate };
}

// Zoom handlers
export function useZoomHandlers(setZoom: (fn: (z: number) => number) => void) {
  const handleZoomIn = useCallback(() => setZoom(z => Math.min(200, z + 25)), [setZoom]);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(25, z - 25)), [setZoom]);
  const handleZoomReset = useCallback(() => setZoom(() => 100), [setZoom]);
  const handleZoomFit = useCallback(() => setZoom(() => 100), [setZoom]);

  return { handleZoomIn, handleZoomOut, handleZoomReset, handleZoomFit };
}
