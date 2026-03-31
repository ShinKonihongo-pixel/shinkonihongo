// TTS (text-to-speech) creation form for ListeningAudioView
import {
  Save, X, Type, Users, Settings, Wand2, Loader2, Volume2, Square, Plus
} from 'lucide-react';
import { FuriganaText } from '../../common/furigana-text';
import { hasFurigana } from '../../../lib/furigana-utils';
import type { KaiwaLine, TtsMode, KaiwaCharacter } from '../../../types/listening';

interface ListeningTtsFormProps {
  ttsTitle: string;
  setTtsTitle: (v: string) => void;
  ttsText: string;
  setTtsText: (v: string) => void;
  ttsDescription: string;
  setTtsDescription: (v: string) => void;
  ttsMode: TtsMode;
  setTtsMode: (mode: TtsMode) => void;
  ttsPreviewing: boolean;
  kaiwaLines: KaiwaLine[];
  setKaiwaLines: (lines: KaiwaLine[]) => void;
  kaiwaCharacters: KaiwaCharacter[];
  getPresetForCharacter: (char: KaiwaCharacter) => { emoji?: string } | undefined;
  generatingFurigana: 'title' | 'desc' | 'ttsText' | null;
  onGenerateFuriganaTtsText: () => void;
  onPreviewTts: () => void;
  onSave: () => void;
  onCancel: () => void;
  onShowCharacterModal: () => void;
}

export function ListeningTtsForm({
  ttsTitle,
  setTtsTitle,
  ttsText,
  setTtsText,
  ttsDescription,
  setTtsDescription,
  ttsMode,
  setTtsMode,
  ttsPreviewing,
  kaiwaLines,
  setKaiwaLines,
  kaiwaCharacters,
  getPresetForCharacter,
  generatingFurigana,
  onGenerateFuriganaTtsText,
  onPreviewTts,
  onSave,
  onCancel,
  onShowCharacterModal,
}: ListeningTtsFormProps) {
  const canSave = ttsTitle.trim() &&
    (ttsMode === 'single' ? ttsText.trim() : kaiwaLines.some(l => l.text.trim()));

  const canPreview =
    ttsMode === 'single' ? !!ttsText.trim() : kaiwaLines.some(l => l.text.trim());

  return (
    <div className="upload-form">
      <div className="form-row">
        <label>Tiêu đề:</label>
        <input
          type="text"
          placeholder="Nhập tiêu đề..."
          value={ttsTitle}
          onChange={e => setTtsTitle(e.target.value)}
        />
      </div>

      {/* Mode toggle */}
      <div className="tts-mode-toggle">
        <button
          className={`mode-btn ${ttsMode === 'single' ? 'active' : ''}`}
          onClick={() => setTtsMode('single')}
        >
          <Type size={16} /> Câu đơn
        </button>
        <button
          className={`mode-btn ${ttsMode === 'kaiwa' ? 'active' : ''}`}
          onClick={() => setTtsMode('kaiwa')}
        >
          <Users size={16} /> Kaiwa
        </button>
      </div>

      {/* Single mode */}
      {ttsMode === 'single' && (
        <div className="form-row">
          <label className="label-with-furigana">
            <span>Nội dung tiếng Nhật:</span>
            <button
              type="button"
              className="furigana-btn"
              onClick={onGenerateFuriganaTtsText}
              disabled={!!generatingFurigana || !ttsText.trim()}
              title="Tạo furigana cho mỗi chữ kanji"
            >
              {generatingFurigana === 'ttsText'
                ? <Loader2 size={14} className="spin-icon" />
                : <Wand2 size={14} />}
              <span>Furigana</span>
            </button>
          </label>
          <textarea
            placeholder="Nhập nội dung tiếng Nhật để đọc..."
            value={ttsText}
            onChange={e => setTtsText(e.target.value)}
            rows={4}
          />
          {hasFurigana(ttsText) && (
            <div className="furigana-preview">
              <FuriganaText text={ttsText} showFurigana={true} />
            </div>
          )}
        </div>
      )}

      {/* Kaiwa mode */}
      {ttsMode === 'kaiwa' && (
        <>
          <div className="kaiwa-characters">
            <label>Nhân vật:</label>
            <div className="character-list">
              {kaiwaCharacters.map(char => {
                const preset = getPresetForCharacter(char);
                return (
                  <span key={char.id} className="character-tag">
                    {preset?.emoji || '👤'} {char.name}
                  </span>
                );
              })}
              <button
                className="add-btn"
                onClick={onShowCharacterModal}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <Settings size={14} /> Cài đặt
              </button>
            </div>
          </div>

          <div className="kaiwa-lines">
            <label>Hội thoại:</label>
            {kaiwaLines.map((line, idx) => (
              <div key={idx} className="kaiwa-line">
                <select
                  value={line.speaker}
                  onChange={e => {
                    const updated = [...kaiwaLines];
                    updated[idx] = { ...updated[idx], speaker: e.target.value };
                    setKaiwaLines(updated);
                  }}
                  className="speaker-select"
                >
                  {kaiwaCharacters.map(c => {
                    const p = getPresetForCharacter(c);
                    return <option key={c.id} value={c.name}>{p?.emoji || '👤'} {c.name}</option>;
                  })}
                </select>
                <input
                  type="text"
                  placeholder="Nội dung câu nói..."
                  value={line.text}
                  onChange={e => {
                    const updated = [...kaiwaLines];
                    updated[idx] = { ...updated[idx], text: e.target.value };
                    setKaiwaLines(updated);
                  }}
                />
                {kaiwaLines.length > 1 && (
                  <button
                    className="btn-cancel"
                    onClick={() => setKaiwaLines(kaiwaLines.filter((_, i) => i !== idx))}
                    style={{ padding: '0.4rem' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              className="add-btn"
              onClick={() => setKaiwaLines([...kaiwaLines, { speaker: kaiwaCharacters[0]?.name || '', text: '' }])}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}
            >
              <Plus size={14} /> Thêm câu
            </button>
          </div>
        </>
      )}

      <div className="form-row">
        <label>Mô tả (tuỳ chọn):</label>
        <textarea
          placeholder="Mô tả hoặc bản dịch..."
          value={ttsDescription}
          onChange={e => setTtsDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="form-actions">
        <button className="btn-cancel" onClick={onCancel}>
          <X size={16} /> Huỷ
        </button>
        <button
          className="btn-save"
          onClick={onPreviewTts}
          style={{
            background: ttsPreviewing
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          }}
          disabled={!canPreview}
        >
          {ttsPreviewing ? <><Square size={16} /> Dừng</> : <><Volume2 size={16} /> Nghe thử</>}
        </button>
        <button className="btn-save" onClick={onSave} disabled={!canSave}>
          <Save size={16} /> Lưu
        </button>
      </div>
    </div>
  );
}
