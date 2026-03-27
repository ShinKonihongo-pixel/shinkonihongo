// Lecture Editor Page - Orchestrator

/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { useLectures, useSlides } from '../../../hooks/use-lectures';
import { usePPTX } from '../../../hooks/use-pptx';
import { useGroq } from '../../../hooks/use-groq';
import { useNavigation } from '../../../contexts/navigation-context';
import { PPTXImportModal } from '../../lecture/pptx-import-modal';
import { canUndo, canRedo } from '../../../utils/slide-editor-effects';
import type { SlideFormData } from './types';

// Modular components
import {
  EditorHeader, EditorSidebar, EditorCanvas,
  SymbolPickerModal, AdminNoteModal, SettingsPanel, DeleteSlideModal,
} from '../../lecture-editor';

// Ribbon toolbar
import { EditorRibbon } from '../lecture-editor-ribbon';

// Panels
import { QuickActionsPanel, TemplatesPanel, LayersPanel } from '../../lecture/lecture-toolbar-panels';
import {
  TextEffectsPanel, ShapeEffectsPanel, GradientPanel, AnimationsPanel,
  ThemesPanel, ShortcutsPanel,
} from '../../lecture/lecture-advanced-panels';

// Hooks and handlers
import { useEditorState } from './use-editor-state';
import { useLoadLecture, useSyncSlide } from './use-effects';
import { useElementHandlers, useLayerHandlers, useDragHandlers, useHistoryHandlers } from './handlers';
import { useFuriganaHandlers, useAdminNotesHandlers, useContentHandlers, useZoomHandlers } from './slide-handlers';
import { useLectureHandlers, useSlideHandlers, useImportExportHandlers, useImageHandlers } from './crud-handlers';
import { useEffectsHandlers } from './effects-handlers';
import { useKeyboardShortcuts } from './keyboard-shortcuts';
import './lecture.css';

export function LectureEditorPage() {
  const { currentUser, isAdmin } = useAuth();
  const {
    editingLectureId: lectureId,
    editingLectureFolderId: initialFolderId,
    editingLectureLevel: initialLevel,
    setEditingLectureId,
    setEditingLectureFolderId,
    setEditingLectureLevel,
    setCurrentPage,
  } = useNavigation();

  const onBack = useCallback(() => {
    setEditingLectureId(undefined);
    setEditingLectureFolderId(undefined);
    setEditingLectureLevel(undefined);
    setCurrentPage('cards');
  }, [setEditingLectureId, setEditingLectureFolderId, setEditingLectureLevel, setCurrentPage]);
  const { getLecture, createLecture, updateLecture } = useLectures(true);
  const state = useEditorState(initialLevel, initialFolderId);
  const { slides, loading: slidesLoading, addSlide, updateSlide, deleteSlide, duplicateSlide, deleteAllSlides } = useSlides(state.currentLectureId);
  const { importPPTX, previewPPTX, importProgress, importError, resetImport, exportPPTX, exportLoading } = usePPTX();
  const { generateFurigana, isLoading: furiganaLoading } = useGroq();

  const isNew = !state.currentLectureId || state.currentLectureId === 'new';

  // Update editing slide helper
  const updateEditingSlide = useCallback((updates: Partial<SlideFormData>) => {
    if (!state.editingSlide) return;
    state.setEditingSlide({ ...state.editingSlide, ...updates });
    state.setHasUnsavedChanges(true);
  }, [state.editingSlide, state.setEditingSlide, state.setHasUnsavedChanges]);

  // Load lecture on mount
  useLoadLecture(lectureId, state.setCurrentLectureId, getLecture, state.setLectureForm);

  // Sync slide selection
  useSyncSlide(slides, state.selectedSlideIndex, state.hasUnsavedChanges, slidesLoading, state.setEditingSlide, state.setSelectedSlideIndex);

  // Element handlers
  const elementHandlers = useElementHandlers(
    state.editingSlide,
    state.selectedElementId,
    updateEditingSlide,
    state.setSelectedElementId,
    state.clipboard,
    state.setClipboard
  );

  // Layer handlers
  const layerHandlers = useLayerHandlers(
    state.editingSlide,
    updateEditingSlide,
    state.selectedElementId,
    state.setSelectedElementId
  );

  // Drag handlers
  const dragHandlers = useDragHandlers(
    state.editingSlide,
    state.dragState,
    state.setDragState,
    state.selectedElementId,
    state.setSelectedElementId,
    elementHandlers.updateElement,
    state.canvasRef as React.RefObject<HTMLDivElement>
  );

  // History handlers
  const historyHandlers = useHistoryHandlers(state.history, state.setHistory, state.setEditingSlide);

  // Lecture handlers
  const lectureHandlers = useLectureHandlers(
    state.currentLectureId,
    state.lectureForm,
    currentUser,
    isNew,
    state.setSaving,
    state.setError,
    state.setCurrentLectureId,
    createLecture,
    updateLecture
  );

  // Slide handlers
  const slideHandlers = useSlideHandlers(
    state.currentLectureId,
    slides,
    state.selectedSlideIndex,
    state.editingSlide,
    state.hasUnsavedChanges,
    state.setEditingSlide,
    state.setSelectedSlideIndex,
    state.setHasUnsavedChanges,
    state.setSelectedElementId,
    state.setError,
    updateSlide,
    addSlide,
    deleteSlide as any,
    updateEditingSlide
  );

  // Furigana handlers
  const furiganaHandlers = useFuriganaHandlers(
    state.editingSlide,
    elementHandlers.selectedElement,
    elementHandlers.updateElement,
    updateEditingSlide,
    generateFurigana,
    state.setError
  );

  // Admin notes handlers
  const adminNotesHandlers = useAdminNotesHandlers(
    state.editingSlide,
    state.textSelection,
    state.noteContent,
    state.editingNoteId,
    currentUser,
    state.setTextSelection,
    state.setNoteContent,
    state.setShowNoteModal,
    state.setEditingNoteId,
    elementHandlers.updateElement
  );

  // Content handlers
  const contentHandlers = useContentHandlers(
    state.editingSlide,
    elementHandlers.selectedElement,
    updateEditingSlide,
    elementHandlers.updateElement,
    state.setSelectedElementId,
    state.setShowSymbolPicker
  );

  // Zoom handlers
  const zoomHandlers = useZoomHandlers(state.setZoom);

  // Import/Export handlers
  const importExportHandlers = useImportExportHandlers(
    state.currentLectureId,
    slides,
    state.lectureForm,
    currentUser,
    state.setError,
    state.setSelectedSlideIndex,
    state.setHasUnsavedChanges,
    addSlide,
    deleteAllSlides,
    exportPPTX
  );

  // Image handlers
  const imageHandlers = useImageHandlers(
    state.selectedElementId,
    elementHandlers.selectedElement,
    state.editingSlide,
    elementHandlers.updateElement,
    updateEditingSlide,
    state.setSelectedElementId
  );

  // Effects handlers
  const effectsHandlers = useEffectsHandlers(
    elementHandlers.selectedElement,
    state.editingSlide,
    elementHandlers.updateElementStyle,
    updateEditingSlide,
    elementHandlers.updateElement,
    state.setShowTextEffects,
    state.setShowShapeEffects,
    state.setShowGradientPanel,
    state.setShowAnimationsPanel,
    state.setShowThemesPanel
  );

  // Template handler wrapper
  const handleApplyTemplate = useCallback(async (template: any) => {
    await contentHandlers.handleApplyTemplate(
      template,
      state.currentLectureId,
      state.hasUnsavedChanges,
      slideHandlers.handleSaveSlide,
      addSlide,
      slides,
      state.setSelectedSlideIndex,
      state.setHasUnsavedChanges,
      state.setShowTemplatesPanel,
      state.setError
    );
  }, [contentHandlers, state, slideHandlers, addSlide, slides]);

  // Delete slide click
  const handleDeleteSlideClick = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    state.setDeleteSlideConfirm({ index });
  }, [state.setDeleteSlideConfirm]);

  // Delete slide confirm wrapper
  const handleDeleteSlideConfirm = useCallback(async () => {
    await slideHandlers.handleDeleteSlideConfirm(state.deleteSlideConfirm, state.setDeleteSlideConfirm);
  }, [slideHandlers, state.deleteSlideConfirm, state.setDeleteSlideConfirm]);

  // Keyboard shortcuts
  useKeyboardShortcuts(
    slideHandlers.handleSaveSlide,
    historyHandlers.handleUndo,
    historyHandlers.handleRedo,
    state.selectedElementId,
    elementHandlers.deleteElement,
    elementHandlers.copyElement,
    elementHandlers.pasteElement,
    elementHandlers.duplicateElement,
    state.clipboard,
    state.editingSlide,
    elementHandlers.updateElement,
    state.setSelectedElementId,
    state.setIsEditingTitle
  );

  // Auth check
  if (!isAdmin) {
    return (
      <div className="ppt-error-page">
        <p>Bạn không có quyền truy cập trang này.</p>
        <button className="ppt-btn" onClick={onBack}>Quay lại</button>
      </div>
    );
  }

  return (
    <div className="ppt-editor">
      <EditorHeader
        lectureForm={state.lectureForm}
        onTitleChange={(title) => state.setLectureForm({ ...state.lectureForm, title })}
        hasUnsavedChanges={state.hasUnsavedChanges}
        saving={state.saving}
        onSave={lectureHandlers.handleSaveLecture}
        onBack={onBack}
        onSettings={() => state.setShowSettingsPanel(!state.showSettingsPanel)}
        onImport={() => state.setShowImportModal(true)}
        onExport={importExportHandlers.handleExportPPTX}
        showAdminNotes={state.showAdminNotes}
        onToggleAdminNotes={() => state.setShowAdminNotes(!state.showAdminNotes)}
        canUndo={canUndo(state.history)}
        canRedo={canRedo(state.history)}
        historyLength={state.history.past.length}
        onUndo={historyHandlers.handleUndo}
        onRedo={historyHandlers.handleRedo}
        onShowShortcuts={() => state.setShowShortcutsPanel(true)}
        isNew={isNew}
        slidesCount={slides.length}
        exportLoading={exportLoading}
      />

      <EditorRibbon
        activeTab={state.activeTab}
        onTabChange={state.setActiveTab}
        selectedElement={elementHandlers.selectedElement}
        editingSlide={state.editingSlide}
        clipboard={state.clipboard}
        isNew={isNew}
        onAddSlide={slideHandlers.handleAddSlide}
        onCopy={elementHandlers.copyElement}
        onPaste={elementHandlers.pasteElement}
        onDuplicate={elementHandlers.duplicateElement}
        onDelete={elementHandlers.deleteElement}
        onBringToFront={elementHandlers.bringToFront}
        onSendToBack={elementHandlers.sendToBack}
        updateElementStyle={elementHandlers.updateElementStyle}
        updateEditingSlide={updateEditingSlide}
        addElement={elementHandlers.addElement}
        addShapeElement={elementHandlers.addShapeElement}
        insertSymbol={contentHandlers.insertSymbol}
        addTextTemplate={contentHandlers.addTextTemplate}
        onGenerateFurigana={furiganaHandlers.handleGenerateFurigana}
        onGenerateAllFurigana={furiganaHandlers.handleGenerateAllFurigana}
        onRemoveFurigana={furiganaHandlers.handleRemoveFurigana}
        showFurigana={state.showFurigana}
        onToggleFurigana={() => state.setShowFurigana(!state.showFurigana)}
        furiganaLoading={furiganaLoading}
        onShowSymbolPicker={() => state.setShowSymbolPicker(!state.showSymbolPicker)}
        onShowTemplatesPanel={() => state.setShowTemplatesPanel(!state.showTemplatesPanel)}
        onShowTextEffects={() => state.setShowTextEffects(true)}
        onShowShapeEffects={() => state.setShowShapeEffects(true)}
        onShowGradientPanel={() => state.setShowGradientPanel(true)}
        onShowAnimationsPanel={() => state.setShowAnimationsPanel(true)}
        onShowThemesPanel={() => state.setShowThemesPanel(true)}
        onRotateElement={effectsHandlers.handleRotateElement}
        onOpacityChange={effectsHandlers.handleOpacityChange}
        imageInputRef={state.imageInputRef}
        fileInputRef={state.fileInputRef}
        onImageUpload={imageHandlers.handleImageUpload}
        onBackgroundImageUpload={imageHandlers.handleBackgroundImageUpload}
      />

      {state.error && <div className="ppt-error-bar">{state.error} <button onClick={() => state.setError(null)}>×</button></div>}

      <div className="ppt-main">
        <EditorSidebar
          slides={slides}
          selectedSlideIndex={state.selectedSlideIndex}
          onSelectSlide={slideHandlers.handleSelectSlide}
          onDuplicateSlide={duplicateSlide}
          onDeleteSlideClick={handleDeleteSlideClick}
          onAddSlide={slideHandlers.handleAddSlide}
          isLoading={slidesLoading}
          isNew={isNew}
        />

        <EditorCanvas
          editingSlide={state.editingSlide}
          selectedElementId={state.selectedElementId}
          selectedElement={elementHandlers.selectedElement}
          dragState={state.dragState}
          showGrid={state.showGrid}
          zoom={state.zoom}
          showFurigana={state.showFurigana}
          showAdminNotes={state.showAdminNotes}
          textSelection={state.textSelection}
          isEditingTitle={state.isEditingTitle}
          isNew={isNew}
          slidesCount={slides.length}
          selectedSlideIndex={state.selectedSlideIndex}
          hasUnsavedChanges={state.hasUnsavedChanges}
          canvasRef={state.canvasRef}
          onZoomIn={zoomHandlers.handleZoomIn}
          onZoomOut={zoomHandlers.handleZoomOut}
          onZoomReset={zoomHandlers.handleZoomReset}
          onZoomFit={zoomHandlers.handleZoomFit}
          onToggleGrid={() => state.setShowGrid(!state.showGrid)}
          onSelectElement={state.setSelectedElementId}
          onUpdateElement={elementHandlers.updateElement}
          onUpdateEditingSlide={updateEditingSlide}
          onDragStart={dragHandlers.handleDragStart}
          onResizeStart={dragHandlers.handleResizeStart}
          onMouseMove={dragHandlers.handleMouseMove}
          onMouseUp={dragHandlers.handleMouseUp}
          onTextSelect={adminNotesHandlers.handleTextSelect}
          onSetEditingTitle={state.setIsEditingTitle}
          onShowNoteModal={() => state.setShowNoteModal(true)}
          onOpenNoteForEdit={adminNotesHandlers.openNoteForEdit}
          onDeleteAdminNote={adminNotesHandlers.deleteAdminNote}
          onCopy={elementHandlers.copyElement}
          onDuplicate={elementHandlers.duplicateElement}
          onBringToFront={elementHandlers.bringToFront}
          onSendToBack={elementHandlers.sendToBack}
          onDelete={elementHandlers.deleteElement}
          onSaveSlide={slideHandlers.handleSaveSlide}
          onAddElement={elementHandlers.addElement}
          onAddShapeElement={elementHandlers.addShapeElement}
          onAddSlide={slideHandlers.handleAddSlide}
          imageInputRef={state.imageInputRef}
        />

        <SettingsPanel
          isOpen={state.showSettingsPanel}
          lectureForm={state.lectureForm}
          onClose={() => state.setShowSettingsPanel(false)}
          onUpdateForm={(updates) => state.setLectureForm({ ...state.lectureForm, ...updates })}
        />
      </div>

      {/* Modals */}
      <PPTXImportModal
        isOpen={state.showImportModal}
        onClose={() => state.setShowImportModal(false)}
        onImport={importExportHandlers.handleImportSlides}
        existingSlidesCount={slides.length}
        lectureId={state.currentLectureId || ''}
        importPPTX={importPPTX}
        previewPPTX={previewPPTX}
        importProgress={importProgress}
        importError={importError}
        resetImport={resetImport}
      />

      <SymbolPickerModal
        isOpen={state.showSymbolPicker}
        onClose={() => state.setShowSymbolPicker(false)}
        onInsertSymbol={contentHandlers.insertSymbol}
      />

      <AdminNoteModal
        isOpen={state.showNoteModal}
        textSelection={state.textSelection}
        editingNoteId={state.editingNoteId}
        noteContent={state.noteContent}
        onNoteContentChange={state.setNoteContent}
        onClose={() => { state.setShowNoteModal(false); state.setNoteContent(''); state.setEditingNoteId(null); }}
        onSave={state.editingNoteId ? adminNotesHandlers.updateAdminNote : adminNotesHandlers.addAdminNote}
      />

      {/* Enhanced UI Panels */}
      <QuickActionsPanel
        isVisible={state.showQuickPanel}
        onToggle={() => state.setShowQuickPanel(!state.showQuickPanel)}
        onAddText={() => elementHandlers.addElement('text')}
        onAddImage={() => state.imageInputRef.current?.click()}
        onAddShape={(shape) => elementHandlers.addShapeElement(shape)}
        onAddVideo={() => elementHandlers.addElement('video')}
        onAddAudio={() => elementHandlers.addElement('audio')}
      />

      <TemplatesPanel
        isVisible={state.showTemplatesPanel}
        onClose={() => state.setShowTemplatesPanel(false)}
        onSelectTemplate={handleApplyTemplate}
      />

      <LayersPanel
        elements={state.editingSlide?.elements || []}
        selectedElementId={state.selectedElementId}
        onSelectElement={state.setSelectedElementId}
        onMoveElement={layerHandlers.handleMoveElementLayer}
        onToggleVisibility={layerHandlers.handleToggleElementVisibility}
        onToggleLock={layerHandlers.handleToggleElementLock}
        onDeleteElement={layerHandlers.handleDeleteElementById}
        onDuplicateElement={layerHandlers.handleDuplicateElementById}
        isVisible={state.showLayersPanel}
        onToggle={() => state.setShowLayersPanel(!state.showLayersPanel)}
      />

      {/* Advanced Effects Panels */}
      <TextEffectsPanel
        currentEffect={elementHandlers.selectedElement?.style?.textEffect || 'none'}
        onSelectEffect={effectsHandlers.handleApplyTextEffect}
        isVisible={state.showTextEffects}
        onClose={() => state.setShowTextEffects(false)}
      />

      <ShapeEffectsPanel
        currentEffect={elementHandlers.selectedElement?.style?.shapeEffect || 'none'}
        onSelectEffect={effectsHandlers.handleApplyShapeEffect}
        isVisible={state.showShapeEffects}
        onClose={() => state.setShowShapeEffects(false)}
      />

      <GradientPanel
        currentGradient={state.editingSlide?.backgroundColor || '#ffffff'}
        onSelectGradient={effectsHandlers.handleApplyGradient}
        isVisible={state.showGradientPanel}
        onClose={() => state.setShowGradientPanel(false)}
      />

      <AnimationsPanel
        currentAnimation={elementHandlers.selectedElement?.animation || 'none'}
        onSelectAnimation={effectsHandlers.handleApplyAnimation}
        onPreviewAnimation={effectsHandlers.handlePreviewAnimation}
        isVisible={state.showAnimationsPanel}
        onClose={() => state.setShowAnimationsPanel(false)}
      />

      <ThemesPanel
        currentTheme="default"
        onSelectTheme={effectsHandlers.handleApplyTheme}
        isVisible={state.showThemesPanel}
        onClose={() => state.setShowThemesPanel(false)}
      />

      <ShortcutsPanel
        isVisible={state.showShortcutsPanel}
        onClose={() => state.setShowShortcutsPanel(false)}
      />

      <DeleteSlideModal
        isOpen={!!state.deleteSlideConfirm}
        onConfirm={handleDeleteSlideConfirm}
        onCancel={() => state.setDeleteSlideConfirm(null)}
      />
    </div>
  );
}
