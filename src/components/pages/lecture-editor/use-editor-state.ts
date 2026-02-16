// Editor State Management Hook

import { useState, useRef } from 'react';
import { createHistoryState, type HistoryState } from '../../../utils/slide-editor-effects';
import type {
  LectureFormState, DragState, TextSelection, DeleteSlideConfirm,
  RibbonTab, SlideFormData, SlideElement
} from './types';

export function useEditorState(initialLevel?: string, initialFolderId?: string) {
  // Core state
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingSlide, setEditingSlide] = useState<SlideFormData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // UI State
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [deleteSlideConfirm, setDeleteSlideConfirm] = useState<DeleteSlideConfirm | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showAdminNotes, setShowAdminNotes] = useState(true);

  // Text selection
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);

  // Lecture form
  const [lectureForm, setLectureForm] = useState<LectureFormState>({
    title: '',
    description: '',
    coverImage: '',
    jlptLevel: (initialLevel as any) || 'N5',
    folderId: initialFolderId,
    isPublished: false,
  });

  // Drag/resize state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startX: 0,
    startY: 0,
    startPosition: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Clipboard
  const [clipboard, setClipboard] = useState<SlideElement | null>(null);

  // Title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Enhanced UI
  const [showQuickPanel, setShowQuickPanel] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Advanced panels
  const [showTextEffects, setShowTextEffects] = useState(false);
  const [showShapeEffects, setShowShapeEffects] = useState(false);
  const [showGradientPanel, setShowGradientPanel] = useState(false);
  const [showAnimationsPanel, setShowAnimationsPanel] = useState(false);
  const [showThemesPanel, setShowThemesPanel] = useState(false);
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryState<SlideFormData | null>>(createHistoryState(null));

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  return {
    // Core state
    currentLectureId, setCurrentLectureId,
    selectedSlideIndex, setSelectedSlideIndex,
    selectedElementId, setSelectedElementId,
    editingSlide, setEditingSlide,
    hasUnsavedChanges, setHasUnsavedChanges,

    // UI state
    showImportModal, setShowImportModal,
    showSettingsPanel, setShowSettingsPanel,
    showSymbolPicker, setShowSymbolPicker,
    showFurigana, setShowFurigana,
    activeTab, setActiveTab,
    saving, setSaving,
    error, setError,

    // Modal states
    deleteSlideConfirm, setDeleteSlideConfirm,
    showNoteModal, setShowNoteModal,
    noteContent, setNoteContent,
    editingNoteId, setEditingNoteId,
    showAdminNotes, setShowAdminNotes,
    textSelection, setTextSelection,

    // Lecture form
    lectureForm, setLectureForm,

    // Drag/resize
    dragState, setDragState,

    // Clipboard
    clipboard, setClipboard,

    // Title editing
    isEditingTitle, setIsEditingTitle,

    // Enhanced UI
    showQuickPanel, setShowQuickPanel,
    showTemplatesPanel, setShowTemplatesPanel,
    showLayersPanel, setShowLayersPanel,
    showGrid, setShowGrid,
    zoom, setZoom,

    // Advanced panels
    showTextEffects, setShowTextEffects,
    showShapeEffects, setShowShapeEffects,
    showGradientPanel, setShowGradientPanel,
    showAnimationsPanel, setShowAnimationsPanel,
    showThemesPanel, setShowThemesPanel,
    showShortcutsPanel, setShowShortcutsPanel,

    // History
    history, setHistory,

    // Refs
    fileInputRef,
    imageInputRef,
    canvasRef,
  };
}
