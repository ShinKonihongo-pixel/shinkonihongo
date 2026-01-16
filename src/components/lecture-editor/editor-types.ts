// Lecture Editor Types

import type { SlideFormData, SlideElement, AdminNote } from '../../types/lecture';
import type { JLPTLevel } from '../../types/flashcard';
import type { HistoryState } from '../../utils/slide-editor-effects';

// Resize handle positions
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

// Drag state for element manipulation
export interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: ResizeHandle | null;
  startX: number;
  startY: number;
  startPosition: { x: number; y: number; width: number; height: number };
}

// Lecture form data
export interface LectureFormState {
  title: string;
  description: string;
  coverImage: string;
  jlptLevel: JLPTLevel;
  folderId?: string;
  isPublished: boolean;
}

// Text selection for admin notes
export interface TextSelection {
  elementId: string;
  text: string;
  startOffset: number;
  endOffset: number;
}

// Delete slide confirmation
export interface DeleteSlideConfirm {
  index: number;
}

// Editor ribbon tabs
export type RibbonTab = 'home' | 'insert' | 'design' | 'transitions';

// Props for the main editor page
export interface LectureEditorPageProps {
  lectureId?: string;
  initialFolderId?: string;
  initialLevel?: JLPTLevel;
  onBack: () => void;
}

// Props for editor header component
export interface EditorHeaderProps {
  lectureForm: LectureFormState;
  onTitleChange: (title: string) => void;
  hasUnsavedChanges: boolean;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  onSettings: () => void;
  onImport: () => void;
  onExport: () => void;
  showAdminNotes: boolean;
  onToggleAdminNotes: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onShowShortcuts: () => void;
  isNew: boolean;
  slidesCount: number;
  exportLoading: boolean;
}

// Props for editor ribbon toolbar
export interface EditorRibbonProps {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  selectedElement: SlideElement | null;
  editingSlide: SlideFormData | null;
  clipboard: SlideElement | null;
  isNew: boolean;
  onAddSlide: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  updateElementStyle: (id: string, style: Record<string, string>) => void;
  updateEditingSlide: (updates: Partial<SlideFormData>) => void;
  addElement: (type: SlideElement['type']) => void;
  addShapeElement: (type: 'rectangle' | 'circle' | 'line' | 'arrow') => void;
  insertSymbol: (symbol: string) => void;
  addTextTemplate: (template: { label: string; content: string; style: Record<string, string> }) => void;
  onGenerateFurigana: () => void;
  onGenerateAllFurigana: () => void;
  onRemoveFurigana: () => void;
  showFurigana: boolean;
  onToggleFurigana: () => void;
  furiganaLoading: boolean;
  onShowSymbolPicker: () => void;
  onShowTemplatesPanel: () => void;
  onShowTextEffects: () => void;
  onShowShapeEffects: () => void;
  onShowGradientPanel: () => void;
  onShowAnimationsPanel: () => void;
  onShowThemesPanel: () => void;
  onRotateElement: (rotation: number) => void;
  onOpacityChange: (opacity: number) => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackgroundImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Props for sidebar (slide thumbnails)
export interface EditorSidebarProps {
  slides: Array<{
    id: string;
    title?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    elements: SlideElement[];
  }>;
  selectedSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlideClick: (index: number, e: React.MouseEvent) => void;
  onAddSlide: () => void;
  isLoading: boolean;
  isNew: boolean;
}

// Props for main canvas
export interface EditorCanvasProps {
  editingSlide: SlideFormData | null;
  selectedElementId: string | null;
  selectedElement: SlideElement | null;
  dragState: DragState;
  showGrid: boolean;
  zoom: number;
  showFurigana: boolean;
  showAdminNotes: boolean;
  textSelection: TextSelection | null;
  isEditingTitle: boolean;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onUpdateEditingSlide: (updates: Partial<SlideFormData>) => void;
  onDragStart: (e: React.MouseEvent, elementId: string) => void;
  onResizeStart: (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onTextSelect: (elementId: string) => void;
  onSetEditingTitle: (editing: boolean) => void;
  onShowNoteModal: () => void;
  onOpenNoteForEdit: (note: AdminNote) => void;
  onDeleteAdminNote: (elementId: string, noteId: string) => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDelete: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  isNew: boolean;
  slidesCount: number;
  selectedSlideIndex: number;
}

// Props for element renderer
export interface ElementRendererProps {
  element: SlideElement;
  isSelected: boolean;
  dragState: DragState;
  showFurigana: boolean;
  showAdminNotes: boolean;
  textSelection: TextSelection | null;
  onSelect: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
  onTextSelect: () => void;
  onUpdateContent: (content: string) => void;
  onShowNoteModal: () => void;
  onOpenNoteForEdit: (note: AdminNote) => void;
  onDeleteAdminNote: (noteId: string) => void;
}

// Generate unique element ID
export function generateId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
