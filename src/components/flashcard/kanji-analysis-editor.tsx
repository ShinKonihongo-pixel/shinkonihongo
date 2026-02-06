// Editable Kanji analysis section for flashcard create/edit form
// Loads existing analysis from cache/Firestore, generates via AI if missing, allows editing

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import type { KanjiCharacterAnalysis, KanjiSampleWord } from '../../types/flashcard';
import { extractKanjiCharacters, generateKanjiCharacterAnalysis } from '../../services/kanji-analysis-ai-service';
import { getMultipleKanjiAnalysis, saveMultipleKanjiAnalysis } from '../../services/firestore';
import { kanjiAnalysisCache } from '../../hooks/use-kanji-analysis';

const MIN_SAMPLE_WORDS = 3;
const emptySampleWord = (): KanjiSampleWord => ({ word: '', reading: '', meaning: '' });

// Ensure each analysis has at least MIN_SAMPLE_WORDS sample word slots
function padSampleWords(analysis: KanjiCharacterAnalysis): KanjiCharacterAnalysis {
  if (analysis.sampleWords.length >= MIN_SAMPLE_WORDS) return analysis;
  const padded = [...analysis.sampleWords];
  while (padded.length < MIN_SAMPLE_WORDS) padded.push(emptySampleWord());
  return { ...analysis, sampleWords: padded };
}

interface KanjiAnalysisEditorProps {
  kanjiText: string; // From the kanji or vocabulary field
}

export function KanjiAnalysisEditor({ kanjiText }: KanjiAnalysisEditorProps) {
  const [analyses, setAnalyses] = useState<KanjiCharacterAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [dirty, setDirty] = useState(false);

  const characters = extractKanjiCharacters(kanjiText);
  const hasKanji = characters.length > 0;

  // Load existing analyses from cache/Firestore
  const loadAnalyses = useCallback(async () => {
    if (characters.length === 0) {
      setAnalyses([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check in-memory cache
      const fromCache: KanjiCharacterAnalysis[] = [];
      const notCached: string[] = [];

      for (const c of characters) {
        const hit = kanjiAnalysisCache.get(c);
        if (hit) fromCache.push(hit);
        else notCached.push(c);
      }

      let fromFirestore: KanjiCharacterAnalysis[] = [];
      if (notCached.length > 0) {
        fromFirestore = await getMultipleKanjiAnalysis(notCached);
        for (const a of fromFirestore) kanjiAnalysisCache.set(a.character, a);
      }

      const all = [...fromCache, ...fromFirestore];
      all.sort((a, b) => characters.indexOf(a.character) - characters.indexOf(b.character));
      setAnalyses(all.map(padSampleWords));
      setDirty(false);
    } catch (err) {
      console.error('Load kanji analysis error:', err);
      setError('Lỗi khi tải phân tích Kanji');
    } finally {
      setLoading(false);
    }
  }, [kanjiText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load when kanjiText changes
  useEffect(() => {
    if (hasKanji) loadAnalyses();
    else setAnalyses([]);
  }, [kanjiText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate missing analyses via AI
  const handleGenerate = async () => {
    if (characters.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const existingChars = new Set(analyses.map(a => a.character));
      const missing = characters.filter(c => !existingChars.has(c));

      if (missing.length === 0) {
        // Regenerate all
        const generated = await generateKanjiCharacterAnalysis(characters);
        try { await saveMultipleKanjiAnalysis(generated); } catch (e) { console.error(e); }
        for (const a of generated) kanjiAnalysisCache.set(a.character, a);
        generated.sort((a, b) => characters.indexOf(a.character) - characters.indexOf(b.character));
        setAnalyses(generated.map(padSampleWords));
      } else {
        // Generate only missing
        const generated = await generateKanjiCharacterAnalysis(missing);
        try { await saveMultipleKanjiAnalysis(generated); } catch (e) { console.error(e); }
        for (const a of generated) kanjiAnalysisCache.set(a.character, a);

        const all = [...analyses, ...generated];
        all.sort((a, b) => characters.indexOf(a.character) - characters.indexOf(b.character));
        setAnalyses(all.map(padSampleWords));
      }
      setDirty(false);
    } catch (err) {
      console.error('Generate kanji analysis error:', err);
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo phân tích');
    } finally {
      setLoading(false);
    }
  };

  // Save edited analyses to Firestore (strip empty sample words before persisting)
  const handleSave = async () => {
    setSaving(true);
    try {
      const cleaned = analyses.map(a => ({
        ...a,
        sampleWords: a.sampleWords.filter(sw => sw.word.trim() || sw.reading.trim() || sw.meaning.trim()),
      }));
      await saveMultipleKanjiAnalysis(cleaned);
      for (const a of cleaned) kanjiAnalysisCache.set(a.character, a);
      setDirty(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (err) {
      console.error('Save kanji analysis error:', err);
      setError('Lỗi khi lưu phân tích');
    } finally {
      setSaving(false);
    }
  };

  // Field updaters
  const updateField = (charIdx: number, field: keyof KanjiCharacterAnalysis, value: string | string[]) => {
    setAnalyses(prev => prev.map((a, i) => i === charIdx ? { ...a, [field]: value } : a));
    setDirty(true);
  };

  const updateSampleWord = (charIdx: number, swIdx: number, field: keyof KanjiSampleWord, value: string) => {
    setAnalyses(prev => prev.map((a, i) => {
      if (i !== charIdx) return a;
      const newWords = a.sampleWords.map((sw, j) => j === swIdx ? { ...sw, [field]: value } : sw);
      return { ...a, sampleWords: newWords };
    }));
    setDirty(true);
  };

  const addSampleWord = (charIdx: number) => {
    setAnalyses(prev => prev.map((a, i) => {
      if (i !== charIdx) return a;
      return { ...a, sampleWords: [...a.sampleWords, { word: '', reading: '', meaning: '' }] };
    }));
    setDirty(true);
  };

  const removeSampleWord = (charIdx: number, swIdx: number) => {
    setAnalyses(prev => prev.map((a, i) => {
      if (i !== charIdx) return a;
      return { ...a, sampleWords: a.sampleWords.filter((_, j) => j !== swIdx) };
    }));
    setDirty(true);
  };

  if (!hasKanji) return null;

  // Which characters don't have analysis yet?
  const analyzedChars = new Set(analyses.map(a => a.character));
  const missingChars = characters.filter(c => !analyzedChars.has(c));

  return (
    <div className="kae-section">
      <div className="kae-header" onClick={() => setExpanded(!expanded)}>
        <div className="kae-header-left">
          <Sparkles size={15} className="kae-header-icon" />
          <span className="kae-header-title">Phân tích Kanji</span>
          <span className="kae-header-badge">{characters.length} chữ</span>
        </div>
        <div className="kae-header-right">
          {dirty && <span className="kae-unsaved">Chưa lưu</span>}
          {savedMsg && <span className="kae-saved">Đã lưu</span>}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="kae-body">
          {/* Action buttons */}
          <div className="kae-actions">
            {missingChars.length > 0 ? (
              <button type="button" className="kae-btn kae-btn-generate" onClick={handleGenerate} disabled={loading}>
                {loading ? <RefreshCw size={14} className="kae-spin" /> : <Sparkles size={14} />}
                {analyses.length === 0 ? 'Tạo phân tích AI' : `Tạo thêm (${missingChars.join(', ')})`}
              </button>
            ) : analyses.length > 0 ? (
              <button type="button" className="kae-btn kae-btn-regen" onClick={handleGenerate} disabled={loading}>
                {loading ? <RefreshCw size={14} className="kae-spin" /> : <RefreshCw size={14} />}
                Tạo lại tất cả
              </button>
            ) : null}

            {dirty && (
              <button type="button" className="kae-btn kae-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={14} className="kae-spin" /> : <Save size={14} />}
                Lưu phân tích
              </button>
            )}
          </div>

          {error && <div className="kae-error">{error}</div>}

          {loading && analyses.length === 0 && (
            <div className="kae-loading">Đang tạo phân tích...</div>
          )}

          {/* Editable character cards */}
          {analyses.map((a, charIdx) => (
            <div key={a.character} className="kae-card">
              <div className="kae-card-header">
                <span className="kae-char">{a.character}</span>
                <span className="kae-char-label">{a.sinoVietnamese || '—'}</span>
              </div>

              <div className="kae-fields">
                {/* ON yomi */}
                <div className="kae-field">
                  <label>ON (カタカナ)</label>
                  <input
                    type="text"
                    value={a.onYomi.join('、')}
                    onChange={e => updateField(charIdx, 'onYomi', e.target.value.split(/[、,]/).map(s => s.trim()).filter(Boolean))}
                    placeholder="ショク、ジキ"
                  />
                </div>

                {/* KUN yomi */}
                <div className="kae-field">
                  <label>KUN (ひらがな)</label>
                  <input
                    type="text"
                    value={a.kunYomi.join('、')}
                    onChange={e => updateField(charIdx, 'kunYomi', e.target.value.split(/[、,]/).map(s => s.trim()).filter(Boolean))}
                    placeholder="た.べる、く.う"
                  />
                </div>

                {/* Sino-Vietnamese */}
                <div className="kae-field">
                  <label>Hán Việt</label>
                  <input
                    type="text"
                    value={a.sinoVietnamese}
                    onChange={e => updateField(charIdx, 'sinoVietnamese', e.target.value)}
                    placeholder="THỰC"
                  />
                </div>

                {/* Mnemonic */}
                <div className="kae-field kae-field-full">
                  <label>Mẹo nhớ</label>
                  <textarea
                    value={a.mnemonic}
                    onChange={e => updateField(charIdx, 'mnemonic', e.target.value)}
                    placeholder="Mẹo ghi nhớ..."
                    rows={2}
                  />
                </div>

                {/* Sample words */}
                <div className="kae-field kae-field-full">
                  <label>
                    Từ mẫu
                    <button type="button" className="kae-btn-add-sw" onClick={() => addSampleWord(charIdx)} title="Thêm từ mẫu">
                      <Plus size={12} />
                    </button>
                  </label>
                  {a.sampleWords.map((sw, swIdx) => (
                    <div key={swIdx} className="kae-sw-row">
                      <input
                        type="text"
                        value={sw.word}
                        onChange={e => updateSampleWord(charIdx, swIdx, 'word', e.target.value)}
                        placeholder="食事"
                        className="kae-sw-word"
                      />
                      <input
                        type="text"
                        value={sw.reading}
                        onChange={e => updateSampleWord(charIdx, swIdx, 'reading', e.target.value)}
                        placeholder="しょくじ"
                        className="kae-sw-reading"
                      />
                      <input
                        type="text"
                        value={sw.meaning}
                        onChange={e => updateSampleWord(charIdx, swIdx, 'meaning', e.target.value)}
                        placeholder="Bữa ăn"
                        className="kae-sw-meaning"
                      />
                      <button type="button" className="kae-btn-rm-sw" onClick={() => removeSampleWord(charIdx, swIdx)} title="Xóa">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{kanjiAnalysisEditorStyles}</style>
    </div>
  );
}

const kanjiAnalysisEditorStyles = `
  .kae-section {
    border: 1px solid var(--border-color, #ddd);
    border-radius: 10px;
    overflow: hidden;
    margin-top: 0.25rem;
  }

  .kae-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.875rem;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05));
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
  }

  .kae-header:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08));
  }

  .kae-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .kae-header-icon { color: #6366f1; }

  .kae-header-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #4338ca;
  }

  .kae-header-badge {
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
    border-radius: 10px;
    font-weight: 500;
  }

  .kae-header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6366f1;
  }

  .kae-unsaved {
    font-size: 0.7rem;
    color: #f59e0b;
    font-weight: 500;
  }

  .kae-saved {
    font-size: 0.7rem;
    color: #22c55e;
    font-weight: 500;
    animation: kae-fade 2s ease-out;
  }

  @keyframes kae-fade {
    0%, 70% { opacity: 1; }
    100% { opacity: 0; }
  }

  .kae-body {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .kae-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .kae-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid;
  }

  .kae-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .kae-btn-generate {
    background: rgba(99, 102, 241, 0.08);
    border-color: rgba(99, 102, 241, 0.25);
    color: #4f46e5;
  }

  .kae-btn-generate:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.15);
  }

  .kae-btn-regen {
    background: rgba(107, 114, 128, 0.08);
    border-color: rgba(107, 114, 128, 0.25);
    color: #6b7280;
  }

  .kae-btn-regen:hover:not(:disabled) {
    background: rgba(107, 114, 128, 0.15);
  }

  .kae-btn-save {
    background: rgba(34, 197, 94, 0.08);
    border-color: rgba(34, 197, 94, 0.25);
    color: #16a34a;
  }

  .kae-btn-save:hover:not(:disabled) {
    background: rgba(34, 197, 94, 0.15);
  }

  .kae-error {
    color: #ef4444;
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    background: rgba(239, 68, 68, 0.06);
    border-radius: 8px;
  }

  .kae-loading {
    color: #6366f1;
    font-size: 0.8rem;
    padding: 1rem;
    text-align: center;
  }

  /* Character card */
  .kae-card {
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 10px;
    overflow: hidden;
  }

  .kae-card-header {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
    background: rgba(99, 102, 241, 0.04);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }

  .kae-char {
    font-size: 1.5rem;
    font-weight: 700;
    color: #4338ca;
    line-height: 1;
  }

  .kae-char-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #6366f1;
    letter-spacing: 0.5px;
  }

  .kae-fields {
    padding: 0.625rem 0.75rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .kae-field-full { grid-column: 1 / -1; }

  .kae-field label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .kae-field input,
  .kae-field textarea {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    font-size: 0.82rem;
    background: white;
    color: #1f2937;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .kae-field input:focus,
  .kae-field textarea:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }

  .kae-field textarea {
    resize: vertical;
    min-height: 2.5rem;
  }

  /* Sample words rows */
  .kae-sw-row {
    display: flex;
    gap: 0.375rem;
    margin-bottom: 0.375rem;
    align-items: center;
  }

  .kae-sw-word { flex: 2; }
  .kae-sw-reading { flex: 2; }
  .kae-sw-meaning { flex: 3; }

  .kae-sw-row input {
    padding: 0.3rem 0.5rem;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    font-size: 0.8rem;
    background: white;
    color: #1f2937;
    transition: border-color 0.2s;
  }

  .kae-sw-row input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }

  .kae-btn-add-sw {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #6366f1;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.06);
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s;
  }

  .kae-btn-add-sw:hover {
    background: rgba(99, 102, 241, 0.15);
  }

  .kae-btn-rm-sw {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    background: transparent;
    border-radius: 5px;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .kae-btn-rm-sw:hover {
    background: rgba(239, 68, 68, 0.08);
  }

  .kae-spin {
    animation: kae-spin-anim 1s linear infinite;
  }

  @keyframes kae-spin-anim {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .kae-fields {
      grid-template-columns: 1fr;
    }

    .kae-field-full { grid-column: 1; }

    .kae-sw-row {
      flex-wrap: wrap;
    }

    .kae-sw-word,
    .kae-sw-reading { flex: 1 1 45%; }
    .kae-sw-meaning { flex: 1 1 100%; }
  }
`;
