// Keyboard shortcuts handler

import { useEffect } from 'react';
import type { SlideFormData, SlideElement } from '../../../types/lecture';

export function useKeyboardShortcuts(
  handleSaveSlide: () => Promise<void>,
  handleUndo: () => void,
  handleRedo: () => void,
  selectedElementId: string | null,
  deleteElement: () => void,
  copyElement: () => void,
  pasteElement: () => void,
  duplicateElement: () => void,
  clipboard: SlideElement | null,
  editingSlide: SlideFormData | null,
  updateElement: (id: string, updates: Partial<SlideElement>) => void,
  setSelectedElementId: (id: string | null) => void,
  setIsEditingTitle: (val: boolean) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      // Save
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveSlide();
      }

      // Undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !isEditing) {
        e.preventDefault();
        handleUndo();
      }

      // Redo
      if (((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) && !isEditing) {
        e.preventDefault();
        handleRedo();
      }

      // Delete
      if (e.key === 'Delete' && selectedElementId && !isEditing) {
        e.preventDefault();
        deleteElement();
      }

      // Copy
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedElementId && !isEditing) {
        e.preventDefault();
        copyElement();
      }

      // Paste
      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && clipboard && !isEditing) {
        e.preventDefault();
        pasteElement();
      }

      // Duplicate
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedElementId && !isEditing) {
        e.preventDefault();
        duplicateElement();
      }

      // Escape
      if (e.key === 'Escape') {
        setSelectedElementId(null);
        setIsEditingTitle(false);
      }

      // Arrow keys for element positioning
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
  }, [
    handleSaveSlide, handleUndo, handleRedo,
    selectedElementId, deleteElement, copyElement, pasteElement, duplicateElement,
    clipboard, editingSlide, updateElement, setSelectedElementId, setIsEditingTitle
  ]);
}
