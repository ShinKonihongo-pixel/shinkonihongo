// Hook for PPTX import/export functionality

import { useState, useCallback } from 'react';
import type { Lecture, Slide } from '../types/lecture';
import type { ImportProgress, ImportResult, PPTXExportOptions } from '../types/pptx';
import { importPPTXFile, previewPPTXFile, exportLectureToPPTX } from '../lib/pptx';

interface UsePPTXReturn {
  // Import
  importPPTX: (file: File, lectureId: string) => Promise<ImportResult>;
  previewPPTX: (file: File) => Promise<{
    slideCount: number;
    hasImages: boolean;
    estimatedMediaSize: number;
    errors: string[];
  }>;
  importProgress: ImportProgress;
  importError: string | null;
  resetImport: () => void;

  // Export
  exportPPTX: (lecture: Lecture, slides: Slide[], options?: PPTXExportOptions) => Promise<void>;
  exportLoading: boolean;
  exportError: string | null;
}

export function usePPTX(): UsePPTXReturn {
  // Import state
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    state: 'idle',
    percent: 0,
    currentStep: '',
  });
  const [importError, setImportError] = useState<string | null>(null);

  // Export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Reset import state
  const resetImport = useCallback(() => {
    setImportProgress({ state: 'idle', percent: 0, currentStep: '' });
    setImportError(null);
  }, []);

  // Preview PPTX without importing
  const previewPPTX = useCallback(async (file: File) => {
    return await previewPPTXFile(file);
  }, []);

  // Import PPTX file
  const importPPTX = useCallback(async (file: File, lectureId: string): Promise<ImportResult> => {
    setImportError(null);
    setImportProgress({ state: 'reading', percent: 0, currentStep: 'Bắt đầu...' });

    try {
      const result = await importPPTXFile(file, lectureId, setImportProgress);

      if (!result.success && result.errors.length > 0) {
        setImportError(result.errors.join(', '));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setImportError(errorMessage);
      setImportProgress({ state: 'error', percent: 0, currentStep: errorMessage });

      return {
        success: false,
        slides: [],
        errors: [errorMessage],
        warnings: [],
        mediaUrls: new Map(),
      };
    }
  }, []);

  // Export to PPTX
  const exportPPTX = useCallback(async (
    lecture: Lecture,
    slides: Slide[],
    options?: PPTXExportOptions
  ): Promise<void> => {
    setExportLoading(true);
    setExportError(null);

    try {
      await exportLectureToPPTX(lecture, slides, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi export';
      setExportError(errorMessage);
      throw error;
    } finally {
      setExportLoading(false);
    }
  }, []);

  return {
    importPPTX,
    previewPPTX,
    importProgress,
    importError,
    resetImport,
    exportPPTX,
    exportLoading,
    exportError,
  };
}
