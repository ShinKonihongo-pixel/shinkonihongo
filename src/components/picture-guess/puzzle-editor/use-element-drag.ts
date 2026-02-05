// Custom hook for drag and drop functionality

import { useState } from 'react';
import type { RefObject } from 'react';
import type { SlideElement } from './types';

interface UseDragResult {
  selectedElement: string | null;
  isDragging: boolean;
  setSelectedElement: (id: string | null) => void;
  handleDragStart: (e: React.MouseEvent, elementId: string, slideRef: RefObject<HTMLDivElement | null>, elements: SlideElement[]) => void;
  handleDragMove: (e: React.MouseEvent, slideRef: RefObject<HTMLDivElement | null>, elements: SlideElement[], onUpdate: (elements: SlideElement[]) => void) => void;
  handleDragEnd: () => void;
}

export function useElementDrag(): UseDragResult {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragStart = (
    e: React.MouseEvent,
    elementId: string,
    slideRef: RefObject<HTMLDivElement | null>,
    elements: SlideElement[]
  ) => {
    if (!slideRef.current) return;

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const rect = slideRef.current.getBoundingClientRect();
    const elementX = (element.x / 100) * rect.width;
    const elementY = (element.y / 100) * rect.height;

    setDragOffset({
      x: e.clientX - rect.left - elementX,
      y: e.clientY - rect.top - elementY,
    });
    setSelectedElement(elementId);
    setIsDragging(true);
  };

  const handleDragMove = (
    e: React.MouseEvent,
    slideRef: RefObject<HTMLDivElement | null>,
    elements: SlideElement[],
    onUpdate: (elements: SlideElement[]) => void
  ) => {
    if (!isDragging || !selectedElement || !slideRef.current) return;

    const rect = slideRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    onUpdate(
      elements.map(el =>
        el.id === selectedElement
          ? { ...el, x: Math.max(0, Math.min(100 - el.width, x)), y: Math.max(0, Math.min(100 - el.height, y)) }
          : el
      )
    );
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return {
    selectedElement,
    isDragging,
    setSelectedElement,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
