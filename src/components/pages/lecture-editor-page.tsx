// Lecture Editor - PowerPoint-like slide editor (Refactored)
// Layout: Top toolbar → Left sidebar (thumbnails) → Main editor (slide preview)

/* eslint-disable react-hooks/rules-of-hooks */
// NOTE: React Compiler false positives - setState calls in useCallback are valid
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useLectures, useSlides } from '../../hooks/use-lectures';
import { usePPTX } from '../../hooks/use-pptx';
import { useGroq } from '../../hooks/use-groq';
import { PPTXImportModal } from '../lecture/pptx-import-modal';
import { hasFurigana, removeFurigana } from '../../lib/furigana-utils';
import type { LectureFormData, SlideFormData, SlideElement, Lecture, AdminNote } from '../../types/lecture';
import type { JLPTLevel } from '../../types/flashcard';
import type { PPTXImportOptions } from '../../types/pptx';
import { QuickActionsPanel, TemplatesPanel, LayersPanel } from '../lecture/lecture-toolbar-panels';
import { createSlideFromTemplate, type SlideTemplate } from '../../utils/slide-templates';
import {
  TextEffectsPanel, ShapeEffectsPanel, GradientPanel, AnimationsPanel,
  ThemesPanel, ShortcutsPanel,
} from '../lecture/lecture-advanced-panels';
import {
  createHistoryState, undo, redo, canUndo, canRedo,
  type TextEffect, type ShapeEffect, type GradientPreset, type ElementAnimation, type SlideTheme, type HistoryState
} from '../../utils/slide-editor-effects';

// Modular components
import {
  EditorHeader, EditorSidebar, EditorCanvas,
  SymbolPickerModal, AdminNoteModal, SettingsPanel, DeleteSlideModal,
  TEXT_TEMPLATES, generateId,
  type DragState, type ResizeHandle, type TextSelection, type DeleteSlideConfirm, type RibbonTab, type LectureFormState,
} from '../lecture-editor';

// Ribbon toolbar (kept inline due to complexity)
import { EditorRibbon } from './lecture-editor-ribbon';

interface LectureEditorPageProps {
  lectureId?: string;
  initialFolderId?: string;
  initialLevel?: JLPTLevel;
  onBack: () => void;
}

export function LectureEditorPage({ lectureId, initialFolderId, initialLevel, onBack }: LectureEditorPageProps) {
  const { currentUser, isAdmin } = useAuth();
  const { getLecture, createLecture, updateLecture } = useLectures(true);
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(lectureId || null);
  const { slides, loading: slidesLoading, addSlide, updateSlide, deleteSlide, duplicateSlide, deleteAllSlides } = useSlides(currentLectureId);
  const { importPPTX, previewPPTX, importProgress, importError, resetImport, exportPPTX, exportLoading } = usePPTX();
  const { generateFurigana, isLoading: furiganaLoading } = useGroq();

  // UI State
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete slide confirmation state
  const [deleteSlideConfirm, setDeleteSlideConfirm] = useState<DeleteSlideConfirm | null>(null);

  // Admin notes state
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showAdminNotes, setShowAdminNotes] = useState(true);

  // Lecture form
  const [lectureForm, setLectureForm] = useState<LectureFormState>({
    title: '',
    description: '',
    coverImage: '',
    jlptLevel: initialLevel || 'N5',
    folderId: initialFolderId,
    isPublished: false,
  });

  // Local editing state for current slide
  const [editingSlide, setEditingSlide] = useState<SlideFormData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Drag/resize state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startX: 0,
    startY: 0,
    startPosition: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<SlideElement | null>(null);

  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Enhanced UI State
  const [showQuickPanel, setShowQuickPanel] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Advanced Panels State
  const [showTextEffects, setShowTextEffects] = useState(false);
  const [showShapeEffects, setShowShapeEffects] = useState(false);
  const [showGradientPanel, setShowGradientPanel] = useState(false);
  const [showAnimationsPanel, setShowAnimationsPanel] = useState(false);
  const [showThemesPanel, setShowThemesPanel] = useState(false);
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);

  // Undo/Redo History
  const [history, setHistory] = useState<HistoryState<SlideFormData | null>>(createHistoryState(null));

  const isNew = !currentLectureId || currentLectureId === 'new';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load existing lecture
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
  }, [lectureId, getLecture]);

  // Sync selected slide with slides array
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
  }, [slides, selectedSlideIndex, hasUnsavedChanges, slidesLoading]);

  // Get selected element
  const selectedElement = editingSlide?.elements.find(el => el.id === selectedElementId) || null;

  // Redirect non-admin
  if (!isAdmin) {
    return (
      <div className="ppt-error-page">
        <p>Bạn không có quyền truy cập trang này.</p>
        <button className="ppt-btn" onClick={onBack}>Quay lại</button>
      </div>
    );
  }

  // ============ HANDLERS ============

  // Save lecture metadata
  const handleSaveLecture = async () => {
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
  };

  // Save current slide
  const handleSaveSlide = useCallback(async () => {
    if (!editingSlide || selectedSlideIndex < 0 || selectedSlideIndex >= slides.length) return;
    const slide = slides[selectedSlideIndex];
    await updateSlide(slide.id, editingSlide);
    setHasUnsavedChanges(false);
  }, [editingSlide, selectedSlideIndex, slides, updateSlide]);

  // Add new slide
  const handleAddSlide = async () => {
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
  };

  // Select slide
  const handleSelectSlide = async (index: number) => {
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
  };

  // Delete slide
  const handleDeleteSlideClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteSlideConfirm({ index });
  };

  const handleDeleteSlideConfirm = async () => {
    if (!deleteSlideConfirm) return;
    const slide = slides[deleteSlideConfirm.index];
    await deleteSlide(slide.id);
    if (selectedSlideIndex >= slides.length - 1) {
      setSelectedSlideIndex(Math.max(0, slides.length - 2));
    }
    setHasUnsavedChanges(false);
    setDeleteSlideConfirm(null);
  };

  // Handle PPTX import
  const handleImportSlides = async (importedSlides: SlideFormData[], mode: PPTXImportOptions['mode']) => {
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
  };

  // Handle export
  const handleExportPPTX = async () => {
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
  };

  // Update editing slide
  const updateEditingSlide = useCallback((updates: Partial<SlideFormData>) => {
    if (!editingSlide) return;
    setEditingSlide({ ...editingSlide, ...updates });
    setHasUnsavedChanges(true);
  }, [editingSlide]);

  // Add element
  const addElement = useCallback((type: SlideElement['type']) => {
    if (!editingSlide) return;

    let defaultStyle: Record<string, string> | undefined;
    let defaultPosition = { x: 10, y: 20, width: 80, height: 15 };
    let defaultContent = '';

    switch (type) {
      case 'text':
        defaultContent = 'Nhập nội dung...';
        defaultStyle = {
          fontSize: '24px', fontWeight: 'normal', fontStyle: 'normal',
          color: '#000000', textAlign: 'left', backgroundColor: 'transparent', lineHeight: '1.5',
        };
        break;
      case 'shape':
        defaultPosition = { x: 20, y: 30, width: 30, height: 20 };
        defaultStyle = {
          backgroundColor: '#3498db', borderRadius: '0px',
          borderWidth: '0px', borderStyle: 'solid', borderColor: '#000000',
        };
        break;
      case 'image':
      case 'video':
      case 'audio':
        defaultPosition = { x: 10, y: 20, width: 60, height: 40 };
        break;
    }

    const newElement: SlideElement = {
      id: generateId(),
      type,
      content: defaultContent,
      position: defaultPosition,
      style: defaultStyle,
    };

    updateEditingSlide({ elements: [...editingSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
  }, [editingSlide, updateEditingSlide]);

  // Add shape element
  const addShapeElement = useCallback((shapeType: 'rectangle' | 'circle' | 'line' | 'arrow') => {
    if (!editingSlide) return;

    let position = { x: 20, y: 30, width: 30, height: 20 };
    let style: Record<string, string> = {
      backgroundColor: '#3498db', borderWidth: '0px', borderStyle: 'solid', borderColor: '#000000',
    };

    switch (shapeType) {
      case 'circle':
        style.borderRadius = '50%';
        position = { x: 30, y: 30, width: 20, height: 20 };
        break;
      case 'line':
        position = { x: 10, y: 50, width: 80, height: 0.5 };
        style = { backgroundColor: '#000000', borderRadius: '0px' };
        break;
      case 'arrow':
        position = { x: 10, y: 50, width: 60, height: 3 };
        style = { backgroundColor: '#000000', borderRadius: '0px' };
        break;
      default:
        style.borderRadius = '0px';
    }

    const newElement: SlideElement = { id: generateId(), type: 'shape', content: shapeType, position, style };
    updateEditingSlide({ elements: [...editingSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
  }, [editingSlide, updateEditingSlide]);

  // Update element
  const updateElement = useCallback((id: string, updates: Partial<SlideElement>) => {
    if (!editingSlide) return;
    updateEditingSlide({
      elements: editingSlide.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    });
  }, [editingSlide, updateEditingSlide]);

  // Update element style
  const updateElementStyle = useCallback((id: string, styleUpdates: Record<string, string | undefined>) => {
    if (!editingSlide) return;
    updateEditingSlide({
      elements: editingSlide.elements.map(el =>
        el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
      ),
    });
  }, [editingSlide, updateEditingSlide]);

  // Insert symbol
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
  }, [selectedElement, editingSlide, updateElement, updateEditingSlide]);

  // Add text template
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
  }, [editingSlide, updateEditingSlide]);

  // Furigana handlers
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
  }, [selectedElement, generateFurigana, updateElement]);

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
  }, [editingSlide, generateFurigana, updateEditingSlide]);

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
  }, [selectedElement, updateElement]);

  // Admin notes handlers
  const handleTextSelect = useCallback((elementId: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setTextSelection(null);
      return;
    }
    const text = selection.toString();
    const range = selection.getRangeAt(0);
    setTextSelection({ elementId, text, startOffset: range.startOffset, endOffset: range.endOffset });
  }, []);

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
  }, [textSelection, noteContent, editingSlide, currentUser, updateElement]);

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
  }, [editingNoteId, noteContent, editingSlide, updateElement]);

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
  }, []);

  // Element operations
  const deleteElement = useCallback(() => {
    if (!editingSlide || !selectedElementId) return;
    updateEditingSlide({ elements: editingSlide.elements.filter(el => el.id !== selectedElementId) });
    setSelectedElementId(null);
  }, [editingSlide, selectedElementId, updateEditingSlide]);

  const copyElement = useCallback(() => {
    if (!selectedElement) return;
    setClipboard({ ...selectedElement });
  }, [selectedElement]);

  const pasteElement = useCallback(() => {
    if (!clipboard || !editingSlide) return;
    const newElement: SlideElement = {
      ...clipboard,
      id: generateId(),
      position: { ...clipboard.position, x: clipboard.position.x + 2, y: clipboard.position.y + 2 },
    };
    updateEditingSlide({ elements: [...editingSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
  }, [clipboard, editingSlide, updateEditingSlide]);

  const duplicateElement = useCallback(() => {
    if (!selectedElement || !editingSlide) return;
    const newElement: SlideElement = {
      ...selectedElement,
      id: generateId(),
      position: { ...selectedElement.position, x: selectedElement.position.x + 2, y: selectedElement.position.y + 2 },
    };
    updateEditingSlide({ elements: [...editingSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
  }, [selectedElement, editingSlide, updateEditingSlide]);

  const bringToFront = useCallback(() => {
    if (!selectedElementId || !editingSlide) return;
    const elements = editingSlide.elements.filter(el => el.id !== selectedElementId);
    const element = editingSlide.elements.find(el => el.id === selectedElementId);
    if (element) updateEditingSlide({ elements: [...elements, element] });
  }, [selectedElementId, editingSlide, updateEditingSlide]);

  const sendToBack = useCallback(() => {
    if (!selectedElementId || !editingSlide) return;
    const elements = editingSlide.elements.filter(el => el.id !== selectedElementId);
    const element = editingSlide.elements.find(el => el.id === selectedElementId);
    if (element) updateEditingSlide({ elements: [element, ...elements] });
  }, [selectedElementId, editingSlide, updateEditingSlide]);

  // Zoom controls
  const handleZoomIn = useCallback(() => setZoom(z => Math.min(200, z + 25)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(25, z - 25)), []);
  const handleZoomReset = useCallback(() => setZoom(100), []);
  const handleZoomFit = useCallback(() => setZoom(100), []);

  // Template
  const handleApplyTemplate = useCallback(async (template: SlideTemplate) => {
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
  }, [currentLectureId, hasUnsavedChanges, handleSaveSlide, addSlide, slides.length]);

  // Layer management
  const handleToggleElementVisibility = useCallback((elementId: string) => {
    if (!editingSlide) return;
    updateEditingSlide({
      elements: editingSlide.elements.map(el => el.id === elementId ? { ...el, hidden: !el.hidden } : el),
    });
  }, [editingSlide, updateEditingSlide]);

  const handleToggleElementLock = useCallback((elementId: string) => {
    if (!editingSlide) return;
    updateEditingSlide({
      elements: editingSlide.elements.map(el => el.id === elementId ? { ...el, locked: !el.locked } : el),
    });
  }, [editingSlide, updateEditingSlide]);

  const handleMoveElementLayer = useCallback((elementId: string, direction: 'up' | 'down') => {
    if (!editingSlide) return;
    const elements = [...editingSlide.elements];
    const idx = elements.findIndex(el => el.id === elementId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= elements.length) return;
    [elements[idx], elements[newIdx]] = [elements[newIdx], elements[idx]];
    updateEditingSlide({ elements });
  }, [editingSlide, updateEditingSlide]);

  const handleDeleteElementById = useCallback((elementId: string) => {
    if (!editingSlide) return;
    updateEditingSlide({ elements: editingSlide.elements.filter(el => el.id !== elementId) });
    if (selectedElementId === elementId) setSelectedElementId(null);
  }, [editingSlide, selectedElementId, updateEditingSlide]);

  const handleDuplicateElementById = useCallback((elementId: string) => {
    if (!editingSlide) return;
    const element = editingSlide.elements.find(el => el.id === elementId);
    if (!element) return;
    const newElement: SlideElement = {
      ...element,
      id: generateId(),
      position: { ...element.position, x: element.position.x + 2, y: element.position.y + 2 },
    };
    updateEditingSlide({ elements: [...editingSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
  }, [editingSlide, updateEditingSlide]);

  // Advanced effects
  const handleApplyTextEffect = useCallback((effect: TextEffect) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    updateElementStyle(selectedElement.id, effect.style as Record<string, string | undefined>);
    setShowTextEffects(false);
  }, [selectedElement, updateElementStyle]);

  const handleApplyShapeEffect = useCallback((effect: ShapeEffect) => {
    if (!selectedElement || selectedElement.type !== 'shape') return;
    updateElementStyle(selectedElement.id, effect.style as Record<string, string | undefined>);
    setShowShapeEffects(false);
  }, [selectedElement, updateElementStyle]);

  const handleApplyGradient = useCallback((gradient: GradientPreset) => {
    if (!editingSlide) return;
    updateEditingSlide({ backgroundColor: gradient.value });
    setShowGradientPanel(false);
  }, [editingSlide, updateEditingSlide]);

  const handleApplyAnimation = useCallback((animation: ElementAnimation) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, { animation: animation.id, animationDuration: animation.duration });
    setShowAnimationsPanel(false);
  }, [selectedElement, updateElement]);

  const handlePreviewAnimation = useCallback((animation: ElementAnimation) => {
    if (!selectedElement) return;
    const element = document.querySelector(`[data-element-id="${selectedElement.id}"]`);
    if (element) {
      element.classList.remove('le-animate');
      void (element as HTMLElement).offsetWidth;
      (element as HTMLElement).style.animation = `${animation.keyframes} ${animation.duration}ms ease`;
      setTimeout(() => { (element as HTMLElement).style.animation = ''; }, animation.duration);
    }
  }, [selectedElement]);

  const handleApplyTheme = useCallback((theme: SlideTheme) => {
    if (!editingSlide) return;
    updateEditingSlide({ backgroundColor: theme.backgroundColor });
    setShowThemesPanel(false);
  }, [editingSlide, updateEditingSlide]);

  const handleRotateElement = useCallback((rotation: number) => {
    if (!selectedElement) return;
    updateElementStyle(selectedElement.id, { transform: `rotate(${rotation}deg)` });
  }, [selectedElement, updateElementStyle]);

  const handleOpacityChange = useCallback((opacity: number) => {
    if (!selectedElement) return;
    updateElementStyle(selectedElement.id, { opacity: String(opacity / 100) });
  }, [selectedElement, updateElementStyle]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    const newHistory = undo(history);
    if (newHistory.present) {
      setEditingSlide(newHistory.present);
      setHistory(newHistory);
    }
  }, [history]);

  const handleRedo = useCallback(() => {
    const newHistory = redo(history);
    if (newHistory.present) {
      setEditingSlide(newHistory.present);
      setHistory(newHistory);
    }
  }, [history]);

  // Drag/Resize handlers
  const handleDragStart = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const element = editingSlide?.elements.find(el => el.id === elementId);
    if (!element) return;
    setSelectedElementId(elementId);
    setDragState({
      isDragging: true, isResizing: false, resizeHandle: null,
      startX: e.clientX, startY: e.clientY,
      startPosition: { ...element.position },
    });
  }, [editingSlide]);

  const handleResizeStart = useCallback((e: React.MouseEvent, elementId: string, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    const element = editingSlide?.elements.find(el => el.id === elementId);
    if (!element) return;
    setSelectedElementId(elementId);
    setDragState({
      isDragging: false, isResizing: true, resizeHandle: handle,
      startX: e.clientX, startY: e.clientY,
      startPosition: { ...element.position },
    });
  }, [editingSlide]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging && !dragState.isResizing) return;
    if (!canvasRef.current || !selectedElementId) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100;

    if (dragState.isDragging) {
      const newX = Math.max(0, Math.min(100 - dragState.startPosition.width, dragState.startPosition.x + deltaX));
      const newY = Math.max(0, Math.min(100 - dragState.startPosition.height, dragState.startPosition.y + deltaY));
      updateElement(selectedElementId, { position: { ...dragState.startPosition, x: newX, y: newY } });
    } else if (dragState.isResizing && dragState.resizeHandle) {
      let { x, y, width, height } = dragState.startPosition;
      const handle = dragState.resizeHandle;

      if (handle.includes('w')) {
        const newX = Math.max(0, x + deltaX);
        const newWidth = width - (newX - x);
        if (newWidth >= 5) { x = newX; width = newWidth; }
      }
      if (handle.includes('e')) width = Math.max(5, Math.min(100 - x, width + deltaX));
      if (handle.includes('n')) {
        const newY = Math.max(0, y + deltaY);
        const newHeight = height - (newY - y);
        if (newHeight >= 5) { y = newY; height = newHeight; }
      }
      if (handle.includes('s')) height = Math.max(5, Math.min(100 - y, height + deltaY));

      updateElement(selectedElementId, { position: { x, y, width, height } });
    }
  }, [dragState, selectedElementId, updateElement]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging || dragState.isResizing) {
      setDragState({
        isDragging: false, isResizing: false, resizeHandle: null,
        startX: 0, startY: 0, startPosition: { x: 0, y: 0, width: 0, height: 0 },
      });
    }
  }, [dragState]);

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (selectedElementId && selectedElement?.type === 'image') {
        updateElement(selectedElementId, { content: reader.result as string });
      } else {
        const newElement: SlideElement = {
          id: generateId(),
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
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateEditingSlide({ backgroundImage: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSaveSlide(); }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !isEditing) { e.preventDefault(); handleUndo(); }
      if (((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) && !isEditing) { e.preventDefault(); handleRedo(); }
      if (e.key === 'Delete' && selectedElementId && !isEditing) { e.preventDefault(); deleteElement(); }
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedElementId && !isEditing) { e.preventDefault(); copyElement(); }
      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && clipboard && !isEditing) { e.preventDefault(); pasteElement(); }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedElementId && !isEditing) { e.preventDefault(); duplicateElement(); }
      if (e.key === 'Escape') { setSelectedElementId(null); setIsEditingTitle(false); }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElementId && !isEditing) {
        e.preventDefault();
        const element = editingSlide?.elements.find(el => el.id === selectedElementId);
        if (!element) return;
        const step = e.shiftKey ? 5 : 1;
        let { x, y } = element.position;
        if (e.key === 'ArrowUp') y = Math.max(0, y - step);
        if (e.key === 'ArrowDown') y = Math.min(100 - element.position.height, y + step);
        if (e.key === 'ArrowLeft') x = Math.max(0, x - step);
        if (e.key === 'ArrowRight') x = Math.min(100 - element.position.width, x + step);
        updateElement(selectedElementId, { position: { ...element.position, x, y } });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveSlide, selectedElementId, deleteElement, copyElement, pasteElement, duplicateElement, clipboard, editingSlide, updateElement, handleUndo, handleRedo]);

  // ============ RENDER ============

  return (
    <div className="ppt-editor">
      <EditorHeader
        lectureForm={lectureForm}
        onTitleChange={(title) => setLectureForm({ ...lectureForm, title })}
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
        onSave={handleSaveLecture}
        onBack={onBack}
        onSettings={() => setShowSettingsPanel(!showSettingsPanel)}
        onImport={() => setShowImportModal(true)}
        onExport={handleExportPPTX}
        showAdminNotes={showAdminNotes}
        onToggleAdminNotes={() => setShowAdminNotes(!showAdminNotes)}
        canUndo={canUndo(history)}
        canRedo={canRedo(history)}
        historyLength={history.past.length}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onShowShortcuts={() => setShowShortcutsPanel(true)}
        isNew={isNew}
        slidesCount={slides.length}
        exportLoading={exportLoading}
      />

      <EditorRibbon
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedElement={selectedElement}
        editingSlide={editingSlide}
        clipboard={clipboard}
        isNew={isNew}
        onAddSlide={handleAddSlide}
        onCopy={copyElement}
        onPaste={pasteElement}
        onDuplicate={duplicateElement}
        onDelete={deleteElement}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        updateElementStyle={updateElementStyle}
        updateEditingSlide={updateEditingSlide}
        addElement={addElement}
        addShapeElement={addShapeElement}
        insertSymbol={insertSymbol}
        addTextTemplate={addTextTemplate}
        onGenerateFurigana={handleGenerateFurigana}
        onGenerateAllFurigana={handleGenerateAllFurigana}
        onRemoveFurigana={handleRemoveFurigana}
        showFurigana={showFurigana}
        onToggleFurigana={() => setShowFurigana(!showFurigana)}
        furiganaLoading={furiganaLoading}
        onShowSymbolPicker={() => setShowSymbolPicker(!showSymbolPicker)}
        onShowTemplatesPanel={() => setShowTemplatesPanel(!showTemplatesPanel)}
        onShowTextEffects={() => setShowTextEffects(true)}
        onShowShapeEffects={() => setShowShapeEffects(true)}
        onShowGradientPanel={() => setShowGradientPanel(true)}
        onShowAnimationsPanel={() => setShowAnimationsPanel(true)}
        onShowThemesPanel={() => setShowThemesPanel(true)}
        onRotateElement={handleRotateElement}
        onOpacityChange={handleOpacityChange}
        imageInputRef={imageInputRef}
        fileInputRef={fileInputRef}
        onImageUpload={handleImageUpload}
        onBackgroundImageUpload={handleBackgroundImageUpload}
      />

      {error && <div className="ppt-error-bar">{error} <button onClick={() => setError(null)}>×</button></div>}

      <div className="ppt-main">
        <EditorSidebar
          slides={slides}
          selectedSlideIndex={selectedSlideIndex}
          onSelectSlide={handleSelectSlide}
          onDuplicateSlide={duplicateSlide}
          onDeleteSlideClick={handleDeleteSlideClick}
          onAddSlide={handleAddSlide}
          isLoading={slidesLoading}
          isNew={isNew}
        />

        <EditorCanvas
          editingSlide={editingSlide}
          selectedElementId={selectedElementId}
          selectedElement={selectedElement}
          dragState={dragState}
          showGrid={showGrid}
          zoom={zoom}
          showFurigana={showFurigana}
          showAdminNotes={showAdminNotes}
          textSelection={textSelection}
          isEditingTitle={isEditingTitle}
          isNew={isNew}
          slidesCount={slides.length}
          selectedSlideIndex={selectedSlideIndex}
          hasUnsavedChanges={hasUnsavedChanges}
          canvasRef={canvasRef}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onZoomFit={handleZoomFit}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onSelectElement={setSelectedElementId}
          onUpdateElement={updateElement}
          onUpdateEditingSlide={updateEditingSlide}
          onDragStart={handleDragStart}
          onResizeStart={handleResizeStart}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTextSelect={handleTextSelect}
          onSetEditingTitle={setIsEditingTitle}
          onShowNoteModal={() => setShowNoteModal(true)}
          onOpenNoteForEdit={openNoteForEdit}
          onDeleteAdminNote={deleteAdminNote}
          onCopy={copyElement}
          onDuplicate={duplicateElement}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onDelete={deleteElement}
          onSaveSlide={handleSaveSlide}
          onAddElement={addElement}
          onAddShapeElement={addShapeElement}
          onAddSlide={handleAddSlide}
          imageInputRef={imageInputRef}
        />

        <SettingsPanel
          isOpen={showSettingsPanel}
          lectureForm={lectureForm}
          onClose={() => setShowSettingsPanel(false)}
          onUpdateForm={(updates) => setLectureForm({ ...lectureForm, ...updates })}
        />
      </div>

      {/* Modals */}
      <PPTXImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportSlides}
        existingSlidesCount={slides.length}
        lectureId={currentLectureId || ''}
        importPPTX={importPPTX}
        previewPPTX={previewPPTX}
        importProgress={importProgress}
        importError={importError}
        resetImport={resetImport}
      />

      <SymbolPickerModal
        isOpen={showSymbolPicker}
        onClose={() => setShowSymbolPicker(false)}
        onInsertSymbol={insertSymbol}
      />

      <AdminNoteModal
        isOpen={showNoteModal}
        textSelection={textSelection}
        editingNoteId={editingNoteId}
        noteContent={noteContent}
        onNoteContentChange={setNoteContent}
        onClose={() => { setShowNoteModal(false); setNoteContent(''); setEditingNoteId(null); }}
        onSave={editingNoteId ? updateAdminNote : addAdminNote}
      />

      {/* Enhanced UI Panels */}
      <QuickActionsPanel
        isVisible={showQuickPanel}
        onToggle={() => setShowQuickPanel(!showQuickPanel)}
        onAddText={() => addElement('text')}
        onAddImage={() => imageInputRef.current?.click()}
        onAddShape={(shape) => addShapeElement(shape)}
        onAddVideo={() => addElement('video')}
        onAddAudio={() => addElement('audio')}
      />

      <TemplatesPanel
        isVisible={showTemplatesPanel}
        onClose={() => setShowTemplatesPanel(false)}
        onSelectTemplate={handleApplyTemplate}
      />

      <LayersPanel
        elements={editingSlide?.elements || []}
        selectedElementId={selectedElementId}
        onSelectElement={setSelectedElementId}
        onMoveElement={handleMoveElementLayer}
        onToggleVisibility={handleToggleElementVisibility}
        onToggleLock={handleToggleElementLock}
        onDeleteElement={handleDeleteElementById}
        onDuplicateElement={handleDuplicateElementById}
        isVisible={showLayersPanel}
        onToggle={() => setShowLayersPanel(!showLayersPanel)}
      />

      {/* Advanced Effects Panels */}
      <TextEffectsPanel
        currentEffect={selectedElement?.style?.textEffect || 'none'}
        onSelectEffect={handleApplyTextEffect}
        isVisible={showTextEffects}
        onClose={() => setShowTextEffects(false)}
      />

      <ShapeEffectsPanel
        currentEffect={selectedElement?.style?.shapeEffect || 'none'}
        onSelectEffect={handleApplyShapeEffect}
        isVisible={showShapeEffects}
        onClose={() => setShowShapeEffects(false)}
      />

      <GradientPanel
        currentGradient={editingSlide?.backgroundColor || '#ffffff'}
        onSelectGradient={handleApplyGradient}
        isVisible={showGradientPanel}
        onClose={() => setShowGradientPanel(false)}
      />

      <AnimationsPanel
        currentAnimation={selectedElement?.animation || 'none'}
        onSelectAnimation={handleApplyAnimation}
        onPreviewAnimation={handlePreviewAnimation}
        isVisible={showAnimationsPanel}
        onClose={() => setShowAnimationsPanel(false)}
      />

      <ThemesPanel
        currentTheme="default"
        onSelectTheme={handleApplyTheme}
        isVisible={showThemesPanel}
        onClose={() => setShowThemesPanel(false)}
      />

      <ShortcutsPanel
        isVisible={showShortcutsPanel}
        onClose={() => setShowShortcutsPanel(false)}
      />

      <DeleteSlideModal
        isOpen={!!deleteSlideConfirm}
        onConfirm={handleDeleteSlideConfirm}
        onCancel={() => setDeleteSlideConfirm(null)}
      />
    </div>
  );
}
