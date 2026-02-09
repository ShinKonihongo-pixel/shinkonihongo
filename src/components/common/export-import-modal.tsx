// Export/Import Modal for data backup and restore

import { useState, useRef } from 'react';
import type { Flashcard, Lesson } from '../../types/flashcard';
import type { StudySession, GameSession, JLPTSession } from '../../types/user';
import {
  createExportData,
  exportToJSON,
  exportToCSV,
  parseImportFile,
  getImportSummary,
  type ExportData,
} from '../../lib/data-export';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
  lessons: Lesson[];
  studySessions?: StudySession[];
  gameSessions?: GameSession[];
  jlptSessions?: JLPTSession[];
  onImport: (data: ExportData) => Promise<void>;
}

export function ExportImportModal({
  isOpen,
  onClose,
  flashcards,
  lessons,
  studySessions,
  gameSessions,
  jlptSessions,
  onImport,
}: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ReturnType<typeof getImportSummary> | null>(null);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle export
  const handleExportJSON = () => {
    const data = createExportData(flashcards, lessons, studySessions, gameSessions, jlptSessions);
    exportToJSON(data);
  };

  const handleExportCSV = () => {
    exportToCSV(flashcards);
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportSuccess(false);

    const data = await parseImportFile(file);
    if (data) {
      setImportData(data);
      setImportPreview(getImportSummary(data));
    } else {
      setImportError('Không thể đọc file. Vui lòng chọn file JSON hợp lệ.');
      setImportPreview(null);
      setImportData(null);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!importData) return;

    setIsImporting(true);
    setImportError(null);

    try {
      await onImport(importData);
      setImportSuccess(true);
      setImportFile(null);
      setImportPreview(null);
      setImportData(null);
    } catch (_error) {
      setImportError('Có lỗi xảy ra khi import dữ liệu.');
    } finally {
      setIsImporting(false);
    }
  };

  // Reset import state
  const handleResetImport = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportData(null);
    setImportError(null);
    setImportSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="export-import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Sao lưu & Khôi phục dữ liệu</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Xuất dữ liệu
          </button>
          <button
            className={`modal-tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Nhập dữ liệu
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'export' ? (
            <div className="export-section">
              <p className="export-info">
                Xuất dữ liệu để sao lưu hoặc chuyển sang thiết bị khác.
              </p>

              <div className="export-stats">
                <div className="stat-item">
                  <span className="stat-label">Flashcards</span>
                  <span className="stat-value">{flashcards.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Bài học</span>
                  <span className="stat-value">{lessons.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Lịch sử học</span>
                  <span className="stat-value">{studySessions?.length || 0}</span>
                </div>
              </div>

              <div className="export-buttons">
                <button className="btn btn-primary" onClick={handleExportJSON}>
                  📦 Xuất JSON (Đầy đủ)
                </button>
                <button className="btn btn-secondary" onClick={handleExportCSV}>
                  📊 Xuất CSV (Chỉ thẻ)
                </button>
              </div>

              <p className="export-note">
                * JSON: Sao lưu đầy đủ dữ liệu, có thể khôi phục lại<br />
                * CSV: Chỉ xuất danh sách từ vựng, dùng với Excel
              </p>
            </div>
          ) : (
            <div className="import-section">
              {importSuccess ? (
                <div className="import-success">
                  <span className="success-icon">✅</span>
                  <p>Import thành công!</p>
                  <button className="btn btn-primary" onClick={handleResetImport}>
                    Import thêm
                  </button>
                </div>
              ) : (
                <>
                  <p className="import-info">
                    Chọn file JSON đã xuất trước đó để khôi phục dữ liệu.
                  </p>

                  <div className="file-input-wrapper">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="file-input"
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📁 Chọn file JSON
                    </button>
                    {importFile && (
                      <span className="file-name">{importFile.name}</span>
                    )}
                  </div>

                  {importError && (
                    <div className="import-error">{importError}</div>
                  )}

                  {importPreview && (
                    <div className="import-preview">
                      <h4>Xem trước dữ liệu</h4>
                      <div className="preview-stats">
                        <div className="stat-item">
                          <span className="stat-label">Flashcards</span>
                          <span className="stat-value">{importPreview.flashcardCount}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Bài học</span>
                          <span className="stat-value">{importPreview.lessonCount}</span>
                        </div>
                      </div>
                      <div className="preview-levels">
                        {Object.entries(importPreview.byLevel).map(([level, count]) => (
                          <span key={level} className="level-tag">
                            {level}: {count}
                          </span>
                        ))}
                      </div>

                      <div className="import-warning">
                        ⚠️ Import sẽ thêm dữ liệu mới, không ghi đè dữ liệu hiện có.
                      </div>

                      <button
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={isImporting}
                      >
                        {isImporting ? 'Đang import...' : '📥 Import dữ liệu'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
