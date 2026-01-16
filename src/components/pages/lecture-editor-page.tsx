// Lecture Editor - PowerPoint-like slide editor
// Layout: Top toolbar → Left sidebar (thumbnails) → Main editor (slide preview)

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useLectures, useSlides } from '../../hooks/use-lectures';
import { ConfirmModal } from '../ui/confirm-modal';
import { usePPTX } from '../../hooks/use-pptx';
import { useGroq } from '../../hooks/use-groq';
import { PPTXImportModal } from '../lecture/pptx-import-modal';
import { convertFuriganaToRuby, hasFurigana, removeFurigana } from '../../lib/furigana-utils';
import type { LectureFormData, SlideFormData, SlideElement, SlideTransition, Lecture, Slide, AdminNote } from '../../types/lecture';
import type { JLPTLevel } from '../../types/flashcard';
import type { PPTXImportOptions } from '../../types/pptx';
import { QuickActionsPanel, TemplatesPanel, LayersPanel, ZoomControls, GridToggle } from '../lecture/lecture-toolbar-panels';
import { SLIDE_TEMPLATES, createSlideFromTemplate, type SlideTemplate } from '../../utils/slide-templates';
import {
  TextEffectsPanel, ShapeEffectsPanel, GradientPanel, AnimationsPanel,
  ThemesPanel, ShortcutsPanel, RotationControl, UndoRedoToolbar, OpacityControl, BorderControl
} from '../lecture/lecture-advanced-panels';
import {
  TEXT_EFFECTS, SHAPE_EFFECTS, GRADIENT_PRESETS, ELEMENT_ANIMATIONS, SLIDE_THEMES,
  createHistoryState, pushHistory, undo, redo, canUndo, canRedo,
  type TextEffect, type ShapeEffect, type GradientPreset, type ElementAnimation, type SlideTheme, type HistoryState
} from '../../utils/slide-editor-effects';
import {
  ArrowLeft,
  Settings,
  Download,
  Upload,
  Save,
  StickyNote,
  Plus,
  Copy,
  Clipboard,
  CopyPlus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Image,
  Video,
  Volume2,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Sparkles,
  FileText,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  LayoutGrid,
  Wand2,
  PaintBucket,
  ImagePlus,
  X,
  Pencil,
  Layers,
} from 'lucide-react';

// Constants
const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '40', '48', '56', '64', '72', '96'];
const FONT_FAMILIES = [
  'Arial', 'Arial Black', 'Georgia', 'Times New Roman', 'Verdana', 'Tahoma',
  'Courier New', 'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Lucida Sans'
];
const COLORS = [
  '#000000', '#ffffff', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#3498db', '#9b59b6', '#1abc9c', '#34495e', '#95a5a6', '#7f8c8d',
  '#c0392b', '#d35400', '#f39c12', '#27ae60', '#2980b9', '#8e44ad'
];
const HIGHLIGHT_COLORS = [
  'transparent', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff0000',
  '#0000ff', '#ffa500', '#ffb6c1', '#98fb98', '#add8e6', '#dda0dd'
];
const LINE_HEIGHTS = ['1', '1.2', '1.5', '1.8', '2', '2.5', '3'];
const BORDER_WIDTHS = ['0', '1', '2', '3', '4', '5'];
const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];
const OPACITIES = ['100', '90', '80', '70', '60', '50', '40', '30', '20', '10'];
const PADDING_SIZES = ['0', '4', '8', '12', '16', '20', '24', '32'];

// Box background colors (with transparency options)
const BOX_BACKGROUNDS = [
  'transparent',
  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
  '#fff3cd', '#d4edda', '#d1ecf1', '#f8d7da', '#e2d5f1',
  'rgba(255,255,255,0.8)', 'rgba(0,0,0,0.05)', 'rgba(52,152,219,0.1)',
  'rgba(46,204,113,0.1)', 'rgba(241,196,15,0.2)', 'rgba(231,76,60,0.1)',
];

// Educational symbols/icons for lectures
const LECTURE_SYMBOLS = {
  'Arrows': ['→', '←', '↑', '↓', '↔', '↕', '⇒', '⇐', '⇑', '⇓', '⇔', '➜', '➤', '➡', '⬅', '⬆', '⬇'],
  'Checkmarks': ['✓', '✔', '✗', '✘', '☑', '☐', '☒', '⊙', '⊛', '◉', '○', '●'],
  'Stars & Ratings': ['★', '☆', '✩', '✪', '✫', '✬', '✭', '✮', '⭐', '🌟', '💫'],
  'Numbers': ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '❶', '❷', '❸', '❹', '❺'],
  'Bullets': ['•', '◦', '▪', '▫', '►', '▻', '◆', '◇', '■', '□', '▲', '△', '▼', '▽'],
  'Math': ['+', '−', '×', '÷', '=', '≠', '≈', '≤', '≥', '<', '>', '±', '∞', '√', '%'],
  'Hands & Actions': ['👆', '👇', '👈', '👉', '✋', '👍', '👎', '👏', '🤝', '✌️', '☝️'],
  'Alerts': ['⚠️', '❗', '❓', '❕', '❔', '💡', '📌', '📍', '🔔', '⚡', '🔥', '💥'],
  'Learning': ['📚', '📖', '📝', '✏️', '📎', '📋', '🎯', '🏆', '💯', '✅', '❌', '⭕'],
  'Japanese': ['〇', '×', '△', '□', '◎', '※', '♪', '♫', '→', '⇒', '＝', '＋'],
};

// Quick text templates for lectures
const TEXT_TEMPLATES: { label: string; content: string; style: Record<string, string> }[] = [
  { label: 'Tiêu đề', content: 'Tiêu đề', style: { fontSize: '36px', fontWeight: 'bold', textAlign: 'center' } },
  { label: 'Phụ đề', content: 'Phụ đề', style: { fontSize: '24px', fontStyle: 'italic', color: '#7f8c8d' } },
  { label: 'Bullet point', content: '• Điểm quan trọng', style: { fontSize: '20px' } },
  { label: 'Ghi chú', content: '※ Ghi chú:', style: { fontSize: '16px', color: '#e67e22', backgroundColor: '#fff3cd', padding: '8px' } },
  { label: 'Cảnh báo', content: '⚠️ Lưu ý quan trọng', style: { fontSize: '18px', color: '#e74c3c', fontWeight: 'bold' } },
];

// Resize handle types
type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

// Drag state for element manipulation
interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: ResizeHandle | null;
  startX: number;
  startY: number;
  startPosition: { x: number; y: number; width: number; height: number };
}

function generateId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

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
  const [showFurigana, setShowFurigana] = useState(true); // Toggle furigana display
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'design' | 'transitions'>('home');
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete slide confirmation state
  const [deleteSlideConfirm, setDeleteSlideConfirm] = useState<{ index: number } | null>(null);

  // Admin notes state
  const [textSelection, setTextSelection] = useState<{
    elementId: string;
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showAdminNotes, setShowAdminNotes] = useState(true);

  // Lecture form
  const [lectureForm, setLectureForm] = useState<LectureFormData>({
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

  // Enhanced UI State - New features
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
  }, [slides, selectedSlideIndex, hasUnsavedChanges]);

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
          lectureForm,
          currentUser!.id,
          currentUser!.displayName || currentUser!.username
        );
        if (newLecture) {
          setCurrentLectureId(newLecture.id);
        }
      } else if (currentLectureId) {
        await updateLecture(currentLectureId, lectureForm);
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

    // Save current slide first if has changes
    if (hasUnsavedChanges) {
      await handleSaveSlide();
    }

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
      // Wait for Firestore to update, then select new slide
      // We'll use the next slides.length after the update
      const newIndex = slides.length; // Will be valid after Firestore updates
      setTimeout(() => {
        setSelectedSlideIndex(newIndex);
        setHasUnsavedChanges(false);
      }, 300);
    }
  };

  // Select slide
  const handleSelectSlide = async (index: number) => {
    if (hasUnsavedChanges) {
      await handleSaveSlide();
    }

    // Get the slide data directly
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

    let startOrder = mode === 'replace' ? 0 : slides.length;

    if (mode === 'replace' && slides.length > 0) {
      await deleteAllSlides?.();
    }

    // Add each imported slide
    for (let i = 0; i < importedSlides.length; i++) {
      try {
        await addSlide(importedSlides[i], startOrder + i);
      } catch (err) {
        console.error(`Error adding slide ${i + 1}:`, err);
      }
    }

    // Wait for Firestore to sync, then select first imported slide
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

  // Update editing slide (marks as dirty)
  const updateEditingSlide = (updates: Partial<SlideFormData>) => {
    if (!editingSlide) return;
    setEditingSlide({ ...editingSlide, ...updates });
    setHasUnsavedChanges(true);
  };

  // Add element
  const addElement = (type: SlideElement['type']) => {
    if (!editingSlide) return;

    let defaultStyle: Record<string, string> | undefined;
    let defaultPosition = { x: 10, y: 20, width: 80, height: 15 };
    let defaultContent = '';

    switch (type) {
      case 'text':
        defaultContent = 'Nhập nội dung...';
        defaultStyle = {
          fontSize: '24px',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000',
          textAlign: 'left',
          backgroundColor: 'transparent',
          lineHeight: '1.5',
        };
        break;
      case 'shape':
        defaultPosition = { x: 20, y: 30, width: 30, height: 20 };
        defaultStyle = {
          backgroundColor: '#3498db',
          borderRadius: '0px',
          borderWidth: '0px',
          borderStyle: 'solid',
          borderColor: '#000000',
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

    updateEditingSlide({
      elements: [...editingSlide.elements, newElement],
    });
    setSelectedElementId(newElement.id);
  };

  // Add shape element with specific shape type
  const addShapeElement = (shapeType: 'rectangle' | 'circle' | 'line' | 'arrow') => {
    if (!editingSlide) return;

    let position = { x: 20, y: 30, width: 30, height: 20 };
    let style: Record<string, string> = {
      backgroundColor: '#3498db',
      borderWidth: '0px',
      borderStyle: 'solid',
      borderColor: '#000000',
    };

    switch (shapeType) {
      case 'circle':
        style.borderRadius = '50%';
        position = { x: 30, y: 30, width: 20, height: 20 };
        break;
      case 'line':
        position = { x: 10, y: 50, width: 80, height: 0.5 };
        style = {
          backgroundColor: '#000000',
          borderRadius: '0px',
        };
        break;
      case 'arrow':
        position = { x: 10, y: 50, width: 60, height: 3 };
        style = {
          backgroundColor: '#000000',
          borderRadius: '0px',
        };
        break;
      default:
        style.borderRadius = '0px';
    }

    const newElement: SlideElement = {
      id: generateId(),
      type: 'shape',
      content: shapeType,
      position,
      style,
    };

    updateEditingSlide({
      elements: [...editingSlide.elements, newElement],
    });
    setSelectedElementId(newElement.id);
  };

  // Update element
  const updateElement = (id: string, updates: Partial<SlideElement>) => {
    if (!editingSlide) return;
    updateEditingSlide({
      elements: editingSlide.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      ),
    });
  };

  // Update element style
  const updateElementStyle = (id: string, styleUpdates: Record<string, string>) => {
    if (!editingSlide) return;
    updateEditingSlide({
      elements: editingSlide.elements.map(el =>
        el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
      ),
    });
  };

  // Insert symbol into text element
  const insertSymbol = (symbol: string) => {
    if (!selectedElement || selectedElement.type !== 'text') {
      // Create new text element with symbol
      if (!editingSlide) return;
      const newElement: SlideElement = {
        id: generateId(),
        type: 'text',
        content: symbol,
        position: { x: 40, y: 40, width: 20, height: 15 },
        style: { fontSize: '48px', textAlign: 'center' },
      };
      updateEditingSlide({
        elements: [...editingSlide.elements, newElement],
      });
      setSelectedElementId(newElement.id);
    } else {
      // Append symbol to existing text
      updateElement(selectedElement.id, {
        content: selectedElement.content + symbol,
      });
    }
    setShowSymbolPicker(false);
  };

  // Add text with template
  const addTextTemplate = (template: typeof TEXT_TEMPLATES[0]) => {
    if (!editingSlide) return;
    const newElement: SlideElement = {
      id: generateId(),
      type: 'text',
      content: template.content,
      position: { x: 10, y: 20, width: 80, height: 15 },
      style: template.style,
    };
    updateEditingSlide({
      elements: [...editingSlide.elements, newElement],
    });
    setSelectedElementId(newElement.id);
  };

  // Generate furigana for selected text element
  const handleGenerateFurigana = useCallback(async () => {
    if (!selectedElement || selectedElement.type !== 'text') {
      setError('Vui lòng chọn một element text');
      return;
    }

    // Check if already has furigana markup
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
  }, [selectedElement, generateFurigana]);

  // Generate furigana for all text elements in current slide
  const handleGenerateAllFurigana = useCallback(async () => {
    if (!editingSlide) return;

    const textElements = editingSlide.elements.filter(
      el => el.type === 'text' && !hasFurigana(el.content)
    );

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

  // Remove furigana from selected element
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
  }, [selectedElement]);

  // Handle text selection for admin notes
  const handleTextSelect = useCallback((elementId: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setTextSelection(null);
      return;
    }

    const text = selection.toString();
    const range = selection.getRangeAt(0);

    setTextSelection({
      elementId,
      text,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    });
  }, []);

  // Add admin note
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

    const updatedNotes = [...(element.adminNotes || []), newNote];
    updateElement(textSelection.elementId, { adminNotes: updatedNotes });

    setNoteContent('');
    setShowNoteModal(false);
    setTextSelection(null);
  }, [textSelection, noteContent, editingSlide, currentUser, updateElement]);

  // Edit admin note
  const updateAdminNote = useCallback(() => {
    if (!editingNoteId || !noteContent.trim() || !editingSlide) return;

    // Find which element has this note
    const element = editingSlide.elements.find(el =>
      el.adminNotes?.some(n => n.id === editingNoteId)
    );
    if (!element) return;

    const updatedNotes = element.adminNotes?.map(note =>
      note.id === editingNoteId ? { ...note, noteContent: noteContent.trim() } : note
    );
    updateElement(element.id, { adminNotes: updatedNotes });

    setNoteContent('');
    setEditingNoteId(null);
    setShowNoteModal(false);
  }, [editingNoteId, noteContent, editingSlide, updateElement]);

  // Delete admin note
  const deleteAdminNote = useCallback((elementId: string, noteId: string) => {
    if (!editingSlide) return;
    const element = editingSlide.elements.find(el => el.id === elementId);
    if (!element) return;

    const updatedNotes = element.adminNotes?.filter(n => n.id !== noteId);
    updateElement(elementId, { adminNotes: updatedNotes });
  }, [editingSlide, updateElement]);

  // Open note for editing
  const openNoteForEdit = useCallback((note: AdminNote) => {
    setEditingNoteId(note.id);
    setNoteContent(note.noteContent);
    setShowNoteModal(true);
  }, []);

  // Delete element
  const deleteElement = useCallback(() => {
    if (!editingSlide || !selectedElementId) return;
    updateEditingSlide({
      elements: editingSlide.elements.filter(el => el.id !== selectedElementId),
    });
    setSelectedElementId(null);
  }, [editingSlide, selectedElementId]);

  // Copy element to clipboard
  const copyElement = useCallback(() => {
    if (!selectedElement) return;
    setClipboard({ ...selectedElement });
  }, [selectedElement]);

  // Paste element from clipboard
  const pasteElement = useCallback(() => {
    if (!clipboard || !editingSlide) return;
    const newElement: SlideElement = {
      ...clipboard,
      id: generateId(),
      position: {
        ...clipboard.position,
        x: clipboard.position.x + 2,
        y: clipboard.position.y + 2,
      },
    };
    updateEditingSlide({
      elements: [...editingSlide.elements, newElement],
    });
    setSelectedElementId(newElement.id);
  }, [clipboard, editingSlide]);

  // Duplicate element
  const duplicateElement = useCallback(() => {
    if (!selectedElement || !editingSlide) return;
    const newElement: SlideElement = {
      ...selectedElement,
      id: generateId(),
      position: {
        ...selectedElement.position,
        x: selectedElement.position.x + 2,
        y: selectedElement.position.y + 2,
      },
    };
    updateEditingSlide({
      elements: [...editingSlide.elements, newElement],
    });
    setSelectedElementId(newElement.id);
  }, [selectedElement, editingSlide]);

  // Bring element to front
  const bringToFront = useCallback(() => {
    if (!selectedElementId || !editingSlide) return;
    const elements = editingSlide.elements.filter(el => el.id !== selectedElementId);
    const element = editingSlide.elements.find(el => el.id === selectedElementId);
    if (element) {
      updateEditingSlide({ elements: [...elements, element] });
    }
  }, [selectedElementId, editingSlide]);

  // Send element to back
  const sendToBack = useCallback(() => {
    if (!selectedElementId || !editingSlide) return;
    const elements = editingSlide.elements.filter(el => el.id !== selectedElementId);
    const element = editingSlide.elements.find(el => el.id === selectedElementId);
    if (element) {
      updateEditingSlide({ elements: [element, ...elements] });
    }
  }, [selectedElementId, editingSlide]);

  // ============ NEW ENHANCED FEATURES ============

  // Zoom controls
  const handleZoomIn = useCallback(() => setZoom(z => Math.min(200, z + 25)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(25, z - 25)), []);
  const handleZoomReset = useCallback(() => setZoom(100), []);
  const handleZoomFit = useCallback(() => setZoom(100), []); // Could calculate based on container

  // Apply template to current slide
  const handleApplyTemplate = useCallback(async (template: SlideTemplate) => {
    if (!currentLectureId) {
      setError('Vui lòng lưu bài giảng trước');
      return;
    }

    // Save current slide if has changes
    if (hasUnsavedChanges) {
      await handleSaveSlide();
    }

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

  // Layer management - Toggle visibility
  const handleToggleElementVisibility = useCallback((elementId: string) => {
    if (!editingSlide) return;
    const elements = editingSlide.elements.map(el =>
      el.id === elementId ? { ...el, hidden: !el.hidden } : el
    );
    updateEditingSlide({ elements });
  }, [editingSlide, updateEditingSlide]);

  // Layer management - Toggle lock
  const handleToggleElementLock = useCallback((elementId: string) => {
    if (!editingSlide) return;
    const elements = editingSlide.elements.map(el =>
      el.id === elementId ? { ...el, locked: !el.locked } : el
    );
    updateEditingSlide({ elements });
  }, [editingSlide, updateEditingSlide]);

  // Layer management - Reorder element
  const handleMoveElementLayer = useCallback((elementId: string, direction: 'up' | 'down') => {
    if (!editingSlide) return;
    const elements = [...editingSlide.elements];
    const idx = elements.findIndex(el => el.id === elementId);
    if (idx === -1) return;

    // Note: "up" in layers means higher z-index (later in array)
    const newIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= elements.length) return;

    [elements[idx], elements[newIdx]] = [elements[newIdx], elements[idx]];
    updateEditingSlide({ elements });
  }, [editingSlide, updateEditingSlide]);

  // Layer management - Delete element by ID
  const handleDeleteElementById = useCallback((elementId: string) => {
    if (!editingSlide) return;
    updateEditingSlide({
      elements: editingSlide.elements.filter(el => el.id !== elementId),
    });
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [editingSlide, selectedElementId, updateEditingSlide]);

  // Layer management - Duplicate element by ID
  const handleDuplicateElementById = useCallback((elementId: string) => {
    if (!editingSlide) return;
    const element = editingSlide.elements.find(el => el.id === elementId);
    if (!element) return;
    const newElement: SlideElement = {
      ...element,
      id: generateId(),
      position: {
        ...element.position,
        x: element.position.x + 2,
        y: element.position.y + 2,
      },
    };
    updateEditingSlide({
      elements: [...editingSlide.elements, newElement],
    });
    setSelectedElementId(newElement.id);
  }, [editingSlide, updateEditingSlide]);

  // Alignment - Align selected element
  const handleAlignElement = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElement || !editingSlide) return;
    const pos = { ...selectedElement.position };

    switch (alignment) {
      case 'left': pos.x = 0; break;
      case 'center': pos.x = 50 - pos.width / 2; break;
      case 'right': pos.x = 100 - pos.width; break;
      case 'top': pos.y = 0; break;
      case 'middle': pos.y = 50 - pos.height / 2; break;
      case 'bottom': pos.y = 100 - pos.height; break;
    }

    updateElement(selectedElementId!, { position: pos });
  }, [selectedElement, selectedElementId, editingSlide, updateElement]);

  // Quick add shape
  const handleQuickAddShape = useCallback((shape: 'rectangle' | 'circle' | 'line' | 'arrow') => {
    if (!editingSlide) return;
    const shapeStyles: Record<string, React.CSSProperties> = {
      rectangle: { backgroundColor: '#3498db', borderRadius: '4px' },
      circle: { backgroundColor: '#e74c3c', borderRadius: '50%' },
      line: { backgroundColor: '#2c3e50', height: '4px' },
      arrow: { backgroundColor: 'transparent' },
    };

    const newElement: SlideElement = {
      id: generateId(),
      type: 'shape',
      content: shape === 'arrow' ? '→' : '',
      position: { x: 30, y: 30, width: shape === 'line' ? 40 : 20, height: shape === 'line' ? 1 : 20 },
      style: shapeStyles[shape],
    };
    updateEditingSlide({
      elements: [...editingSlide.elements, newElement],
    });
    setSelectedElementId(newElement.id);
    setShowQuickPanel(false);
  }, [editingSlide, updateEditingSlide]);

  // ============ ADVANCED FEATURES HANDLERS ============

  // Apply text effect to selected element
  const handleApplyTextEffect = useCallback((effect: TextEffect) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    updateElementStyle(selectedElement.id, effect.style);
    setShowTextEffects(false);
  }, [selectedElement, updateElementStyle]);

  // Apply shape effect to selected element
  const handleApplyShapeEffect = useCallback((effect: ShapeEffect) => {
    if (!selectedElement || selectedElement.type !== 'shape') return;
    updateElementStyle(selectedElement.id, effect.style);
    setShowShapeEffects(false);
  }, [selectedElement, updateElementStyle]);

  // Apply gradient background to slide
  const handleApplyGradient = useCallback((gradient: GradientPreset) => {
    if (!editingSlide) return;
    updateEditingSlide({ backgroundColor: gradient.value });
    setShowGradientPanel(false);
  }, [editingSlide, updateEditingSlide]);

  // Apply animation to selected element
  const handleApplyAnimation = useCallback((animation: ElementAnimation) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, {
      animation: animation.id,
      animationDuration: animation.duration
    });
    setShowAnimationsPanel(false);
  }, [selectedElement, updateElement]);

  // Preview animation on element
  const handlePreviewAnimation = useCallback((animation: ElementAnimation) => {
    if (!selectedElement) return;
    const element = document.querySelector(`[data-element-id="${selectedElement.id}"]`);
    if (element) {
      element.classList.remove('le-animate');
      void (element as HTMLElement).offsetWidth; // Trigger reflow
      (element as HTMLElement).style.animation = `${animation.keyframes} ${animation.duration}ms ease`;
      setTimeout(() => {
        (element as HTMLElement).style.animation = '';
      }, animation.duration);
    }
  }, [selectedElement]);

  // Apply theme to current slide
  const handleApplyTheme = useCallback((theme: SlideTheme) => {
    if (!editingSlide) return;
    updateEditingSlide({
      backgroundColor: theme.backgroundColor,
    });
    // Also update title style if there's a title element
    // This is a simplified implementation
    setShowThemesPanel(false);
  }, [editingSlide, updateEditingSlide]);

  // Update element rotation
  const handleRotateElement = useCallback((rotation: number) => {
    if (!selectedElement) return;
    updateElementStyle(selectedElement.id, { transform: `rotate(${rotation}deg)` });
  }, [selectedElement, updateElementStyle]);

  // Update element opacity
  const handleOpacityChange = useCallback((opacity: number) => {
    if (!selectedElement) return;
    updateElementStyle(selectedElement.id, { opacity: opacity / 100 });
  }, [selectedElement, updateElementStyle]);

  // Update element border
  const handleBorderChange = useCallback((borderProps: Partial<{
    borderWidth: number;
    borderColor: string;
    borderStyle: string;
    borderRadius: number;
  }>) => {
    if (!selectedElement) return;
    const style: Record<string, string> = {};
    if (borderProps.borderWidth !== undefined) style.borderWidth = `${borderProps.borderWidth}px`;
    if (borderProps.borderColor) style.borderColor = borderProps.borderColor;
    if (borderProps.borderStyle) style.borderStyle = borderProps.borderStyle;
    if (borderProps.borderRadius !== undefined) style.borderRadius = `${borderProps.borderRadius}px`;
    updateElementStyle(selectedElement.id, style);
  }, [selectedElement, updateElementStyle]);

  // Undo/Redo handlers
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

  // Push to history when slide changes
  const pushToHistory = useCallback(() => {
    if (editingSlide) {
      setHistory(prev => pushHistory(prev, editingSlide));
    }
  }, [editingSlide]);

  // Start dragging element
  const handleDragStart = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const element = editingSlide?.elements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElementId(elementId);
    setDragState({
      isDragging: true,
      isResizing: false,
      resizeHandle: null,
      startX: e.clientX,
      startY: e.clientY,
      startPosition: { ...element.position },
    });
  }, [editingSlide]);

  // Start resizing element
  const handleResizeStart = useCallback((e: React.MouseEvent, elementId: string, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    const element = editingSlide?.elements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElementId(elementId);
    setDragState({
      isDragging: false,
      isResizing: true,
      resizeHandle: handle,
      startX: e.clientX,
      startY: e.clientY,
      startPosition: { ...element.position },
    });
  }, [editingSlide]);

  // Handle mouse move for drag/resize
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging && !dragState.isResizing) return;
    if (!canvasRef.current || !selectedElementId) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100;

    if (dragState.isDragging) {
      // Move element
      const newX = Math.max(0, Math.min(100 - dragState.startPosition.width, dragState.startPosition.x + deltaX));
      const newY = Math.max(0, Math.min(100 - dragState.startPosition.height, dragState.startPosition.y + deltaY));
      updateElement(selectedElementId, {
        position: {
          ...dragState.startPosition,
          x: newX,
          y: newY,
        },
      });
    } else if (dragState.isResizing && dragState.resizeHandle) {
      // Resize element
      let { x, y, width, height } = dragState.startPosition;
      const handle = dragState.resizeHandle;

      // Adjust based on handle position
      if (handle.includes('w')) {
        const newX = Math.max(0, x + deltaX);
        const newWidth = width - (newX - x);
        if (newWidth >= 5) { x = newX; width = newWidth; }
      }
      if (handle.includes('e')) {
        width = Math.max(5, Math.min(100 - x, width + deltaX));
      }
      if (handle.includes('n')) {
        const newY = Math.max(0, y + deltaY);
        const newHeight = height - (newY - y);
        if (newHeight >= 5) { y = newY; height = newHeight; }
      }
      if (handle.includes('s')) {
        height = Math.max(5, Math.min(100 - y, height + deltaY));
      }

      updateElement(selectedElementId, { position: { x, y, width, height } });
    }
  }, [dragState, selectedElementId, updateElement]);

  // Handle mouse up - end drag/resize
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging || dragState.isResizing) {
      setDragState({
        isDragging: false,
        isResizing: false,
        resizeHandle: null,
        startX: 0,
        startY: 0,
        startPosition: { x: 0, y: 0, width: 0, height: 0 },
      });
    }
  }, [dragState]);

  // Handle image upload for element
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (selectedElementId && selectedElement?.type === 'image') {
        updateElement(selectedElementId, { content: reader.result as string });
      } else {
        // Add new image element
        const newElement: SlideElement = {
          id: generateId(),
          type: 'image',
          content: reader.result as string,
          position: { x: 10, y: 20, width: 60, height: 50 },
        };
        updateEditingSlide({
          elements: [...(editingSlide?.elements || []), newElement],
        });
        setSelectedElementId(newElement.id);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when editing text input
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveSlide();
      }
      // Undo: Ctrl/Cmd + Z
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !isEditing) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) && !isEditing) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'Delete' && selectedElementId && !isEditing) {
        e.preventDefault();
        deleteElement();
      }
      // Copy: Ctrl/Cmd + C
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedElementId && !isEditing) {
        e.preventDefault();
        copyElement();
      }
      // Paste: Ctrl/Cmd + V
      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && clipboard && !isEditing) {
        e.preventDefault();
        pasteElement();
      }
      // Duplicate: Ctrl/Cmd + D
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedElementId && !isEditing) {
        e.preventDefault();
        duplicateElement();
      }
      // Escape: Deselect element
      if (e.key === 'Escape') {
        setSelectedElementId(null);
        setIsEditingTitle(false);
      }
      // Arrow keys: Move element
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

  // Render slide thumbnail
  const renderThumbnail = (slide: Slide, index: number) => (
    <div
      key={slide.id}
      className={`ppt-thumbnail ${selectedSlideIndex === index ? 'active' : ''}`}
      onClick={() => handleSelectSlide(index)}
    >
      <span className="ppt-thumbnail-num">{index + 1}</span>
      <div
        className="ppt-thumbnail-preview"
        style={{
          backgroundColor: slide.backgroundColor || '#fff',
          backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
          backgroundSize: 'cover',
        }}
      >
        {slide.title && <div className="ppt-thumb-title">{slide.title}</div>}
        {slide.elements.slice(0, 2).map(el => (
          <div key={el.id} className="ppt-thumb-element">
            {el.type === 'text' ? el.content.substring(0, 15) + (el.content.length > 15 ? '...' : '') : `[${el.type}]`}
          </div>
        ))}
      </div>
      <div className="ppt-thumbnail-actions">
        <button onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id); }} title="Nhân đôi">
          <CopyPlus size={12} />
        </button>
        <button onClick={(e) => handleDeleteSlideClick(index, e)} title="Xóa">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  // Render resize handles for selected element
  const renderResizeHandles = (elementId: string) => {
    const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
    return handles.map(handle => (
      <div
        key={handle}
        className={`ppt-resize-handle ppt-resize-${handle}`}
        onMouseDown={(e) => handleResizeStart(e, elementId, handle)}
      />
    ));
  };

  // Render element on canvas
  const renderElement = (element: SlideElement) => {
    const isSelected = selectedElementId === element.id;
    const isDraggingThis = dragState.isDragging && isSelected;
    const isResizingThis = dragState.isResizing && isSelected;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: `${element.position.width}%`,
      height: `${element.position.height}%`,
      ...(element.style as React.CSSProperties || {}),
      border: isSelected ? '2px solid #3498db' : '1px dashed transparent',
      cursor: isDraggingThis ? 'grabbing' : isSelected ? 'grab' : 'pointer',
      boxSizing: 'border-box',
      overflow: 'hidden',
      userSelect: isDraggingThis || isResizingThis ? 'none' : 'auto',
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!dragState.isDragging && !dragState.isResizing) {
        setSelectedElementId(element.id);
      }
    };

    // Context menu handler
    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setSelectedElementId(element.id);
    };

    if (element.type === 'text') {
      // Extract box-level styles vs text-level styles
      const boxBackground = element.style?.boxBackground || 'transparent';
      const padding = element.style?.padding || '0px';
      const borderRadius = element.style?.borderRadius || '0px';

      // Apply boxBackground to the container
      const containerStyle: React.CSSProperties = {
        ...style,
        backgroundColor: boxBackground !== 'transparent' ? boxBackground : (element.style?.backgroundColor === 'transparent' ? 'transparent' : undefined),
        padding,
        borderRadius,
      };

      // Text content styles (excluding box-level styles)
      const textStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        outline: 'none',
        overflow: 'auto',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        backgroundColor: element.style?.backgroundColor && element.style.backgroundColor !== 'transparent' && !boxBackground ? element.style.backgroundColor : 'transparent',
      };

      const hasSelection = textSelection?.elementId === element.id && textSelection.text;
      const elementNotes = element.adminNotes || [];

      return (
        <div
          key={element.id}
          className={`ppt-element ppt-text-box ${isSelected ? 'selected' : ''}`}
          style={containerStyle}
          onClick={handleClick}
          onMouseDown={(e) => {
            // Only start drag if not clicking on resize handle
            if (!(e.target as HTMLElement).classList.contains('ppt-resize-handle')) {
              handleDragStart(e, element.id);
            }
          }}
          onMouseUp={() => handleTextSelect(element.id)}
          onContextMenu={handleContextMenu}
        >
          {/* Show editable raw text when selected, or furigana-rendered text otherwise */}
          {isSelected && !dragState.isDragging ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateElement(element.id, { content: e.currentTarget.textContent || '' })}
              style={textStyle}
            >
              {element.content}
            </div>
          ) : (
            <div
              style={textStyle}
              dangerouslySetInnerHTML={{
                __html: showFurigana
                  ? convertFuriganaToRuby(element.content).replace(/\n/g, '<br/>')
                  : removeFurigana(element.content).replace(/\n/g, '<br/>')
              }}
            />
          )}

          {/* +Note button when text is selected */}
          {hasSelection && isSelected && (
            <button
              className="ppt-add-note-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowNoteModal(true);
              }}
              title="Thêm ghi chú admin"
            >
              +Note
            </button>
          )}

          {/* Admin notes indicators */}
          {showAdminNotes && elementNotes.length > 0 && (
            <div className="ppt-admin-notes-container">
              {elementNotes.map((note, idx) => (
                <div key={note.id} className="ppt-admin-note" style={{ top: `${idx * 28 + 4}px` }}>
                  <span className="ppt-admin-note-marker" title={note.selectedText}><StickyNote size={14} /></span>
                  <div className="ppt-admin-note-popup">
                    <div className="ppt-admin-note-header">
                      <span className="ppt-admin-note-text">"{note.selectedText}"</span>
                      <div className="ppt-admin-note-actions">
                        <button onClick={() => openNoteForEdit(note)} title="Sửa"><Pencil size={12} /></button>
                        <button onClick={() => deleteAdminNote(element.id, note.id)} title="Xóa"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="ppt-admin-note-content">{note.noteContent}</div>
                    <div className="ppt-admin-note-meta">
                      {note.createdBy} • {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isSelected && renderResizeHandles(element.id)}
        </div>
      );
    }

    if (element.type === 'image') {
      return (
        <div
          key={element.id}
          className={`ppt-element ${isSelected ? 'selected' : ''}`}
          style={style}
          onClick={handleClick}
          onMouseDown={(e) => {
            if (!(e.target as HTMLElement).classList.contains('ppt-resize-handle')) {
              handleDragStart(e, element.id);
            }
          }}
          onContextMenu={handleContextMenu}
        >
          {element.content ? (
            <img
              src={element.content}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
              draggable={false}
            />
          ) : (
            <div className="ppt-placeholder">📷 Click để thêm ảnh</div>
          )}
          {isSelected && renderResizeHandles(element.id)}
        </div>
      );
    }

    // Shape elements (rectangle, circle, line, arrow)
    if (element.type === 'shape') {
      const shapeType = element.content || 'rectangle';
      let shapeContent: React.ReactNode = null;

      // Arrow head for arrow shape
      if (shapeType === 'arrow') {
        shapeContent = (
          <div
            style={{
              position: 'absolute',
              right: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderLeft: '12px solid ' + (element.style?.backgroundColor || '#000'),
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
            }}
          />
        );
      }

      return (
        <div
          key={element.id}
          className={`ppt-element ppt-shape ppt-shape-${shapeType} ${isSelected ? 'selected' : ''}`}
          style={style}
          onClick={handleClick}
          onMouseDown={(e) => {
            if (!(e.target as HTMLElement).classList.contains('ppt-resize-handle')) {
              handleDragStart(e, element.id);
            }
          }}
          onContextMenu={handleContextMenu}
        >
          {shapeContent}
          {isSelected && renderResizeHandles(element.id)}
        </div>
      );
    }

    // Video element
    if (element.type === 'video') {
      return (
        <div
          key={element.id}
          className={`ppt-element ${isSelected ? 'selected' : ''}`}
          style={style}
          onClick={handleClick}
          onMouseDown={(e) => {
            if (!(e.target as HTMLElement).classList.contains('ppt-resize-handle')) {
              handleDragStart(e, element.id);
            }
          }}
          onContextMenu={handleContextMenu}
        >
          {element.content ? (
            <video
              src={element.content}
              style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
              controls
            />
          ) : (
            <div className="ppt-placeholder">🎬 Video URL</div>
          )}
          {isSelected && renderResizeHandles(element.id)}
        </div>
      );
    }

    // Audio element
    if (element.type === 'audio') {
      return (
        <div
          key={element.id}
          className={`ppt-element ${isSelected ? 'selected' : ''}`}
          style={{...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--light)'}}
          onClick={handleClick}
          onMouseDown={(e) => {
            if (!(e.target as HTMLElement).classList.contains('ppt-resize-handle')) {
              handleDragStart(e, element.id);
            }
          }}
          onContextMenu={handleContextMenu}
        >
          {element.content ? (
            <audio src={element.content} controls style={{ width: '90%' }} />
          ) : (
            <div className="ppt-placeholder">🔊 Audio URL</div>
          )}
          {isSelected && renderResizeHandles(element.id)}
        </div>
      );
    }

    // Default fallback
    return (
      <div
        key={element.id}
        className={`ppt-element ${isSelected ? 'selected' : ''}`}
        style={style}
        onClick={handleClick}
        onMouseDown={(e) => {
          if (!(e.target as HTMLElement).classList.contains('ppt-resize-handle')) {
            handleDragStart(e, element.id);
          }
        }}
        onContextMenu={handleContextMenu}
      >
        [{element.type}]
        {isSelected && renderResizeHandles(element.id)}
      </div>
    );
  };

  return (
    <div className="ppt-editor">
      {/* Top Header */}
      <header className="ppt-header">
        <div className="ppt-header-left">
          <button className="ppt-btn ppt-btn-icon" onClick={onBack} title="Quay lại">
            <ArrowLeft size={18} />
          </button>
          <input
            type="text"
            className="ppt-title-input"
            value={lectureForm.title}
            onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
            placeholder="Tiêu đề bài giảng..."
          />
          {hasUnsavedChanges && <span className="ppt-unsaved-badge">●</span>}
        </div>
        <div className="ppt-header-right">
          {/* Undo/Redo */}
          <UndoRedoToolbar
            canUndo={canUndo(history)}
            canRedo={canRedo(history)}
            onUndo={handleUndo}
            onRedo={handleRedo}
            historyLength={history.past.length}
          />
          {/* Shortcuts Help */}
          <button
            className="ppt-btn ppt-btn-ghost"
            onClick={() => setShowShortcutsPanel(true)}
            title="Phím tắt"
          >
            <span style={{ fontSize: '14px' }}>⌨️</span>
          </button>
          <button className="ppt-btn ppt-btn-ghost" onClick={() => setShowSettingsPanel(!showSettingsPanel)} title="Cài đặt">
            <Settings size={16} />
            <span>Cài đặt</span>
          </button>
          <button className="ppt-btn ppt-btn-ghost" onClick={() => setShowImportModal(true)} disabled={isNew} title="Import PPTX">
            <Download size={16} />
            <span>Import</span>
          </button>
          <button className="ppt-btn ppt-btn-ghost" onClick={handleExportPPTX} disabled={slides.length === 0 || exportLoading} title="Export PPTX">
            <Upload size={16} />
            <span>{exportLoading ? '...' : 'Export'}</span>
          </button>
          <button
            className={`ppt-btn ppt-btn-ghost ${showAdminNotes ? 'active' : ''}`}
            onClick={() => setShowAdminNotes(!showAdminNotes)}
            title="Hiện/ẩn ghi chú admin"
          >
            <StickyNote size={16} />
            <span>Notes</span>
          </button>
          <button className="ppt-btn ppt-btn-primary" onClick={handleSaveLecture} disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Đang lưu...' : 'Lưu'}</span>
          </button>
        </div>
      </header>

      {/* Ribbon Toolbar */}
      <div className="ppt-ribbon">
        {/* Tabs */}
        <div className="ppt-ribbon-tabs">
          <button className={`ppt-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Home</button>
          <button className={`ppt-tab ${activeTab === 'insert' ? 'active' : ''}`} onClick={() => setActiveTab('insert')}>Insert</button>
          <button className={`ppt-tab ${activeTab === 'design' ? 'active' : ''}`} onClick={() => setActiveTab('design')}>Design</button>
          <button className={`ppt-tab ${activeTab === 'transitions' ? 'active' : ''}`} onClick={() => setActiveTab('transitions')}>Transitions</button>
          {/* Templates Quick Access */}
          <button
            className="le-templates-trigger"
            onClick={() => setShowTemplatesPanel(!showTemplatesPanel)}
            disabled={isNew}
            title="Chọn mẫu slide"
          >
            <LayoutGrid size={16} />
            <span>Mẫu Slide</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="ppt-ribbon-content">
          {activeTab === 'home' && (
            <>
              {/* Clipboard */}
              <div className="ppt-ribbon-group">
                <div className="ppt-ribbon-group-content">
                  <button className="ppt-ribbon-btn ppt-ribbon-btn-lg" onClick={handleAddSlide} disabled={isNew}>
                    <Plus size={20} />
                    <span>Slide</span>
                  </button>
                  {selectedElement && (
                    <>
                      <button className="ppt-ribbon-btn" onClick={copyElement} title="Ctrl+C">
                        <Copy size={16} />
                        <span>Copy</span>
                      </button>
                      <button className="ppt-ribbon-btn" onClick={pasteElement} disabled={!clipboard} title="Ctrl+V">
                        <Clipboard size={16} />
                        <span>Paste</span>
                      </button>
                      <button className="ppt-ribbon-btn" onClick={duplicateElement} title="Ctrl+D">
                        <CopyPlus size={16} />
                        <span>Nhân đôi</span>
                      </button>
                    </>
                  )}
                </div>
                <span className="ppt-ribbon-group-label">Clipboard</span>
              </div>

              {/* Font */}
              {selectedElement?.type === 'text' && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content">
                    <select
                      className="ppt-ribbon-select"
                      value={selectedElement.style?.fontFamily || 'Arial'}
                      onChange={(e) => updateElementStyle(selectedElement.id, { fontFamily: e.target.value })}
                      title="Font"
                    >
                      {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select
                      className="ppt-ribbon-select ppt-ribbon-select-sm"
                      value={parseInt(selectedElement.style?.fontSize || '24')}
                      onChange={(e) => updateElementStyle(selectedElement.id, { fontSize: `${e.target.value}px` })}
                      title="Cỡ chữ"
                    >
                      {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="ppt-ribbon-btn-group">
                      <button
                        className={`ppt-ribbon-btn-sm ${selectedElement.style?.fontWeight === 'bold' ? 'active' : ''}`}
                        onClick={() => updateElementStyle(selectedElement.id, { fontWeight: selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        title="In đậm (Ctrl+B)"
                      ><Bold size={14} /></button>
                      <button
                        className={`ppt-ribbon-btn-sm ${selectedElement.style?.fontStyle === 'italic' ? 'active' : ''}`}
                        onClick={() => updateElementStyle(selectedElement.id, { fontStyle: selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                        title="In nghiêng (Ctrl+I)"
                      ><Italic size={14} /></button>
                      <button
                        className={`ppt-ribbon-btn-sm ${selectedElement.style?.textDecoration === 'underline' ? 'active' : ''}`}
                        onClick={() => updateElementStyle(selectedElement.id, { textDecoration: selectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline' })}
                        title="Gạch chân (Ctrl+U)"
                      ><Underline size={14} /></button>
                      <button
                        className={`ppt-ribbon-btn-sm ${selectedElement.style?.textDecoration === 'line-through' ? 'active' : ''}`}
                        onClick={() => updateElementStyle(selectedElement.id, { textDecoration: selectedElement.style?.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                        title="Gạch ngang"
                      ><Strikethrough size={14} /></button>
                    </div>
                  </div>
                  <span className="ppt-ribbon-group-label">Font</span>
                </div>
              )}

              {/* Text Color & Highlight */}
              {selectedElement?.type === 'text' && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content">
                    <div className="ppt-color-section">
                      <label className="ppt-ribbon-mini-label">Màu chữ</label>
                      <div className="ppt-color-picker">
                        {COLORS.slice(0, 9).map(c => (
                          <button
                            key={c}
                            className={`ppt-color-btn ${selectedElement.style?.color === c ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => updateElementStyle(selectedElement.id, { color: c })}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="ppt-color-section">
                      <label className="ppt-ribbon-mini-label">Highlight</label>
                      <div className="ppt-color-picker">
                        {HIGHLIGHT_COLORS.slice(0, 6).map(c => (
                          <button
                            key={c}
                            className={`ppt-color-btn ${selectedElement.style?.backgroundColor === c ? 'active' : ''}`}
                            style={{ backgroundColor: c === 'transparent' ? '#fff' : c, border: c === 'transparent' ? '1px dashed #ccc' : undefined }}
                            onClick={() => updateElementStyle(selectedElement.id, { backgroundColor: c })}
                            title={c === 'transparent' ? 'Không' : c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="ppt-ribbon-group-label">Màu sắc</span>
                </div>
              )}

              {/* Shape Fill Color */}
              {selectedElement?.type === 'shape' && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content">
                    <div className="ppt-color-section">
                      <label className="ppt-ribbon-mini-label">Màu nền</label>
                      <div className="ppt-color-picker">
                        {COLORS.slice(0, 12).map(c => (
                          <button
                            key={c}
                            className={`ppt-color-btn ${selectedElement.style?.backgroundColor === c ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => updateElementStyle(selectedElement.id, { backgroundColor: c })}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="ppt-ribbon-group-label">Màu Shape</span>
                </div>
              )}

              {/* Paragraph */}
              {selectedElement?.type === 'text' && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content">
                    <div className="ppt-ribbon-btn-group">
                      <button
                        className={`ppt-ribbon-btn-sm ${selectedElement.style?.textAlign === 'left' ? 'active' : ''}`}
                        onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'left' })}
                        title="Căn trái"
                      ><AlignLeft size={14} /></button>
                      <button
                        className={`ppt-ribbon-btn-sm ${selectedElement.style?.textAlign === 'center' ? 'active' : ''}`}
                        onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'center' })}
                        title="Căn giữa"
                      ><AlignCenter size={14} /></button>
                      <button
                        className={`ppt-ribbon-btn-sm ${selectedElement.style?.textAlign === 'right' ? 'active' : ''}`}
                        onClick={() => updateElementStyle(selectedElement.id, { textAlign: 'right' })}
                        title="Căn phải"
                      ><AlignRight size={14} /></button>
                    </div>
                    <select
                      className="ppt-ribbon-select ppt-ribbon-select-sm"
                      value={selectedElement.style?.lineHeight || '1.5'}
                      onChange={(e) => updateElementStyle(selectedElement.id, { lineHeight: e.target.value })}
                      title="Khoảng cách dòng"
                    >
                      {LINE_HEIGHTS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <span className="ppt-ribbon-group-label">Đoạn văn</span>
                </div>
              )}

              {/* Text Box Background & Padding */}
              {selectedElement?.type === 'text' && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content">
                    <div className="ppt-color-section">
                      <label className="ppt-ribbon-mini-label">Nền khung</label>
                      <div className="ppt-color-picker">
                        {BOX_BACKGROUNDS.slice(0, 8).map((c, i) => (
                          <button
                            key={i}
                            className={`ppt-color-btn ${selectedElement.style?.boxBackground === c ? 'active' : ''}`}
                            style={{
                              backgroundColor: c === 'transparent' ? '#fff' : c,
                              border: c === 'transparent' ? '1px dashed #ccc' : undefined,
                              backgroundImage: c.startsWith('rgba') ? `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)` : undefined,
                              backgroundSize: c.startsWith('rgba') ? '8px 8px' : undefined,
                              backgroundPosition: c.startsWith('rgba') ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
                            }}
                            onClick={() => updateElementStyle(selectedElement.id, { boxBackground: c })}
                            title={c === 'transparent' ? 'Không' : c}
                          />
                        ))}
                      </div>
                    </div>
                    <select
                      className="ppt-ribbon-select ppt-ribbon-select-sm"
                      value={selectedElement.style?.padding?.replace('px', '') || '0'}
                      onChange={(e) => updateElementStyle(selectedElement.id, { padding: `${e.target.value}px` })}
                      title="Padding"
                    >
                      {PADDING_SIZES.map(p => <option key={p} value={p}>{p}px</option>)}
                    </select>
                    <select
                      className="ppt-ribbon-select ppt-ribbon-select-sm"
                      value={selectedElement.style?.borderRadius?.replace('px', '') || '0'}
                      onChange={(e) => updateElementStyle(selectedElement.id, { borderRadius: `${e.target.value}px` })}
                      title="Bo góc"
                    >
                      {['0', '4', '8', '12', '16', '20', '24'].map(r => <option key={r} value={r}>{r}px</option>)}
                    </select>
                  </div>
                  <span className="ppt-ribbon-group-label">Khung Text</span>
                </div>
              )}

              {/* Element styling - for all elements */}
              {selectedElement && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content">
                    <select
                      className="ppt-ribbon-select ppt-ribbon-select-sm"
                      value={selectedElement.style?.opacity ? String(Math.round(parseFloat(selectedElement.style.opacity) * 100)) : '100'}
                      onChange={(e) => updateElementStyle(selectedElement.id, { opacity: String(parseInt(e.target.value) / 100) })}
                      title="Độ trong suốt"
                    >
                      {OPACITIES.map(o => <option key={o} value={o}>{o}%</option>)}
                    </select>
                    <select
                      className="ppt-ribbon-select ppt-ribbon-select-sm"
                      value={selectedElement.style?.borderWidth?.replace('px', '') || '0'}
                      onChange={(e) => updateElementStyle(selectedElement.id, {
                        borderWidth: `${e.target.value}px`,
                        borderStyle: selectedElement.style?.borderStyle || 'solid',
                        borderColor: selectedElement.style?.borderColor || '#000000'
                      })}
                      title="Độ dày viền"
                    >
                      {BORDER_WIDTHS.map(w => <option key={w} value={w}>{w}px</option>)}
                    </select>
                    {selectedElement.style?.borderWidth && selectedElement.style.borderWidth !== '0px' && (
                      <>
                        <select
                          className="ppt-ribbon-select ppt-ribbon-select-sm"
                          value={selectedElement.style?.borderStyle || 'solid'}
                          onChange={(e) => updateElementStyle(selectedElement.id, { borderStyle: e.target.value })}
                          title="Kiểu viền"
                        >
                          {BORDER_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input
                          type="color"
                          className="ppt-color-input"
                          value={selectedElement.style?.borderColor || '#000000'}
                          onChange={(e) => updateElementStyle(selectedElement.id, { borderColor: e.target.value })}
                          title="Màu viền"
                        />
                      </>
                    )}
                  </div>
                  <span className="ppt-ribbon-group-label">Kiểu dáng</span>
                </div>
              )}

              {/* Layer & Delete */}
              {selectedElement && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content">
                    <button className="ppt-ribbon-btn-sm" onClick={bringToFront} title="Đưa lên trên">
                      <MoveUp size={14} />
                    </button>
                    <button className="ppt-ribbon-btn-sm" onClick={sendToBack} title="Đưa xuống dưới">
                      <MoveDown size={14} />
                    </button>
                    <button className="ppt-ribbon-btn-sm ppt-ribbon-btn-danger" onClick={deleteElement} title="Xóa (Delete)">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <span className="ppt-ribbon-group-label">Sắp xếp</span>
                </div>
              )}
            </>
          )}

          {activeTab === 'insert' && (
            <>
              {/* Text & Media */}
              <div className="ppt-ribbon-group">
                <div className="ppt-ribbon-group-content">
                  <button className="ppt-ribbon-btn ppt-ribbon-btn-lg" onClick={() => addElement('text')} disabled={!editingSlide}>
                    <Type size={20} />
                    <span>Text</span>
                  </button>
                  <button className="ppt-ribbon-btn" onClick={() => imageInputRef.current?.click()} disabled={!editingSlide}>
                    <Image size={16} />
                    <span>Ảnh</span>
                  </button>
                  <button className="ppt-ribbon-btn" onClick={() => addElement('video')} disabled={!editingSlide}>
                    <Video size={16} />
                    <span>Video</span>
                  </button>
                  <button className="ppt-ribbon-btn" onClick={() => addElement('audio')} disabled={!editingSlide}>
                    <Volume2 size={16} />
                    <span>Audio</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Media</span>
              </div>

              {/* Shapes */}
              <div className="ppt-ribbon-group">
                <div className="ppt-ribbon-group-content">
                  <button className="ppt-ribbon-btn" onClick={() => addElement('shape')} disabled={!editingSlide} title="Hình chữ nhật">
                    <Square size={16} />
                    <span>Chữ nhật</span>
                  </button>
                  <button className="ppt-ribbon-btn" onClick={() => addShapeElement('circle')} disabled={!editingSlide} title="Hình tròn">
                    <Circle size={16} />
                    <span>Tròn</span>
                  </button>
                  <button className="ppt-ribbon-btn" onClick={() => addShapeElement('line')} disabled={!editingSlide} title="Đường thẳng">
                    <Minus size={16} />
                    <span>Line</span>
                  </button>
                  <button className="ppt-ribbon-btn" onClick={() => addShapeElement('arrow')} disabled={!editingSlide} title="Mũi tên">
                    <ArrowRight size={16} />
                    <span>Arrow</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Shapes</span>
              </div>

              {/* Symbols & Icons */}
              <div className="ppt-ribbon-group">
                <div className="ppt-ribbon-group-content">
                  <button className="ppt-ribbon-btn" onClick={() => setShowSymbolPicker(!showSymbolPicker)} disabled={!editingSlide}>
                    <Sparkles size={16} />
                    <span>Biểu tượng</span>
                  </button>
                  {/* Quick symbols */}
                  <div className="ppt-quick-symbols">
                    {['→', '✓', '★', '•', '①', '⚠️', '💡', '📌'].map(s => (
                      <button
                        key={s}
                        className="ppt-symbol-btn"
                        onClick={() => insertSymbol(s)}
                        disabled={!editingSlide}
                        title={`Chèn ${s}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="ppt-ribbon-group-label">Biểu tượng</span>
              </div>

              {/* Text Templates */}
              <div className="ppt-ribbon-group">
                <div className="ppt-ribbon-group-content">
                  {TEXT_TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      className="ppt-ribbon-btn"
                      onClick={() => addTextTemplate(t)}
                      disabled={!editingSlide}
                      title={t.label}
                    >
                      <FileText size={14} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
                <span className="ppt-ribbon-group-label">Mẫu Text</span>
              </div>

              {/* Furigana */}
              <div className="ppt-ribbon-group">
                <div className="ppt-ribbon-group-content">
                  <button
                    className="ppt-ribbon-btn"
                    onClick={handleGenerateFurigana}
                    disabled={!selectedElement || selectedElement.type !== 'text' || furiganaLoading}
                    title="Tự động thêm furigana cho text đang chọn"
                  >
                    <Wand2 size={16} />
                    <span>{furiganaLoading ? '...' : 'Furigana'}</span>
                  </button>
                  <button
                    className="ppt-ribbon-btn"
                    onClick={handleGenerateAllFurigana}
                    disabled={!editingSlide || furiganaLoading}
                    title="Thêm furigana cho tất cả text trong slide"
                  >
                    <span className="ppt-ribbon-icon-text">全</span>
                    <span>Tất cả</span>
                  </button>
                  <button
                    className="ppt-ribbon-btn"
                    onClick={handleRemoveFurigana}
                    disabled={!selectedElement || selectedElement.type !== 'text'}
                    title="Xóa furigana khỏi text đang chọn"
                  >
                    <X size={16} />
                    <span>Xóa</span>
                  </button>
                  <button
                    className={`ppt-ribbon-btn ${showFurigana ? 'active' : ''}`}
                    onClick={() => setShowFurigana(!showFurigana)}
                    title={showFurigana ? 'Ẩn furigana' : 'Hiện furigana'}
                  >
                    {showFurigana ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span>{showFurigana ? 'Ẩn' : 'Hiện'}</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Furigana</span>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </>
          )}

          {activeTab === 'design' && editingSlide && (
            <>
              {/* Basic Colors */}
              <div className="ppt-ribbon-group">
                <div className="ppt-ribbon-group-content">
                  <div className="ppt-color-picker">
                    {COLORS.slice(0, 12).map(c => (
                      <button
                        key={c}
                        className={`ppt-color-btn ${editingSlide.backgroundColor === c ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => updateEditingSlide({ backgroundColor: c })}
                      />
                    ))}
                  </div>
                </div>
                <span className="ppt-ribbon-group-label">Màu nền</span>
              </div>

              {/* Gradient & Theme */}
              <div className="ppt-ribbon-group">
                <div className="ppt-ribbon-group-content">
                  <button className="ppt-ribbon-btn" onClick={() => setShowGradientPanel(true)}>
                    <Sparkles size={16} />
                    <span>Gradient</span>
                  </button>
                  <button className="ppt-ribbon-btn" onClick={() => setShowThemesPanel(true)}>
                    <Layers size={16} />
                    <span>Themes</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Nền nâng cao</span>
              </div>

              {/* Background Image */}
              <div className="ppt-ribbon-group">
                <div className="ppt-ribbon-group-content">
                  <button className="ppt-ribbon-btn" onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus size={16} />
                    <span>Ảnh nền</span>
                  </button>
                  {editingSlide.backgroundImage && (
                    <button className="ppt-ribbon-btn" onClick={() => updateEditingSlide({ backgroundImage: undefined })}>
                      <X size={16} />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
                <span className="ppt-ribbon-group-label">Background</span>
              </div>

              {/* Text Effects - only when text selected */}
              {selectedElement?.type === 'text' && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content">
                    <button className="ppt-ribbon-btn" onClick={() => setShowTextEffects(true)}>
                      <Wand2 size={16} />
                      <span>Text Effects</span>
                    </button>
                    <button className="ppt-ribbon-btn" onClick={() => setShowAnimationsPanel(true)}>
                      <Sparkles size={16} />
                      <span>Animation</span>
                    </button>
                  </div>
                  <span className="ppt-ribbon-group-label">Hiệu ứng chữ</span>
                </div>
              )}

              {/* Shape Effects - only when shape selected */}
              {selectedElement?.type === 'shape' && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content">
                    <button className="ppt-ribbon-btn" onClick={() => setShowShapeEffects(true)}>
                      <Wand2 size={16} />
                      <span>Shape Effects</span>
                    </button>
                    <button className="ppt-ribbon-btn" onClick={() => setShowAnimationsPanel(true)}>
                      <Sparkles size={16} />
                      <span>Animation</span>
                    </button>
                  </div>
                  <span className="ppt-ribbon-group-label">Hiệu ứng hình</span>
                </div>
              )}

              {/* Rotation & Opacity - when any element selected */}
              {selectedElement && (
                <div className="ppt-ribbon-group">
                  <div className="ppt-ribbon-group-content" style={{ flexDirection: 'column', gap: '8px' }}>
                    <RotationControl
                      rotation={parseInt(selectedElement.style?.transform?.match(/rotate\((\d+)deg\)/)?.[1] || '0')}
                      onChange={handleRotateElement}
                    />
                    <OpacityControl
                      opacity={Math.round((selectedElement.style?.opacity || 1) * 100)}
                      onChange={handleOpacityChange}
                    />
                  </div>
                  <span className="ppt-ribbon-group-label">Transform</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => updateEditingSlide({ backgroundImage: reader.result as string });
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }}
              />
            </>
          )}

          {activeTab === 'transitions' && editingSlide && (
            <div className="ppt-ribbon-group">
              <div className="ppt-ribbon-group-content">
                <select
                  className="ppt-ribbon-select"
                  value={editingSlide.transition || 'fade'}
                  onChange={(e) => updateEditingSlide({ transition: e.target.value as SlideTransition })}
                >
                  <option value="none">Không có</option>
                  <option value="fade">Fade</option>
                  <option value="slide-horizontal">Slide ngang</option>
                  <option value="slide-vertical">Slide dọc</option>
                  <option value="zoom">Zoom</option>
                  <option value="flip">Flip</option>
                </select>
                <input
                  type="number"
                  className="ppt-ribbon-input"
                  value={editingSlide.animationDuration || 500}
                  onChange={(e) => updateEditingSlide({ animationDuration: parseInt(e.target.value) || 500 })}
                  min={100}
                  max={3000}
                  step={100}
                />
                <span className="ppt-ribbon-label">ms</span>
              </div>
              <span className="ppt-ribbon-group-label">Transition</span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="ppt-error-bar">{error} <button onClick={() => setError(null)}>×</button></div>}

      {/* Main Content */}
      <div className="ppt-main">
        {/* Left Sidebar - Thumbnails */}
        <aside className="ppt-sidebar">
          <div className="ppt-sidebar-header">
            <span>Slides ({slides.length})</span>
          </div>
          <div className="ppt-thumbnails">
            {slidesLoading ? (
              <div className="ppt-loading">Đang tải...</div>
            ) : slides.length === 0 ? (
              <div className="ppt-empty">
                {isNew ? 'Lưu bài giảng trước' : 'Chưa có slide'}
              </div>
            ) : (
              slides.map((slide, idx) => renderThumbnail(slide, idx))
            )}
          </div>
          <button className="ppt-add-slide-btn" onClick={handleAddSlide} disabled={isNew}>
            + Thêm Slide
          </button>
        </aside>

        {/* Main Editor Canvas */}
        <main className="ppt-canvas-container">
          {/* Zoom & Grid Controls */}
          <div className="le-status-bar">
            <div className="le-status-left">
              <span>Slide {selectedSlideIndex + 1} / {slides.length}</span>
              {selectedElement && <span>| {selectedElement.type}</span>}
            </div>
            <div className="le-status-right">
              <GridToggle showGrid={showGrid} onToggle={() => setShowGrid(!showGrid)} />
              <ZoomControls
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
                onZoomFit={handleZoomFit}
              />
            </div>
          </div>

          {editingSlide ? (
            <div
              ref={canvasRef}
              className={`ppt-canvas ${showGrid ? 'show-grid' : ''}`}
              style={{
                backgroundColor: editingSlide.backgroundColor || '#fff',
                backgroundImage: editingSlide.backgroundImage ? `url(${editingSlide.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
              }}
              onClick={() => {
                setSelectedElementId(null);
                setIsEditingTitle(false);
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Slide Title - Inline Editable */}
              <div
                className={`ppt-slide-title ${isEditingTitle ? 'editing' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                  setSelectedElementId(null);
                }}
              >
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={editingSlide.title || ''}
                    onChange={(e) => updateEditingSlide({ title: e.target.value })}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="ppt-title-inline-input"
                    placeholder="Nhập tiêu đề slide..."
                  />
                ) : (
                  <span>{editingSlide.title || 'Click để thêm tiêu đề'}</span>
                )}
              </div>

              {/* Elements */}
              {editingSlide.elements.map(renderElement)}

              {/* Empty state */}
              {editingSlide.elements.length === 0 && !isEditingTitle && (
                <div className="ppt-canvas-empty">
                  <p>Click "Insert" để thêm nội dung</p>
                </div>
              )}

              {/* Floating Context Toolbar */}
              {selectedElement && (
                <div
                  className="ppt-floating-toolbar"
                  style={{
                    left: `calc(${selectedElement.position.x}% + ${selectedElement.position.width / 2}%)`,
                    top: `calc(${selectedElement.position.y}% - 48px)`,
                  }}
                >
                  <div className="ppt-floating-toolbar-group">
                    <button onClick={copyElement} title="Sao chép (Ctrl+C)">
                      <Copy size={14} />
                    </button>
                    <button onClick={duplicateElement} title="Nhân đôi (Ctrl+D)">
                      <CopyPlus size={14} />
                    </button>
                  </div>
                  <div className="ppt-floating-toolbar-divider" />
                  <div className="ppt-floating-toolbar-group">
                    <button onClick={bringToFront} title="Đưa lên trên">
                      <MoveUp size={14} />
                    </button>
                    <button onClick={sendToBack} title="Đưa xuống dưới">
                      <MoveDown size={14} />
                    </button>
                  </div>
                  <div className="ppt-floating-toolbar-divider" />
                  <div className="ppt-floating-toolbar-group">
                    <button onClick={deleteElement} title="Xóa (Delete)" className="danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ppt-no-slide">
              <div className="ppt-no-slide-content">
                {isNew ? (
                  <>
                    <span className="ppt-no-slide-icon"><FileText size={48} /></span>
                    <p>Nhập tiêu đề và nhấn "Lưu" để bắt đầu</p>
                  </>
                ) : slides.length === 0 ? (
                  <>
                    <span className="ppt-no-slide-icon"><LayoutGrid size={48} /></span>
                    <p>Nhấn "+ Thêm Slide" hoặc "Import" để bắt đầu</p>
                  </>
                ) : (
                  <>
                    <span className="ppt-no-slide-icon"><Layers size={48} /></span>
                    <p>Chọn slide từ danh sách bên trái</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Save indicator */}
          {hasUnsavedChanges && (
            <button className="ppt-save-float" onClick={handleSaveSlide}>
              <Save size={16} />
              <span>Lưu slide (Ctrl+S)</span>
            </button>
          )}

          {/* Quick Actions Bar */}
          {editingSlide && (
            <div className="ppt-quick-actions-bar">
              <button onClick={() => addElement('text')} title="Thêm Text (T)">
                <Type size={16} />
              </button>
              <button onClick={() => imageInputRef.current?.click()} title="Thêm Ảnh">
                <Image size={16} />
              </button>
              <button onClick={() => addElement('shape')} title="Thêm Shape">
                <Square size={16} />
              </button>
              <button onClick={() => addShapeElement('circle')} title="Thêm Circle">
                <Circle size={16} />
              </button>
              <div className="ppt-quick-actions-divider" />
              <button onClick={handleAddSlide} disabled={isNew} title="Thêm Slide mới">
                <Plus size={16} />
              </button>
            </div>
          )}
        </main>

        {/* Settings Panel */}
        {showSettingsPanel && (
          <aside className="ppt-settings-panel">
            <div className="ppt-panel-header">
              <h3>Cài đặt bài giảng</h3>
              <button onClick={() => setShowSettingsPanel(false)}>×</button>
            </div>
            <div className="ppt-panel-content">
              <div className="ppt-form-group">
                <label>Mô tả</label>
                <textarea
                  value={lectureForm.description}
                  onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="ppt-form-group">
                <label>Level JLPT</label>
                <select
                  value={lectureForm.jlptLevel}
                  onChange={(e) => setLectureForm({ ...lectureForm, jlptLevel: e.target.value as JLPTLevel })}
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>
              <div className="ppt-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={lectureForm.isPublished}
                    onChange={(e) => setLectureForm({ ...lectureForm, isPublished: e.target.checked })}
                  />
                  Công khai
                </label>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Import Modal */}
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

      {/* Symbol Picker Modal */}
      {showSymbolPicker && (
        <div className="ppt-modal-overlay" onClick={() => setShowSymbolPicker(false)}>
          <div className="ppt-symbol-modal" onClick={e => e.stopPropagation()}>
            <div className="ppt-modal-header">
              <h3>Chèn Biểu tượng</h3>
              <button className="ppt-modal-close" onClick={() => setShowSymbolPicker(false)}>×</button>
            </div>
            <div className="ppt-symbol-categories">
              {Object.entries(LECTURE_SYMBOLS).map(([category, symbols]) => (
                <div key={category} className="ppt-symbol-category">
                  <h4>{category}</h4>
                  <div className="ppt-symbol-grid">
                    {symbols.map((s, i) => (
                      <button
                        key={i}
                        className="ppt-symbol-item"
                        onClick={() => insertSymbol(s)}
                        title={s}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Note Modal */}
      {showNoteModal && (
        <div className="ppt-modal-overlay" onClick={() => {
          setShowNoteModal(false);
          setNoteContent('');
          setEditingNoteId(null);
        }}>
          <div className="ppt-note-modal" onClick={e => e.stopPropagation()}>
            <div className="ppt-modal-header">
              <h3>{editingNoteId ? 'Sửa ghi chú' : 'Thêm ghi chú Admin'}</h3>
              <button className="ppt-modal-close" onClick={() => {
                setShowNoteModal(false);
                setNoteContent('');
                setEditingNoteId(null);
              }}>×</button>
            </div>
            <div className="ppt-note-modal-content">
              {textSelection && !editingNoteId && (
                <div className="ppt-note-selected-text">
                  <label>Đoạn văn bản đã chọn:</label>
                  <div className="ppt-note-highlight">"{textSelection.text}"</div>
                </div>
              )}
              <div className="ppt-note-input-group">
                <label>Nội dung ghi chú (chỉ admin thấy):</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Nhập ghi chú cho đoạn văn bản này..."
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="ppt-note-modal-actions">
                <button
                  className="ppt-btn"
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteContent('');
                    setEditingNoteId(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  className="ppt-btn ppt-btn-primary"
                  onClick={editingNoteId ? updateAdminNote : addAdminNote}
                  disabled={!noteContent.trim()}
                >
                  {editingNoteId ? 'Cập nhật' : 'Thêm ghi chú'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ ENHANCED UI PANELS ============ */}

      {/* Quick Actions Floating Panel */}
      <QuickActionsPanel
        isVisible={showQuickPanel}
        onToggle={() => setShowQuickPanel(!showQuickPanel)}
        onAddText={addTextElement}
        onAddImage={() => imageInputRef.current?.click()}
        onAddShape={handleQuickAddShape}
        onAddVideo={addVideoElement}
        onAddAudio={addAudioElement}
      />

      {/* Slide Templates Panel */}
      <TemplatesPanel
        isVisible={showTemplatesPanel}
        onClose={() => setShowTemplatesPanel(false)}
        onSelectTemplate={handleApplyTemplate}
      />

      {/* Element Layers Panel */}
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

      {/* ============ ADVANCED EFFECTS PANELS ============ */}

      {/* Text Effects Panel */}
      <TextEffectsPanel
        currentEffect={selectedElement?.style?.textEffect || 'none'}
        onSelectEffect={handleApplyTextEffect}
        isVisible={showTextEffects}
        onClose={() => setShowTextEffects(false)}
      />

      {/* Shape Effects Panel */}
      <ShapeEffectsPanel
        currentEffect={selectedElement?.style?.shapeEffect || 'none'}
        onSelectEffect={handleApplyShapeEffect}
        isVisible={showShapeEffects}
        onClose={() => setShowShapeEffects(false)}
      />

      {/* Gradient Backgrounds Panel */}
      <GradientPanel
        currentGradient={editingSlide?.backgroundColor || '#ffffff'}
        onSelectGradient={handleApplyGradient}
        isVisible={showGradientPanel}
        onClose={() => setShowGradientPanel(false)}
      />

      {/* Element Animations Panel */}
      <AnimationsPanel
        currentAnimation={selectedElement?.animation || 'none'}
        onSelectAnimation={handleApplyAnimation}
        onPreviewAnimation={handlePreviewAnimation}
        isVisible={showAnimationsPanel}
        onClose={() => setShowAnimationsPanel(false)}
      />

      {/* Slide Themes Panel */}
      <ThemesPanel
        currentTheme="default"
        onSelectTheme={handleApplyTheme}
        isVisible={showThemesPanel}
        onClose={() => setShowThemesPanel(false)}
      />

      {/* Keyboard Shortcuts Panel */}
      <ShortcutsPanel
        isVisible={showShortcutsPanel}
        onClose={() => setShowShortcutsPanel(false)}
      />

      {/* Delete Slide Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteSlideConfirm}
        title="Xóa slide"
        message="Bạn có chắc muốn xóa slide này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        onConfirm={handleDeleteSlideConfirm}
        onCancel={() => setDeleteSlideConfirm(null)}
      />
    </div>
  );
}
