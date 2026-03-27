// PPTX Import Modal - UI for importing PowerPoint files

import { useState, useRef, useCallback } from 'react';
import type { ImportProgress, PPTXImportOptions } from '../../types/pptx';
import type { SlideFormData } from '../../types/lecture';
import { MAX_FILE_SIZE } from '../../lib/pptx/pptx-constants';
import { ModalShell } from '../ui/modal-shell';

interface PPTXImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (slides: SlideFormData[], mode: PPTXImportOptions['mode']) => Promise<void>;
  existingSlidesCount: number;
  lectureId: string;
  importPPTX: (file: File, lectureId: string) => Promise<{
    success: boolean;
    slides: SlideFormData[];
    errors: string[];
    warnings: string[];
  }>;
  previewPPTX: (file: File) => Promise<{
    slideCount: number;
    hasImages: boolean;
    estimatedMediaSize: number;
    errors: string[];
  }>;
  importProgress: ImportProgress;
  importError: string | null;
  resetImport: () => void;
}

// Progress steps for visualization
const IMPORT_STEPS = [
  { key: 'reading', label: 'Đọc file', icon: '📄' },
  { key: 'parsing', label: 'Phân tích', icon: '🔍' },
  { key: 'uploading', label: 'Xử lý media', icon: '🖼️' },
  { key: 'saving', label: 'Tạo slides', icon: '💾' },
  { key: 'complete', label: 'Hoàn thành', icon: '✅' },
];

export function PPTXImportModal({
  isOpen,
  onClose,
  onImport,
  existingSlidesCount,
  lectureId,
  importPPTX,
  previewPPTX,
  importProgress,
  importError,
  resetImport,
}: PPTXImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    slideCount: number;
    hasImages: boolean;
    estimatedMediaSize: number;
    errors: string[];
  } | null>(null);
  const [importMode, setImportMode] = useState<PPTXImportOptions['mode']>('append');
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    slides: SlideFormData[];
    errors: string[];
    warnings: string[];
  } | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      alert('Vui lòng chọn file PowerPoint (.pptx)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(`File quá lớn (${Math.round(file.size / 1024 / 1024)}MB). Giới hạn: 50MB`);
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    resetImport();

    const previewData = await previewPPTX(file);
    setPreview(previewData);
  }, [previewPPTX, resetImport]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const [savingSlides, setSavingSlides] = useState(false);

  const handleImport = async () => {
    if (!selectedFile) return;

    const result = await importPPTX(selectedFile, lectureId);
    setImportResult(result);

    if (result.success && result.slides.length > 0) {
      // Now save slides to Firestore
      setSavingSlides(true);
      try {
        await onImport(result.slides, importMode);
        // Wait a bit to show success, then close
        setTimeout(() => {
          handleClose();
        }, 1000);
      } catch (err) {
        console.error('Error saving slides:', err);
        setSavingSlides(false);
      }
    }
  };

  const handleRetry = () => {
    setImportResult(null);
    resetImport();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setImportResult(null);
    setSavingSlides(false);
    resetImport();
    onClose();
  };

  const isImporting = importProgress.state !== 'idle' && importProgress.state !== 'complete' && importProgress.state !== 'error';
  const currentStepIndex = IMPORT_STEPS.findIndex(s => s.key === importProgress.state);

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="📊 Import PowerPoint" maxWidth={560}>
      <div className="modal-body">
        {/* File Drop Zone */}
        {!selectedFile && (
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
            <div className="drop-zone-content">
              <span className="drop-icon">📂</span>
              <p className="drop-title">Kéo thả file .pptx vào đây</p>
              <p className="drop-hint">hoặc click để chọn file</p>
              <span className="drop-limit">Giới hạn: 50MB</span>
            </div>
          </div>
        )}

        {/* Selected File Info */}
        {selectedFile && preview && !isImporting && importProgress.state !== 'complete' && (
          <div className="file-info">
            <div className="file-header">
              <span className="file-icon">📊</span>
              <div className="file-details">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button
                className="btn-remove"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  setImportResult(null);
                  resetImport();
                }}
              >
                ×
              </button>
            </div>

            {preview.errors.length > 0 ? (
              <div className="preview-errors">
                {preview.errors.map((err, i) => (
                  <p key={i} className="error">{err}</p>
                ))}
              </div>
            ) : (
              <div className="preview-stats">
                <div className="stat">
                  <span className="stat-value">{preview.slideCount}</span>
                  <span className="stat-label">Slides</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{preview.hasImages ? '✓' : '–'}</span>
                  <span className="stat-label">Hình ảnh</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Mode Selection */}
        {selectedFile && preview && !preview.errors.length && existingSlidesCount > 0 && !isImporting && importProgress.state !== 'complete' && (
          <div className="import-mode">
            <label>Chế độ import:</label>
            <div className="mode-options">
              <label className={`mode-option ${importMode === 'append' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                />
                <span className="mode-icon">➕</span>
                <span className="mode-text">
                  <strong>Thêm vào cuối</strong>
                  <small>Giữ {existingSlidesCount} slides hiện tại</small>
                </span>
              </label>
              <label className={`mode-option ${importMode === 'replace' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                <span className="mode-icon">🔄</span>
                <span className="mode-text">
                  <strong>Thay thế</strong>
                  <small>Xóa {existingSlidesCount} slides cũ</small>
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Import Progress with Steps */}
        {isImporting && (
          <div className="import-progress-container">
            <div className="progress-steps">
              {IMPORT_STEPS.slice(0, -1).map((step, idx) => (
                <div
                  key={step.key}
                  className={`progress-step ${idx < currentStepIndex ? 'completed' : ''} ${idx === currentStepIndex ? 'active' : ''}`}
                >
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-label">{step.label}</span>
                </div>
              ))}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${importProgress.percent}%` }}
              />
            </div>
            <div className="progress-info">
              <span className="progress-percent">{Math.round(importProgress.percent)}%</span>
              <span className="progress-text">{importProgress.currentStep}</span>
            </div>
          </div>
        )}

        {/* Error Display with Retry */}
        {(importError || importProgress.state === 'error') && (
          <div className="import-error">
            <span className="error-icon">⚠️</span>
            <p>{importError || 'Có lỗi xảy ra trong quá trình import'}</p>
            <button className="btn btn-small btn-secondary" onClick={handleRetry}>
              Thử lại
            </button>
          </div>
        )}

        {/* Success - Saving to database */}
        {importProgress.state === 'complete' && importResult && importResult.slides.length > 0 && (
          <div className="import-success">
            {savingSlides ? (
              <>
                <span className="success-icon">💾</span>
                <p>Đang lưu <strong>{importResult.slides.length}</strong> slides vào database...</p>
                <div className="saving-spinner"></div>
              </>
            ) : (
              <>
                <span className="success-icon">🎉</span>
                <p>Đã lưu thành công <strong>{importResult.slides.length}</strong> slides!</p>
              </>
            )}
          </div>
        )}

        {/* Import finished but no slides */}
        {importProgress.state === 'complete' && importResult && importResult.slides.length === 0 && (
          <div className="import-warning">
            <span className="warning-icon">⚠️</span>
            <p><strong>Không tìm thấy slide nào!</strong></p>
            {importResult.warnings.length > 0 && (
              <ul className="warning-list">
                {importResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
            <p className="hint">
              File cần có định dạng .pptx (PowerPoint 2007+). Kiểm tra lại file và thử lại.
            </p>
            <button className="btn btn-small btn-secondary" onClick={handleRetry}>
              Thử lại
            </button>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={handleClose} disabled={isImporting}>
          {isImporting ? 'Đang xử lý...' : 'Đóng'}
        </button>
        {!isImporting && importProgress.state !== 'complete' && (
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!selectedFile || !preview || preview.errors.length > 0 || preview.slideCount === 0}
          >
            Import {preview?.slideCount ? `(${preview.slideCount} slides)` : ''}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
