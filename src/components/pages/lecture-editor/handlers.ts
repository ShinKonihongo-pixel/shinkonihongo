// Editor Event Handlers

import { useCallback } from 'react';
import { generateId } from '../../../components/lecture-editor';
import { undo, redo } from '../../../utils/slide-editor-effects';
import type { SlideFormData, SlideElement } from '../../../types/lecture';
import type { ResizeHandle, DragState } from './types';

// Element operations
export function useElementHandlers(
  editingSlide: SlideFormData | null,
  selectedElementId: string | null,
  updateEditingSlide: (updates: Partial<SlideFormData>) => void,
  setSelectedElementId: (id: string | null) => void,
  clipboard: SlideElement | null,
  setClipboard: (el: SlideElement | null) => void
) {
  const selectedElement = editingSlide?.elements.find(el => el.id === selectedElementId) || null;

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
  }, [editingSlide, updateEditingSlide, setSelectedElementId]);

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
  }, [editingSlide, updateEditingSlide, setSelectedElementId]);

  const updateElement = useCallback((id: string, updates: Partial<SlideElement>) => {
    if (!editingSlide) return;
    updateEditingSlide({
      elements: editingSlide.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    });
  }, [editingSlide, updateEditingSlide]);

  const updateElementStyle = useCallback((id: string, styleUpdates: Record<string, string | undefined>) => {
    if (!editingSlide) return;
    updateEditingSlide({
      elements: editingSlide.elements.map(el =>
        el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
      ),
    });
  }, [editingSlide, updateEditingSlide]);

  const deleteElement = useCallback(() => {
    if (!editingSlide || !selectedElementId) return;
    updateEditingSlide({ elements: editingSlide.elements.filter(el => el.id !== selectedElementId) });
    setSelectedElementId(null);
  }, [editingSlide, selectedElementId, updateEditingSlide, setSelectedElementId]);

  const copyElement = useCallback(() => {
    if (!selectedElement) return;
    setClipboard({ ...selectedElement });
  }, [selectedElement, setClipboard]);

  const pasteElement = useCallback(() => {
    if (!clipboard || !editingSlide) return;
    const newElement: SlideElement = {
      ...clipboard,
      id: generateId(),
      position: { ...clipboard.position, x: clipboard.position.x + 2, y: clipboard.position.y + 2 },
    };
    updateEditingSlide({ elements: [...editingSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
  }, [clipboard, editingSlide, updateEditingSlide, setSelectedElementId]);

  const duplicateElement = useCallback(() => {
    if (!selectedElement || !editingSlide) return;
    const newElement: SlideElement = {
      ...selectedElement,
      id: generateId(),
      position: { ...selectedElement.position, x: selectedElement.position.x + 2, y: selectedElement.position.y + 2 },
    };
    updateEditingSlide({ elements: [...editingSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
  }, [selectedElement, editingSlide, updateEditingSlide, setSelectedElementId]);

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

  return {
    selectedElement,
    addElement,
    addShapeElement,
    updateElement,
    updateElementStyle,
    deleteElement,
    copyElement,
    pasteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
  };
}

// Layer management
export function useLayerHandlers(
  editingSlide: SlideFormData | null,
  updateEditingSlide: (updates: Partial<SlideFormData>) => void,
  selectedElementId: string | null,
  setSelectedElementId: (id: string | null) => void
) {
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
  }, [editingSlide, selectedElementId, updateEditingSlide, setSelectedElementId]);

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
  }, [editingSlide, updateEditingSlide, setSelectedElementId]);

  return {
    handleToggleElementVisibility,
    handleToggleElementLock,
    handleMoveElementLayer,
    handleDeleteElementById,
    handleDuplicateElementById,
  };
}

// Drag and resize handlers
export function useDragHandlers(
  editingSlide: SlideFormData | null,
  dragState: DragState,
  setDragState: (state: DragState) => void,
  selectedElementId: string | null,
  setSelectedElementId: (id: string | null) => void,
  updateElement: (id: string, updates: Partial<SlideElement>) => void,
  canvasRef: React.RefObject<HTMLDivElement>
) {
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
  }, [editingSlide, setSelectedElementId, setDragState]);

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
  }, [editingSlide, setSelectedElementId, setDragState]);

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
  }, [dragState, selectedElementId, updateElement, canvasRef]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging || dragState.isResizing) {
      setDragState({
        isDragging: false, isResizing: false, resizeHandle: null,
        startX: 0, startY: 0, startPosition: { x: 0, y: 0, width: 0, height: 0 },
      });
    }
  }, [dragState, setDragState]);

  return { handleDragStart, handleResizeStart, handleMouseMove, handleMouseUp };
}

// History handlers
export function useHistoryHandlers(history: any, setHistory: any, setEditingSlide: any) {
  const handleUndo = useCallback(() => {
    const newHistory = undo(history);
    if (newHistory.present) {
      setEditingSlide(newHistory.present);
      setHistory(newHistory);
    }
  }, [history, setHistory, setEditingSlide]);

  const handleRedo = useCallback(() => {
    const newHistory = redo(history);
    if (newHistory.present) {
      setEditingSlide(newHistory.present);
      setHistory(newHistory);
    }
  }, [history, setHistory, setEditingSlide]);

  return { handleUndo, handleRedo };
}
