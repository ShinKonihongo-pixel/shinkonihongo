// Editable Kanji analysis section for flashcard create/edit form
// Loads existing analysis from cache/Firestore, generates via AI if missing, allows editing

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import type { KanjiCharacterAnalysis, KanjiSampleWord } from '../../types/flashcard';
import { extractKanjiCharacters, generateKanjiCharacterAnalysis } from '../../services/kanji-analysis-ai-service';
import { getMultipleKanjiAnalysis, saveMultipleKanjiAnalysis } from '../../services/firestore';
import { kanjiAnalysisCache } from '../../hooks/use-kanji-analysis';
import './kanji-analysis-editor.css';

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
    </div>
  );
}
