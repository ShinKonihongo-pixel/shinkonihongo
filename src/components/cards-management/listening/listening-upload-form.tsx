// File upload form for ListeningAudioView
import React from 'react';
import { Upload, X, Wand2, Loader2 } from 'lucide-react';

interface ListeningUploadFormProps {
  audioTitle: string;
  setAudioTitle: (v: string) => void;
  audioDescription: string;
  setAudioDescription: (v: string) => void;
  selectedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  generatingFurigana: 'title' | 'desc' | 'ttsText' | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateFuriganaTitle: () => void;
  onGenerateFuriganaDesc: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ListeningUploadForm({
  audioTitle,
  setAudioTitle,
  audioDescription,
  setAudioDescription,
  selectedFile,
  fileInputRef,
  generatingFurigana,
  onFileSelect,
  onGenerateFuriganaTitle,
  onGenerateFuriganaDesc,
  onSave,
  onCancel,
}: ListeningUploadFormProps) {
  return (
    <div className="upload-form">
      <div className="form-row">
        <label>File nghe:</label>
        <div className="file-input-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={onFileSelect}
          />
        </div>
      </div>

      {selectedFile && (
        <>
          <div className="form-row">
            <label className="label-with-furigana">
              <span>Tiêu đề:</span>
              <button
                type="button"
                className="furigana-btn"
                onClick={onGenerateFuriganaTitle}
                disabled={!!generatingFurigana || !audioTitle.trim()}
                title="Tạo furigana"
              >
                {generatingFurigana === 'title'
                  ? <Loader2 size={14} className="spin-icon" />
                  : <Wand2 size={14} />}
                <span>Furigana</span>
              </button>
            </label>
            <input
              type="text"
              placeholder="Nhập tiêu đề..."
              value={audioTitle}
              onChange={e => setAudioTitle(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label className="label-with-furigana">
              <span>Mô tả:</span>
              <button
                type="button"
                className="furigana-btn"
                onClick={onGenerateFuriganaDesc}
                disabled={!!generatingFurigana || !audioDescription.trim()}
                title="Tạo furigana"
              >
                {generatingFurigana === 'desc'
                  ? <Loader2 size={14} className="spin-icon" />
                  : <Wand2 size={14} />}
                <span>Furigana</span>
              </button>
            </label>
            <textarea
              placeholder="Mô tả (tuỳ chọn)..."
              value={audioDescription}
              onChange={e => setAudioDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={onCancel}>
              <X size={16} /> Huỷ
            </button>
            <button className="btn-save" onClick={onSave}>
              <Upload size={16} /> Tải lên
            </button>
          </div>
        </>
      )}
    </div>
  );
}
