// Kanji radical decomposition modal — shows radicals, swap suggestions, stroke preview

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Shuffle, RotateCcw, Sparkles, Save } from 'lucide-react';
import HanziWriter from 'hanzi-writer';
import { ModalShell } from '../ui/modal-shell';
import type { KanjiCard } from '../../types/kanji';
import { getRadicalInfo, getKanjiByRadical, getSeedRadicals } from '../../utils/radical-kanji-index';
import { getDecomposition } from '../../data/kanji-decomposition';
import { getSeedInfo, getSeedByCharacter } from '../../data/kanji-seed';
import { RADICAL_MAP, BASE_TO_VARIANTS, VARIANT_TO_BASE } from '../../data/radicals';
import { cachedCharDataLoader } from '../../services/hanzi-writer-cache';
import './kanji-decomposer-modal.css';

/** Get all variant forms for a radical character (including itself) */
function getRadicalVariants(char: string): { character: string; name: string; meaning: string }[] {
  // Find base character
  const base = VARIANT_TO_BASE[char] || char;
  const baseInfo = RADICAL_MAP[base];
  if (!baseInfo) return [];
  const results: { character: string; name: string; meaning: string }[] = [
    { character: base, name: baseInfo.vietnameseName, meaning: baseInfo.meaning },
  ];
  const variants = BASE_TO_VARIANTS[base];
  if (variants) {
    for (const v of variants) {
      const vi = RADICAL_MAP[v];
      if (vi) results.push({ character: v, name: vi.vietnameseName, meaning: vi.meaning });
    }
  }
  return results;
}

// Cached component info
const _compInfoCache = new Map<string, { name: string; meaning: string }>();
function getComponentInfo(char: string): { name: string; meaning: string } {
  let r = _compInfoCache.get(char);
  if (r) return r;
  const rad = getRadicalInfo(char);
  if (rad) { r = { name: rad.vietnameseName, meaning: rad.meaning }; }
  else {
    const seed = getSeedInfo(char);
    r = seed ? { name: seed.hv, meaning: seed.meaning } : { name: char, meaning: '' };
  }
  _compInfoCache.set(char, r);
  return r;
}

const RADICAL_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#818cf8' },
  { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#f472b6' },
  { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399' },
  { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24' },
  { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#60a5fa' },
  { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#c084fc' },
];

interface SwapSuggestion { radical: string; kanji: string; sinoVietnamese: string; meaning: string; }

interface Props {
  kanjiCard: KanjiCard;
  onClose: () => void;
  onSaveRadicals?: (radicals: string[]) => void;
  onSaveMnemonic?: (mnemonic: string) => void;
  onSaveSampleWords?: (sampleWords: KanjiCard['sampleWords']) => void;
  /** Read-only mode: only show saved data from Firestore, no editing, no static fallback */
  readOnly?: boolean;
  /** All kanji cards from Firestore — used in readOnly mode to show kanji by radical */
  allCards?: KanjiCard[];
}

// Cached char sets
const _charSetCache = new Map<string, Set<string>>();
function getCharSet(rad: string): Set<string> {
  let s = _charSetCache.get(rad);
  if (!s) { s = new Set(getKanjiByRadical(rad).map(e => e.character)); _charSetCache.set(rad, s); }
  return s;
}

function intersectSets(rads: string[]): Set<string> {
  if (!rads.length) return new Set();
  const sets = rads.map(r => getCharSet(r)).sort((a, b) => a.size - b.size);
  const result = new Set(sets[0]);
  for (let i = 1; i < sets.length; i++) {
    const next = sets[i];
    for (const c of result) { if (!next.has(c)) result.delete(c); }
    if (!result.size) break;
  }
  return result;
}

function findRelatedKanji(currentRads: string[], swapIdx: number): SwapSuggestion[] {
  const others = currentRads.filter((_, i) => i !== swapIdx);
  if (!others.length) return [];
  const candidates = intersectSets(others);
  const swapped = currentRads[swapIdx];
  const otherSet = new Set(others);
  const results: SwapSuggestion[] = [];
  for (const k of candidates) {
    if (results.length >= 12) break;
    const d = getDecomposition(k) || getSeedRadicals(k);
    if (!d) continue;
    const diff = d.filter(r => !otherSet.has(r) && r !== swapped);
    if (!diff.length) continue;
    const entry = getKanjiByRadical(diff[0]).find(e => e.character === k);
    if (entry) results.push({ radical: diff[0], kanji: k, sinoVietnamese: entry.sinoVietnamese, meaning: entry.meaning });
  }
  return results;
}

export function KanjiDecomposerModal({ kanjiCard, onClose, onSaveRadicals, onSaveMnemonic, onSaveSampleWords, readOnly, allCards }: Props) {
  // In readOnly mode: only use data saved in Firestore (kanjiCard.radicals)
  // In edit mode: use static decomposition as fallback
  const decomposition = useMemo(() => {
    if (readOnly) {
      // Only show what admin has saved in Firestore
      return kanjiCard.radicals?.length ? kanjiCard.radicals : [];
    }
    // Edit mode: Firestore data (admin-saved) takes priority over static KRADFILE
    if (kanjiCard.radicals?.length) return kanjiCard.radicals;
    return getDecomposition(kanjiCard.character) || getSeedRadicals(kanjiCard.character) || [];
  }, [kanjiCard.character, kanjiCard.radicals, readOnly]);

  const [radicals, setRadicals] = useState(decomposition);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [mnemonic, setMnemonic] = useState(kanjiCard.mnemonic || '');
  const [editingMnemonic, setEditingMnemonic] = useState(false);

  // Sync radicals state when decomposition source changes (e.g. after save updates kanjiCard)
  useEffect(() => { setRadicals(decomposition); }, [decomposition]);
  useEffect(() => { setMnemonic(kanjiCard.mnemonic || ''); }, [kanjiCard.mnemonic]);
  const [strokeChar, setStrokeChar] = useState<string | null>(null);
  const [swapList, setSwapList] = useState<SwapSuggestion[]>([]);
  const [addingKanji, setAddingKanji] = useState(false);
  const [newInput, setNewInput] = useState('');

  const isDirty = useMemo(
    () => radicals.length !== decomposition.length || radicals.some((r, i) => r !== decomposition[i]),
    [radicals, decomposition]
  );

  // ESC key: close stroke preview first, then close modal
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && strokeChar) { e.stopImmediatePropagation(); setStrokeChar(null); } };
    document.addEventListener('keydown', h, true);
    return () => document.removeEventListener('keydown', h, true);
  }, [strokeChar]);

  // Result kanji is always the current card's character — editing radicals only changes the decomposition, not the kanji
  const resultKanji = kanjiCard.character;
  const resultInfo = { hv: kanjiCard.sinoVietnamese, meaning: kanjiCard.meaning };

  // When swapIdx changes, compute new suggestions
  useEffect(() => {
    if (swapIdx !== null) {
      setSwapList(findRelatedKanji(radicals, swapIdx));
      setAddingKanji(false);
      setNewInput('');
    }
  }, [swapIdx, radicals]);

  const [editingRadIdx, setEditingRadIdx] = useState<number | null>(null);
  const [editRadInput, setEditRadInput] = useState('');
  const [addingRadical, setAddingRadical] = useState(false);
  const [addRadInput, setAddRadInput] = useState('');
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  // ReadOnly mode: selected radical to show kanji list from allCards (Firestore)
  // Uses saved radicals first, falls back to KRAD static decomposition
  const [selectedRadical, setSelectedRadical] = useState<string | null>(null);
  const radicalKanjiList = useMemo(() => {
    if (!selectedRadical || !allCards) return [];
    return allCards.filter(c => {
      if (c.character === kanjiCard.character) return false;
      // Check saved radicals from Firestore first
      if (c.radicals?.length && c.radicals.includes(selectedRadical)) return true;
      // Fallback: check KRAD static decomposition data
      const staticRads = getDecomposition(c.character) || getSeedRadicals(c.character);
      return staticRads ? staticRads.includes(selectedRadical) : false;
    });
  }, [selectedRadical, allCards, kanjiCard.character]);

  const handleReset = () => { setRadicals(decomposition); setSwapIdx(null); setEditingRadIdx(null); setAddingRadical(false); setAddRadInput(''); };
  // Load correct decomposition from KRADFILE (ignores Firestore data)
  const kradData = useMemo(() => getDecomposition(kanjiCard.character) || getSeedRadicals(kanjiCard.character) || [], [kanjiCard.character]);
  const loadFromKrad = () => { setRadicals(kradData); setSwapIdx(null); setEditingRadIdx(null); };
  const addRadical = (char: string) => {
    if (!char.trim()) return;
    setRadicals(prev => [...prev, char.trim()]);
    setAddRadInput('');
    setAddingRadical(false);
  };
  const doSave = () => { onSaveRadicals?.(radicals); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  // Drag-and-drop reorder for swap list items
  const handleSwapDragEnd = (toIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === toIdx) { dragIdx.current = null; setDragOverIdx(null); return; }
    setSwapList(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx.current!, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
    dragIdx.current = null;
    setDragOverIdx(null);
  };
  const removeRadical = (idx: number) => {
    setRadicals(prev => prev.filter((_, i) => i !== idx));
    if (swapIdx === idx) setSwapIdx(null);
    else if (swapIdx !== null && swapIdx > idx) setSwapIdx(swapIdx - 1);
    setEditingRadIdx(null);
  };
  const replaceRadical = (idx: number, char: string) => {
    if (!char.trim()) return;
    setRadicals(prev => prev.map((r, i) => i === idx ? char.trim() : r));
    setEditingRadIdx(null);
    setEditRadInput('');
  };
  const removeFromList = (k: string) => setSwapList(prev => prev.filter(s => s.kanji !== k));
  const addToList = (char: string) => {
    if (!char.trim() || swapList.some(s => s.kanji === char)) return;
    const info = getSeedInfo(char);
    setSwapList(prev => [...prev, { radical: '', kanji: char, sinoVietnamese: info?.hv || '', meaning: info?.meaning || '' }]);
    setNewInput('');
    setAddingKanji(false);
  };

  // Get stroke info for preview — use current state for the main kanji, static data for others
  const strokeInfo = useMemo(() => {
    if (!strokeChar) return null;
    if (strokeChar === kanjiCard.character) {
      // Use current edited radicals and mnemonic
      return { hv: kanjiCard.sinoVietnamese, meaning: kanjiCard.meaning, mnemonic: mnemonic, radicals: radicals };
    }
    const info = getSeedInfo(strokeChar);
    const mn = getSeedByCharacter(strokeChar)?.mnemonic || '';
    const rads = getDecomposition(strokeChar) || getSeedRadicals(strokeChar) || [];
    return { hv: info?.hv || '', meaning: info?.meaning || '', mnemonic: mn, radicals: rads };
  }, [strokeChar, kanjiCard, radicals, mnemonic]);

  return (
    <ModalShell isOpen onClose={onClose} maxWidth={720} hideClose className="kdc-modal-shell">
        <div className="kdc-header">
          <div className="kdc-header-left">
            <Sparkles size={18} className="kdc-header-icon" />
            <h3>Phân tích bộ thủ</h3>
          </div>
          <div className="kdc-header-actions">
            {!readOnly && onSaveRadicals && isDirty && (
              <button className="kdc-save-btn" onClick={doSave}>
                <Save size={14} /> {saved ? 'Đã lưu' : 'Lưu'}
              </button>
            )}
            {!readOnly && kradData.length > 0 && (
              <button className="kdc-krad-btn" onClick={loadFromKrad} title="Tải bộ thủ từ KRADFILE (đúng cách viết)">KRAD</button>
            )}
            {!readOnly && <button className="kdc-icon-btn" onClick={handleReset} title="Đặt lại"><RotateCcw size={16} /></button>}
            <button className="kdc-icon-btn" onClick={onClose} title="Đóng"><X size={18} /></button>
          </div>
        </div>

        <div className="kdc-body">
          {/* ReadOnly empty state */}
          {readOnly && !radicals.length && (
            <div className="kdc-empty-readonly">
              <div className="kdc-empty-char">{kanjiCard.character}</div>
              <div className="kdc-empty-label">{kanjiCard.sinoVietnamese} — {kanjiCard.meaning}</div>
              <div className="kdc-empty-msg">Chưa có thông tin phân tích bộ thủ</div>
            </div>
          )}

          {/* Equation: radicals + = result */}
          {radicals.length > 0 && (
            <div className="kdc-main-equation">
              {radicals.map((r, idx) => {
                const ci = getComponentInfo(r);
                const color = RADICAL_COLORS[idx % RADICAL_COLORS.length];
                return (
                  <div key={`${r}-${idx}`} className="kdc-eq-item">
                    {idx > 0 && <span className="kdc-eq-plus">+</span>}
                    <div
                      className={`kdc-radical-card ${swapIdx === idx ? 'kdc-swapping' : ''} ${readOnly && !allCards ? 'kdc-readonly' : ''} ${readOnly && selectedRadical === r ? 'kdc-radical-selected' : ''}`}
                      style={{ background: color.bg, borderColor: color.border }}
                      onClick={readOnly
                        ? (allCards ? () => setSelectedRadical(selectedRadical === r ? null : r) : undefined)
                        : () => setSwapIdx(swapIdx === idx ? null : idx)
                      }
                    >
                      {/* Edit/delete buttons — only in edit mode */}
                      {!readOnly && onSaveRadicals && (
                        <div className="kdc-rad-actions">
                          <button className="kdc-rad-action" title="Sửa" onClick={e => { e.stopPropagation(); setEditingRadIdx(idx); setEditRadInput(r); }}>✎</button>
                          <button className="kdc-rad-action kdc-rad-delete" title="Xoá" onClick={e => { e.stopPropagation(); removeRadical(idx); }}>×</button>
                        </div>
                      )}
                      {editingRadIdx === idx ? (
                        <RadicalEditWithVariants
                          value={editRadInput}
                          onChange={setEditRadInput}
                          onConfirm={(char) => replaceRadical(idx, char)}
                          onCancel={() => { setEditingRadIdx(null); setEditRadInput(''); }}
                        />
                      ) : (
                        <>
                          <span className="kdc-radical-char" style={{ color: color.text }}>{r}</span>
                          <span className="kdc-radical-name">{ci.name}</span>
                          {ci.meaning && <span className="kdc-radical-meaning">{ci.meaning}</span>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Add radical button — edit mode only */}
              {!readOnly && onSaveRadicals && (
                <div className="kdc-eq-item">
                  <span className="kdc-eq-plus">+</span>
                  {addingRadical ? (
                    <RadicalAddWithVariants
                      value={addRadInput}
                      onChange={setAddRadInput}
                      onConfirm={addRadical}
                      onCancel={() => { setAddingRadical(false); setAddRadInput(''); }}
                    />
                  ) : (
                    <button className="kdc-add-radical-btn" onClick={() => setAddingRadical(true)} title="Thêm bộ thủ">+</button>
                  )}
                </div>
              )}
              {<span className="kdc-eq-equals">=</span>}
              <div className="kdc-result-block" onClick={() => setStrokeChar(resultKanji)} style={{ cursor: 'pointer' }}>
                <span className="kdc-result-kanji">{resultKanji}</span>
                <span className="kdc-result-label">{resultInfo.hv} — {resultInfo.meaning}</span>
              </div>
            </div>
          )}

          {!readOnly && !radicals.length && (
            <div className="kdc-empty-add-section">
              <div className="kdc-empty-msg">Không có dữ liệu bộ thủ</div>
              {onSaveRadicals && (
                addingRadical ? (
                  <div style={{ margin: '0.75rem auto' }}>
                    <RadicalAddWithVariants
                      value={addRadInput}
                      onChange={setAddRadInput}
                      onConfirm={addRadical}
                      onCancel={() => { setAddingRadical(false); setAddRadInput(''); }}
                    />
                  </div>
                ) : (
                  <button className="kdc-add-radical-btn" onClick={() => setAddingRadical(true)} title="Thêm bộ thủ" style={{ margin: '0.75rem auto' }}>+</button>
                )
              )}
            </div>
          )}

          {/* Radical kanji list — readOnly mode, when a radical is selected */}
          {readOnly && selectedRadical && allCards && (
            <div className="kdc-radical-kanji-section">
              <div className="kdc-radical-kanji-header">
                <span className="kdc-radical-kanji-title">
                  Kanji chứa <strong>{selectedRadical}</strong>
                  <span className="kdc-radical-kanji-count">({radicalKanjiList.length})</span>
                </span>
                <button className="kdc-radical-kanji-close" onClick={() => setSelectedRadical(null)}>×</button>
              </div>
              {radicalKanjiList.length > 0 ? (
                <div className="kdc-radical-kanji-grid">
                  {radicalKanjiList.map(c => (
                    <div key={c.id} className="kdc-radical-kanji-item" onClick={() => setStrokeChar(c.character)}>
                      <span className="kdc-radical-kanji-char">{c.character}</span>
                      <span className="kdc-radical-kanji-hv">{c.sinoVietnamese}</span>
                      <span className="kdc-radical-kanji-meaning">{c.meaning}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="kdc-radical-kanji-empty">Không có chữ Kanji nào khác chứa bộ thủ này</div>
              )}
            </div>
          )}

          {/* Mnemonic — readOnly: show only if has content; edit mode: always show */}
          {(readOnly ? mnemonic : (mnemonic || onSaveMnemonic)) && (
            <div className="kdc-mnemonic">
              <span className="kdc-mnemonic-icon">💡</span>
              {!readOnly && editingMnemonic ? (
                <div className="kdc-mnemonic-edit">
                  <textarea className="kdc-mnemonic-input" value={mnemonic} onChange={e => setMnemonic(e.target.value)} placeholder="Nhập gợi ý cách nhớ..." rows={2} autoFocus />
                  <div className="kdc-mnemonic-actions">
                    <button className="kdc-mnemonic-save" onClick={() => { onSaveMnemonic?.(mnemonic); setEditingMnemonic(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>Lưu</button>
                    <button className="kdc-mnemonic-cancel" onClick={() => { setMnemonic(kanjiCard.mnemonic || ''); setEditingMnemonic(false); }}>Huỷ</button>
                  </div>
                </div>
              ) : (
                <span
                  className={`kdc-mnemonic-text ${!readOnly && onSaveMnemonic ? 'kdc-mnemonic-clickable' : ''}`}
                  onClick={!readOnly && onSaveMnemonic ? () => setEditingMnemonic(true) : undefined}
                >
                  {mnemonic || 'Bấm để thêm gợi ý cách nhớ...'}
                </span>
              )}
            </div>
          )}

          {/* Swap suggestions — only in edit mode */}
          {!readOnly && swapIdx !== null && (
            <div className="kdc-swap-section">
              <div className="kdc-swap-header">
                <Shuffle size={14} />
                <span>Thay <strong>{radicals[swapIdx]}</strong> bằng:</span>
              </div>
              <div className="kdc-swap-grid">
                {swapList.map((s, i) => (
                  <div
                    key={`${s.kanji}-${i}`}
                    className={`kdc-swap-item ${dragOverIdx === i ? 'kdc-swap-drag-over' : ''}`}
                    draggable
                    onDragStart={e => { dragIdx.current = i; e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(i); }}
                    onDragLeave={() => { if (dragOverIdx === i) setDragOverIdx(null); }}
                    onDrop={e => { e.preventDefault(); handleSwapDragEnd(i); }}
                    onDragEnd={() => { dragIdx.current = null; setDragOverIdx(null); }}
                    onClick={() => setStrokeChar(s.kanji)}
                  >
                    <span className="kdc-swap-kanji">{s.kanji}</span>
                    <div className="kdc-swap-info">
                      <span className="kdc-swap-hv">{s.sinoVietnamese}</span>
                      <span className="kdc-swap-meaning">{s.meaning}</span>
                    </div>
                    {onSaveSampleWords && (
                      <button className="kdc-swap-remove" onClick={e => { e.stopPropagation(); removeFromList(s.kanji); }}>×</button>
                    )}
                  </div>
                ))}
                {onSaveSampleWords && (
                  <div className="kdc-swap-item kdc-swap-add-item" onClick={e => e.stopPropagation()}>
                    {addingKanji ? (
                      <div className="kdc-swap-add-form">
                        <input className="kdc-swap-add-input" value={newInput} onChange={e => setNewInput(e.target.value)} placeholder="字" maxLength={1} autoFocus onKeyDown={e => { if (e.key === 'Escape') { setAddingKanji(false); setNewInput(''); } }} />
                        <button className="kdc-swap-add-confirm" onClick={() => addToList(newInput)}>Thêm</button>
                      </div>
                    ) : (
                      <button className="kdc-swap-add-btn" onClick={() => setAddingKanji(true)}>+</button>
                    )}
                  </div>
                )}
                {!swapList.length && !addingKanji && <div className="kdc-swap-empty">Không tìm thấy Kanji liên quan</div>}
              </div>
            </div>
          )}

          <div className="kdc-hint">
            {readOnly
              ? (radicals.length > 0 ? (allCards ? 'Bấm bộ thủ để xem Kanji liên quan · Bấm chữ Kanji để xem cách viết' : 'Bấm chữ Kanji để xem cách viết') : '')
              : 'Bấm bộ thủ để xem gợi ý · Bấm chữ Kanji để xem cách viết'
            }
          </div>
        </div>
        {/* Stroke preview */}
        {strokeChar && strokeInfo && (
          <StrokePreview char={strokeChar} info={strokeInfo} onClose={() => setStrokeChar(null)} />
        )}
    </ModalShell>
  );
}

/** Inline radical edit with variant picker */
function RadicalEditWithVariants({ value, onChange, onConfirm, onCancel }: {
  value: string; onChange: (v: string) => void; onConfirm: (char: string) => void; onCancel: () => void;
}) {
  const variants = useMemo(() => value ? getRadicalVariants(value) : [], [value]);
  return (
    <div className="kdc-rad-edit-form" onClick={e => e.stopPropagation()}>
      <input
        className="kdc-rad-edit-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={1}
        autoFocus
        onKeyDown={e => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter') onConfirm(value); }}
      />
      {variants.length > 1 && (
        <div className="kdc-variant-picker">
          {variants.map(v => (
            <button key={v.character} className={`kdc-variant-btn ${v.character === value ? 'kdc-variant-active' : ''}`} onClick={() => onConfirm(v.character)} title={v.name}>
              <span className="kdc-variant-char">{v.character}</span>
              <span className="kdc-variant-name">{v.name}</span>
            </button>
          ))}
        </div>
      )}
      {variants.length <= 1 && <button className="kdc-rad-edit-ok" onClick={() => onConfirm(value)}>OK</button>}
    </div>
  );
}

/** Add radical card with variant picker */
function RadicalAddWithVariants({ value, onChange, onConfirm, onCancel }: {
  value: string; onChange: (v: string) => void; onConfirm: (char: string) => void; onCancel: () => void;
}) {
  const variants = useMemo(() => value ? getRadicalVariants(value) : [], [value]);
  return (
    <div className="kdc-add-radical-card">
      <input
        className="kdc-add-radical-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={1}
        autoFocus
        placeholder="字"
        onKeyDown={e => {
          if (e.key === 'Enter') onConfirm(value);
          if (e.key === 'Escape') onCancel();
        }}
      />
      {variants.length > 1 ? (
        <div className="kdc-variant-picker">
          {variants.map(v => (
            <button key={v.character} className={`kdc-variant-btn ${v.character === value ? 'kdc-variant-active' : ''}`} onClick={() => onConfirm(v.character)} title={v.name}>
              <span className="kdc-variant-char">{v.character}</span>
              <span className="kdc-variant-name">{v.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <button className="kdc-add-radical-ok" onClick={() => onConfirm(value)}>Thêm</button>
      )}
    </div>
  );
}

/** Stroke preview overlay */
function StrokePreview({ char, info, onClose }: {
  char: string;
  info: { hv: string; meaning: string; mnemonic: string; radicals: string[] };
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const writer = useRef<HanziWriter | null>(null);
  const SIZE = 360;

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    try {
      writer.current = HanziWriter.create(ref.current, char, {
        width: SIZE, height: SIZE, padding: 12,
        strokeColor: '#e2e8f0', radicalColor: '#e2e8f0',
        showOutline: true, outlineColor: 'rgba(255,255,255,0.08)',
        charDataLoader: (c, done) => cachedCharDataLoader(c, done as (data: unknown) => void, () => {
          if (ref.current) ref.current.innerHTML = `<div style="font-size:10rem;color:#e2e8f0;font-family:'Noto Serif JP',serif;text-align:center;line-height:${SIZE}px">${c}</div>`;
        }),
      });
    } catch {
      if (ref.current) ref.current.innerHTML = `<div style="font-size:10rem;color:#e2e8f0;font-family:'Noto Serif JP',serif;text-align:center;line-height:${SIZE}px">${char}</div>`;
    }
    return () => { writer.current = null; };
  }, [char]);

  const play = () => { writer.current?.hideCharacter(); writer.current?.animateCharacter({ strokeAnimationSpeed: 20, delayBetweenStrokes: 30 }); };

  return (
    <ModalShell isOpen onClose={onClose} maxWidth={420} className="kdc-stroke-modal-shell">
        <div ref={ref} className="kdc-stroke-canvas" />
        <div className="kdc-stroke-info">
          <span className="kdc-stroke-hv">{info.hv}</span>
          <span className="kdc-stroke-meaning">{info.meaning}</span>
        </div>
        <button className="kdc-stroke-replay" onClick={play}>▶ Xem cách viết</button>
        {info.radicals.length > 0 && (
          <div className="kdc-stroke-radicals">
            {info.radicals.map((r, i) => {
              const ci = getComponentInfo(r);
              return (
                <span key={`${r}-${i}`} className="kdc-stroke-radical-chip">
                  <span className="kdc-stroke-radical-char">{r}</span>
                  <span className="kdc-stroke-radical-name">{ci.name}</span>
                </span>
              );
            })}
          </div>
        )}
        {info.mnemonic && <div className="kdc-stroke-mnemonic">💡 {info.mnemonic}</div>}
    </ModalShell>
  );
}
