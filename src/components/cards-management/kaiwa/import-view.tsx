// Kaiwa Import View - Document import and batch processing

import { useRef } from 'react';
import { Upload, FileText, MessageSquare } from 'lucide-react';
import type { ImportResults } from './kaiwa-tab-types';

interface ImportViewProps {
  importText: string;
  setImportText: (text: string) => void;
  importResults: ImportResults | null;
  setImportResults: (results: ImportResults | null) => void;
  isProcessingImport: boolean;
  setIsProcessingImport: (processing: boolean) => void;
  onImportConfirm: () => Promise<void>;
  onProcessText: (text: string) => void;
}

export function ImportView({
  importText,
  setImportText,
  importResults,
  setImportResults,
  isProcessingImport,
  setIsProcessingImport,
  onImportConfirm,
  onProcessText,
}: ImportViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImport(true);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        setImportText(text);
        onProcessText(text);
      } else {
        // For PDF/images, show placeholder message
        setImportResults({
          questions: [],
          errors: ['Tính năng OCR cho PDF/ảnh đang được phát triển. Hiện tại hỗ trợ file .txt']
        });
      }
    } catch (error) {
      setImportResults({
        questions: [],
        errors: ['Lỗi đọc file: ' + (error instanceof Error ? error.message : 'Unknown error')]
      });
    } finally {
      setIsProcessingImport(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="kaiwa-import-tab">
      <div className="import-header">
        <h3><Upload size={24} /> Import Câu Hỏi</h3>
        <p>Nhập nhiều câu hỏi cùng lúc từ file hoặc paste trực tiếp</p>
      </div>

      <div className="import-options">
        {/* File Upload */}
        <div className="import-option">
          <div className="option-header">
            <FileText size={20} />
            <span>Upload File</span>
          </div>
          <p>Hỗ trợ: .txt (mỗi dòng là một câu hỏi)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx,image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingImport}
          >
            <Upload size={16} /> Chọn file
          </button>
        </div>

        {/* Text Input */}
        <div className="import-option">
          <div className="option-header">
            <MessageSquare size={20} />
            <span>Nhập trực tiếp</span>
          </div>
          <p>Format: CâuHỏiJP | DịchVN | NgữCảnh | GợiÝ1 | GợiÝ2...</p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`Ví dụ:\nお名前は何ですか | Tên bạn là gì? | Gặp người mới | 私は山田です | 田中と申します\n何時ですか | Mấy giờ rồi? | Hỏi giờ`}
            rows={6}
          />
          <button
            className="btn btn-primary"
            onClick={() => onProcessText(importText)}
            disabled={!importText.trim() || isProcessingImport}
          >
            Xử lý
          </button>
        </div>
      </div>

      {/* Import Preview */}
      {importResults && (
        <div className="import-preview">
          <h4>Kết quả xử lý</h4>

          {importResults.errors.length > 0 && (
            <div className="import-errors">
              {importResults.errors.map((err, idx) => (
                <div key={idx} className="error-item">⚠️ {err}</div>
              ))}
            </div>
          )}

          {importResults.questions.length > 0 && (
            <>
              <div className="preview-list">
                {importResults.questions.slice(0, 10).map((q, idx) => (
                  <div key={idx} className="preview-item">
                    <div className="preview-ja">{q.questionJa}</div>
                    {q.questionVi && <div className="preview-vi">{q.questionVi}</div>}
                  </div>
                ))}
                {importResults.questions.length > 10 && (
                  <p className="preview-more">...và {importResults.questions.length - 10} câu hỏi khác</p>
                )}
              </div>

              <div className="import-actions">
                <button
                  className="btn btn-primary"
                  onClick={onImportConfirm}
                  disabled={isProcessingImport}
                >
                  Import {importResults.questions.length} câu hỏi
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setImportResults(null); setImportText(''); }}
                >
                  Hủy
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
