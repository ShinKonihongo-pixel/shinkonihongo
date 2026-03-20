// Visual kanji radical decomposition modal
// Shows kanji broken into colored radicals with drag-to-separate and radical swapping
// Click a kanji in the card list → opens this modal

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { X, Plus, Shuffle, RotateCcw, Sparkles } from 'lucide-react';
import type { KanjiCard } from '../../types/kanji';
import { getRadicalInfo, getKanjiByRadical, getSeedRadicals } from '../../utils/radical-kanji-index';
import { getDecomposition } from '../../data/kanji-decomposition';
import { RadicalPickerPopup } from './radical-picker-popup';
import './kanji-decomposer-modal.css';

// Color palette for radicals — distinct, vibrant
const RADICAL_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#4f46e5' },
  { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#db2777' },
  { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#059669' },
  { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#d97706' },
  { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#2563eb' },
  { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#9333ea' },
  { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#dc2626' },
  { bg: 'rgba(20, 184, 166, 0.15)', border: '#14b8a6', text: '#0d9488' },
];

interface DragState {
  radicalIdx: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface SwapSuggestion {
  radical: string;
  kanji: string;
  sinoVietnamese: string;
  meaning: string;
}

interface KanjiDecomposerModalProps {
  kanjiCard: KanjiCard;
  onClose: () => void;
}

/** Find kanji sharing other radicals but with a different one at swapIdx */
function findRelatedKanji(currentRadicals: string[], swapIdx: number): SwapSuggestion[] {
  const otherRadicals = currentRadicals.filter((_, i) => i !== swapIdx);
  if (otherRadicals.length === 0) return [];

  // Intersect kanji sets for all other radicals
  const sets = otherRadicals.map(r => new Set(getKanjiByRadical(r).map(e => e.character)));
  let intersection = sets[0];
  for (let i = 1; i < sets.length; i++) {
    const current = intersection;
    const next = sets[i];
    intersection = new Set<string>();
    for (const c of current) {
      if (next.has(c)) intersection.add(c);
    }
  }

  const swappedRadical = currentRadicals[swapIdx];
  const results: SwapSuggestion[] = [];

  for (const kanjiChar of intersection) {
    if (results.length >= 12) break;
    const decomp = getDecomposition(kanjiChar) || getSeedRadicals(kanjiChar);
    if (!decomp) continue;

    const differentRadicals = decomp.filter(r => !otherRadicals.includes(r) && r !== swappedRadical);
    if (differentRadicals.length === 0) continue;

    const r = differentRadicals[0];
    const entry = getKanjiByRadical(r).find(e => e.character === kanjiChar);
    if (entry) {
      results.push({ radical: r, kanji: kanjiChar, sinoVietnamese: entry.sinoVietnamese, meaning: entry.meaning });
    }
  }

  return results;
}

/** Find kanji matching a given set of radicals using reverse index */
function findKanjiForRadicals(radicals: string[]): string {
  if (radicals.length === 0) return '?';

  const sets = radicals.map(r => new Set(getKanjiByRadical(r).map(e => e.character)));
  if (sets.length === 0) return '?';

  // Intersect all sets
  let candidates = sets[0];
  for (let i = 1; i < sets.length; i++) {
    const next = sets[i];
    const filtered = new Set<string>();
    for (const c of candidates) {
      if (next.has(c)) filtered.add(c);
    }
    candidates = filtered;
  }

  if (candidates.size === 0) return '?';

  // Prefer exact decomposition match
  for (const char of candidates) {
    const d = getDecomposition(char) || getSeedRadicals(char);
    if (d && d.length === radicals.length && radicals.every(r => d.includes(r))) {
      return char;
    }
  }

  return candidates.values().next().value || '?';
}

export function KanjiDecomposerModal({ kanjiCard, onClose }: KanjiDecomposerModalProps) {
  // Stable decomposition — computed once per kanji character
  const decomposition = useMemo(() =>
    getDecomposition(kanjiCard.character)
    || getSeedRadicals(kanjiCard.character)
    || kanjiCard.radicals
    || [],
    [kanjiCard.character, kanjiCard.radicals]
  );

  const [radicals, setRadicals] = useState<string[]>(decomposition);
  const [separated, setSeparated] = useState(false);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Use ref for drag state to avoid re-creating pointer callbacks every frame
  const dragRef = useRef<DragState | null>(null);
  const [dragOffset, setDragOffset] = useState<{ idx: number; x: number; y: number } | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPicker) setShowPicker(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, showPicker]);

  // Memoize result kanji
  const resultKanji = useMemo(() => findKanjiForRadicals(radicals), [radicals]);

  // Memoize result kanji info for display
  const resultInfo = useMemo(() => {
    if (resultKanji === '?') return null;
    if (resultKanji === kanjiCard.character) {
      return { sinoVietnamese: kanjiCard.sinoVietnamese, meaning: kanjiCard.meaning, isNew: false };
    }
    // Look up from index
    for (const r of radicals) {
      const entry = getKanjiByRadical(r).find(e => e.character === resultKanji);
      if (entry) return { sinoVietnamese: entry.sinoVietnamese, meaning: entry.meaning, isNew: true };
    }
    return null;
  }, [resultKanji, radicals, kanjiCard.character, kanjiCard.sinoVietnamese, kanjiCard.meaning]);

  // Memoize swap suggestions
  const swapSuggestions = useMemo(
    () => swapIdx !== null ? findRelatedKanji(radicals, swapIdx) : [],
    [radicals, swapIdx]
  );

  // Pointer handlers — stable callbacks using ref
  const handlePointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { radicalIdx: idx, startX: e.clientX, startY: e.clientY, offsetX: 0, offsetY: 0 };
    setDragOffset({ idx, x: 0, y: 0 });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const x = e.clientX - drag.startX;
    const y = e.clientY - drag.startY;
    drag.offsetX = x;
    drag.offsetY = y;
    setDragOffset({ idx: drag.radicalIdx, x, y });
  }, []);

  const handlePointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    const dist = Math.sqrt(drag.offsetX ** 2 + drag.offsetY ** 2);
    if (dist > 40) setSeparated(true);
    dragRef.current = null;
    setDragOffset(null);
  }, []);

  const handleReset = () => {
    setRadicals(decomposition);
    setSeparated(false);
    setSwapIdx(null);
  };

  const handleRemoveRadical = (idx: number) => {
    setRadicals(prev => prev.filter((_, i) => i !== idx));
    if (swapIdx === idx) setSwapIdx(null);
    else if (swapIdx !== null && swapIdx > idx) setSwapIdx(swapIdx - 1);
  };

  const handleAddRadical = (char: string) => {
    if (!radicals.includes(char)) setRadicals(prev => [...prev, char]);
    setShowPicker(false);
  };

  const handleSwapRadical = (idx: number, newRadical: string) => {
    setRadicals(prev => prev.map((r, i) => i === idx ? newRadical : r));
    setSwapIdx(null);
    setSeparated(true);
  };

  return (
    <div className="kdc-overlay" onClick={onClose}>
      <div
        className="kdc-modal"
        onClick={e => e.stopPropagation()}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Header */}
        <div className="kdc-header">
          <div className="kdc-header-left">
            <Sparkles size={18} className="kdc-header-icon" />
            <h3>Phân tích bộ thủ</h3>
          </div>
          <div className="kdc-header-actions">
            <button className="kdc-icon-btn" onClick={handleReset} title="Đặt lại">
              <RotateCcw size={16} />
            </button>
            <button className="kdc-icon-btn" onClick={onClose} title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="kdc-body">
          {/* Result kanji display */}
          <div className="kdc-result-section">
            <div className={`kdc-result-char ${resultKanji === '?' ? 'kdc-result-unknown' : ''}`}>
              {resultKanji}
            </div>
            <div className="kdc-result-info">
              {resultInfo && !resultInfo.isNew && (
                <span className="kdc-result-label">{resultInfo.sinoVietnamese} — {resultInfo.meaning}</span>
              )}
              {resultInfo?.isNew && (
                <span className="kdc-result-label kdc-result-new">{resultInfo.sinoVietnamese} — {resultInfo.meaning}</span>
              )}
              {resultKanji === '?' && (
                <span className="kdc-result-label kdc-result-unknown-label">Không tìm thấy Kanji phù hợp</span>
              )}
            </div>
          </div>

          {/* Radical equation */}
          <div className={`kdc-equation ${separated ? 'kdc-separated' : ''}`}>
            {radicals.length === 0 && (
              <div className="kdc-empty-msg">Chưa có bộ thủ — bấm + để thêm</div>
            )}
            {radicals.map((r, idx) => {
              const info = getRadicalInfo(r);
              const color = RADICAL_COLORS[idx % RADICAL_COLORS.length];
              const isDragging = dragOffset?.idx === idx;
              const transform = isDragging
                ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.1)`
                : undefined;

              return (
                <div key={`${r}-${idx}`} className="kdc-eq-item">
                  {idx > 0 && <span className="kdc-eq-plus">+</span>}
                  <div
                    className={`kdc-radical-card ${isDragging ? 'kdc-dragging' : ''} ${swapIdx === idx ? 'kdc-swapping' : ''}`}
                    style={{ background: color.bg, borderColor: color.border, transform, zIndex: isDragging ? 10 : 1 }}
                  >
                    <div
                      className="kdc-radical-drag-area"
                      onPointerDown={e => handlePointerDown(e, idx)}
                      title="Kéo để tách"
                    >
                      <span className="kdc-radical-char" style={{ color: color.text }}>{r}</span>
                      <span className="kdc-radical-name">{info?.vietnameseName || '?'}</span>
                      <span className="kdc-radical-meaning">{info?.meaning || ''}</span>
                    </div>
                    <div className="kdc-radical-actions">
                      <button
                        className="kdc-radical-action-btn"
                        onClick={() => setSwapIdx(swapIdx === idx ? null : idx)}
                        title="Thay bộ thủ"
                        style={{ color: color.text }}
                      >
                        <Shuffle size={12} />
                      </button>
                      <button
                        className="kdc-radical-action-btn kdc-radical-remove-btn"
                        onClick={() => handleRemoveRadical(idx)}
                        title="Xoá bộ thủ"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {radicals.length > 0 && (
              <>
                <span className="kdc-eq-equals">=</span>
                <div className="kdc-eq-result">
                  <span className={`kdc-eq-result-char ${resultKanji === '?' ? 'kdc-unknown' : ''}`}>
                    {resultKanji}
                  </span>
                </div>
              </>
            )}
            <div className="kdc-add-wrapper">
              <button className="kdc-add-btn" onClick={() => setShowPicker(!showPicker)} title="Thêm bộ thủ">
                <Plus size={16} />
              </button>
              {showPicker && (
                <RadicalPickerPopup
                  selectedRadicals={radicals}
                  onSelect={handleAddRadical}
                  onClose={() => setShowPicker(false)}
                />
              )}
            </div>
          </div>

          {/* Swap suggestions */}
          {swapIdx !== null && (
            <div className="kdc-swap-section">
              <div className="kdc-swap-header">
                <Shuffle size={14} />
                <span>Thay <strong>{radicals[swapIdx]}</strong> bằng bộ thủ khác:</span>
              </div>
              {swapSuggestions.length > 0 ? (
                <div className="kdc-swap-grid">
                  {swapSuggestions.map((s, i) => (
                    <button
                      key={`${s.kanji}-${i}`}
                      className="kdc-swap-item"
                      onClick={() => handleSwapRadical(swapIdx, s.radical)}
                      title={`${getRadicalInfo(s.radical)?.vietnameseName || s.radical} → ${s.kanji} (${s.sinoVietnamese})`}
                    >
                      <div className="kdc-swap-radical">{s.radical}</div>
                      <div className="kdc-swap-arrow">→</div>
                      <div className="kdc-swap-kanji">{s.kanji}</div>
                      <div className="kdc-swap-info">
                        <span className="kdc-swap-hv">{s.sinoVietnamese}</span>
                        <span className="kdc-swap-meaning">{s.meaning}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="kdc-swap-empty">Không tìm thấy Kanji liên quan</div>
              )}
            </div>
          )}

          <div className="kdc-hint">
            Kéo bộ thủ để tách · Bấm <Shuffle size={11} /> để thay thế · Bấm <Plus size={11} /> để thêm
          </div>
        </div>
      </div>
    </div>
  );
}
