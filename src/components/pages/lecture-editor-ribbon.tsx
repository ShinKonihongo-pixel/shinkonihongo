// Lecture Editor Ribbon Toolbar - Home, Insert, Design, Transitions tabs

import { LayoutGrid } from 'lucide-react';
import type { SlideFormData, SlideElement } from '../../types/lecture';
import type { RibbonTab } from '../lecture-editor/editor-types';
import { TEXT_TEMPLATES } from '../lecture-editor/editor-constants';
import { HomeTabContent } from './lecture-editor/ribbon/ribbon-home-tab';
import { InsertTabContent } from './lecture-editor/ribbon/ribbon-insert-tab';
import { DesignTabContent } from './lecture-editor/ribbon/ribbon-design-tab';
import { TransitionsTabContent } from './lecture-editor/ribbon/ribbon-transitions-tab';

interface EditorRibbonProps {
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
  addTextTemplate: (template: typeof TEXT_TEMPLATES[0]) => void;
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

export function EditorRibbon({
  activeTab, onTabChange, selectedElement, editingSlide, clipboard, isNew,
  onAddSlide, onCopy, onPaste, onDuplicate, onDelete, onBringToFront, onSendToBack,
  updateElementStyle, updateEditingSlide, addElement, addShapeElement, insertSymbol,
  addTextTemplate, onGenerateFurigana, onGenerateAllFurigana, onRemoveFurigana,
  showFurigana, onToggleFurigana, furiganaLoading, onShowSymbolPicker, onShowTemplatesPanel,
  onShowTextEffects, onShowShapeEffects, onShowGradientPanel, onShowAnimationsPanel,
  onShowThemesPanel, onRotateElement, onOpacityChange, imageInputRef, fileInputRef,
  onImageUpload, onBackgroundImageUpload,
}: EditorRibbonProps) {
  return (
    <div className="ppt-ribbon">
      {/* Tabs */}
      <div className="ppt-ribbon-tabs">
        <button className={`ppt-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => onTabChange('home')}>Home</button>
        <button className={`ppt-tab ${activeTab === 'insert' ? 'active' : ''}`} onClick={() => onTabChange('insert')}>Insert</button>
        <button className={`ppt-tab ${activeTab === 'design' ? 'active' : ''}`} onClick={() => onTabChange('design')}>Design</button>
        <button className={`ppt-tab ${activeTab === 'transitions' ? 'active' : ''}`} onClick={() => onTabChange('transitions')}>Transitions</button>
        <button
          className="le-templates-trigger"
          onClick={onShowTemplatesPanel}
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
          <HomeTabContent
            selectedElement={selectedElement}
            editingSlide={editingSlide}
            clipboard={clipboard}
            isNew={isNew}
            onAddSlide={onAddSlide}
            onCopy={onCopy}
            onPaste={onPaste}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onBringToFront={onBringToFront}
            onSendToBack={onSendToBack}
            updateElementStyle={updateElementStyle}
          />
        )}

        {activeTab === 'insert' && (
          <InsertTabContent
            selectedElement={selectedElement}
            editingSlide={editingSlide}
            addElement={addElement}
            addShapeElement={addShapeElement}
            insertSymbol={insertSymbol}
            addTextTemplate={addTextTemplate}
            onGenerateFurigana={onGenerateFurigana}
            onGenerateAllFurigana={onGenerateAllFurigana}
            onRemoveFurigana={onRemoveFurigana}
            showFurigana={showFurigana}
            onToggleFurigana={onToggleFurigana}
            furiganaLoading={furiganaLoading}
            onShowSymbolPicker={onShowSymbolPicker}
            imageInputRef={imageInputRef}
            onImageUpload={onImageUpload}
          />
        )}

        {activeTab === 'design' && editingSlide && (
          <DesignTabContent
            selectedElement={selectedElement}
            editingSlide={editingSlide}
            updateEditingSlide={updateEditingSlide}
            onShowGradientPanel={onShowGradientPanel}
            onShowThemesPanel={onShowThemesPanel}
            onShowTextEffects={onShowTextEffects}
            onShowShapeEffects={onShowShapeEffects}
            onShowAnimationsPanel={onShowAnimationsPanel}
            onRotateElement={onRotateElement}
            onOpacityChange={onOpacityChange}
            fileInputRef={fileInputRef}
            onBackgroundImageUpload={onBackgroundImageUpload}
          />
        )}

        {activeTab === 'transitions' && editingSlide && (
          <TransitionsTabContent
            editingSlide={editingSlide}
            updateEditingSlide={updateEditingSlide}
          />
        )}
      </div>
    </div>
  );
}
