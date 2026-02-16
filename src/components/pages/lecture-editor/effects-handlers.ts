// Advanced effects handlers

import { useCallback } from 'react';
import type {
  TextEffect, ShapeEffect, GradientPreset, ElementAnimation, SlideTheme
} from '../../../utils/slide-editor-effects';
import type { SlideFormData, SlideElement } from '../../../types/lecture';

export function useEffectsHandlers(
  selectedElement: SlideElement | null,
  editingSlide: SlideFormData | null,
  updateElementStyle: (id: string, styleUpdates: Record<string, string | undefined>) => void,
  updateEditingSlide: (updates: Partial<SlideFormData>) => void,
  updateElement: (id: string, updates: Partial<SlideElement>) => void,
  setShowTextEffects: (show: boolean) => void,
  setShowShapeEffects: (show: boolean) => void,
  setShowGradientPanel: (show: boolean) => void,
  setShowAnimationsPanel: (show: boolean) => void,
  setShowThemesPanel: (show: boolean) => void
) {
  const handleApplyTextEffect = useCallback((effect: TextEffect) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    updateElementStyle(selectedElement.id, effect.style as Record<string, string | undefined>);
    setShowTextEffects(false);
  }, [selectedElement, updateElementStyle, setShowTextEffects]);

  const handleApplyShapeEffect = useCallback((effect: ShapeEffect) => {
    if (!selectedElement || selectedElement.type !== 'shape') return;
    updateElementStyle(selectedElement.id, effect.style as Record<string, string | undefined>);
    setShowShapeEffects(false);
  }, [selectedElement, updateElementStyle, setShowShapeEffects]);

  const handleApplyGradient = useCallback((gradient: GradientPreset) => {
    if (!editingSlide) return;
    updateEditingSlide({ backgroundColor: gradient.value });
    setShowGradientPanel(false);
  }, [editingSlide, updateEditingSlide, setShowGradientPanel]);

  const handleApplyAnimation = useCallback((animation: ElementAnimation) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, { animation: animation.id, animationDuration: animation.duration });
    setShowAnimationsPanel(false);
  }, [selectedElement, updateElement, setShowAnimationsPanel]);

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
  }, [editingSlide, updateEditingSlide, setShowThemesPanel]);

  const handleRotateElement = useCallback((rotation: number) => {
    if (!selectedElement) return;
    updateElementStyle(selectedElement.id, { transform: `rotate(${rotation}deg)` });
  }, [selectedElement, updateElementStyle]);

  const handleOpacityChange = useCallback((opacity: number) => {
    if (!selectedElement) return;
    updateElementStyle(selectedElement.id, { opacity: String(opacity / 100) });
  }, [selectedElement, updateElementStyle]);

  return {
    handleApplyTextEffect,
    handleApplyShapeEffect,
    handleApplyGradient,
    handleApplyAnimation,
    handlePreviewAnimation,
    handleApplyTheme,
    handleRotateElement,
    handleOpacityChange,
  };
}
