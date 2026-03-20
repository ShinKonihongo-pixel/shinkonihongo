// Visual kanji radical decomposition modal
// Shows kanji broken into colored radicals with drag-to-separate and radical swapping
// Click a kanji in the card list → opens this modal

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus, Shuffle, RotateCcw, Sparkles } from 'lucide-react';
import type { KanjiCard } from '../../types/kanji';
import { getRadicalInfo, getKanjiByRadical, getSeedRadicals } from '../../utils/radical-kanji-index';
import { getDecomposition } from '../../data/kanji-decomposition';
import { RadicalPickerPopup } from './radical-picker-popup';
import './kanji-decomposer-modal.css';

// Color palette for radicals — distinct, vibrant
const RADICAL_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#4f46e5' },   // indigo
  { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#db2777' },   // pink
  { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#059669' },   // emerald
  { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#d97706' },   // amber
  { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#2563eb' },   // blue
  { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#9333ea' },   // purple
  { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#dc2626' },    // red
  { bg: 'rgba(20, 184, 166, 0.15)', border: '#14b8a6', text: '#0d9488' },   // teal
];

interface DragState {
  radicalIdx: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface KanjiDecomposerModalProps {
  kanjiCard: KanjiCard;
  onClose: () => void;
}

/** Find kanji that share some radicals with the current set (for swapping suggestions) */
function findRelatedKanji(
  currentRadicals: string[],
  swapIdx: number,
): Array<{ radical: string; kanji: string; sinoVietnamese: string; meaning: string }> {
  const otherRadicals = currentRadicals.filter((_, i) => i !== swapIdx);
  if (otherRadicals.length === 0) return [];

  // Find kanji containing ALL other radicals (intersect)
  const sets = otherRadicals.map(r => new Set(getKanjiByRadical(r).map(e => e.character)));
  let intersection = sets[0];
  for (let i = 1; i < sets.length; i++) {
    intersection = new Set([...intersection].filter(c => sets[i].has(c)));
  }

  // For each matching kanji, find what radical replaces the swapped one
  const swappedRadical = currentRadicals[swapIdx];
  const results: Array<{ radical: string; kanji: string; sinoVietnamese: string; meaning: string }> = [];
  const seenKanji = new Set<string>();

  for (const kanjiChar of intersection) {
    if (seenKanji.has(kanjiChar)) continue;
    const decomp = getDecomposition(kanjiChar) || getSeedRadicals(kanjiChar);
    if (!decomp) continue;

    const differentRadicals = decomp.filter(r => !otherRadicals.includes(r) && r !== swappedRadical);
    if (differentRadicals.length === 0) continue;

    const r = differentRadicals[0];
    const entry = getKanjiByRadical(r).find(e => e.character === kanjiChar);
    if (entry) {
      seenKanji.add(kanjiChar);
      results.push({ radical: r, kanji: kanjiChar, sinoVietnamese: entry.sinoVietnamese, meaning: entry.meaning });
    }
  }

  return results.slice(0, 12);
}

export function KanjiDecomposerModal({ kanjiCard, onClose }: KanjiDecomposerModalProps) {
  // Get radicals from decomposition map or card data
  const decomposition = getDecomposition(kanjiCard.character)
    || getSeedRadicals(kanjiCard.character)
    || kanjiCard.radicals
    || [];

  const [radicals, setRadicals] = useState<string[]>(decomposition);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [separated, setSeparated] = useState(false);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [resultKanji, setResultKanji] = useState<string>(kanjiCard.character);
  const containerRef = useRef<HTMLDivElement>(null);

  // When radicals change, try to find matching kanji
  useEffect(() => {
    if (radicals.length === 0) {
      setResultKanji('?');
      return;
    }

    // Check if there's a kanji that decomposes to exactly these radicals
    // Simple approach: intersect kanji sets for each radical
    const sets = radicals.map(r => {
      const entries = getKanjiByRadical(r);
      return new Map(entries.map(e => [e.character, e]));
    });

    if (sets.length === 0) { setResultKanji('?'); return; }

    // Find kanji in all sets
    const candidates = [...sets[0].keys()].filter(char =>
      sets.every(s => s.has(char))
    );

    // Prefer kanji whose decomposition exactly matches
    const exact = candidates.find(char => {
      const d = getDecomposition(char) || getSeedRadicals(char);
      if (!d) return false;
      return d.length === radicals.length && radicals.every(r => d.includes(r));
    });

    if (exact) {
      setResultKanji(exact);
    } else if (candidates.length > 0) {
      // Pick the one with the closest decomposition length
      setResultKanji(candidates[0]);
    } else {
      setResultKanji('?');
    }
  }, [radicals]);

  // Pointer event handlers for drag
  const handlePointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      radicalIdx: idx,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0,
      offsetY: 0,
    });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;
    setDragState(prev => prev ? {
      ...prev,
      offsetX: e.clientX - prev.startX,
      offsetY: e.clientY - prev.startY,
    } : null);
  }, [dragState]);

  const handlePointerUp = useCallback(() => {
    if (!dragState) return;
    // If dragged far enough, toggle separated state
    const dist = Math.sqrt(dragState.offsetX ** 2 + dragState.offsetY ** 2);
    if (dist > 40) {
      setSeparated(true);
    }
    setDragState(null);
  }, [dragState]);

  // Reset to original
  const handleReset = () => {
    setRadicals(decomposition);
    setSeparated(false);
    setSwapIdx(null);
    setResultKanji(kanjiCard.character);
  };

  // Remove a radical
  const handleRemoveRadical = (idx: number) => {
    setRadicals(prev => prev.filter((_, i) => i !== idx));
    if (swapIdx === idx) setSwapIdx(null);
    else if (swapIdx !== null && swapIdx > idx) setSwapIdx(swapIdx - 1);
  };

  // Add a radical from picker
  const handleAddRadical = (char: string) => {
    if (!radicals.includes(char)) {
      setRadicals(prev => [...prev, char]);
    }
    setShowPicker(false);
  };

  // Swap a radical at the given index
  const handleSwapRadical = (idx: number, newRadical: string) => {
    setRadicals(prev => prev.map((r, i) => i === idx ? newRadical : r));
    setSwapIdx(null);
    setSeparated(true);
  };

  // Get related kanji for swapping
  const swapSuggestions = swapIdx !== null ? findRelatedKanji(radicals, swapIdx) : [];

  return (
    <div className="kdc-overlay" onClick={onClose}>
      <div
        className="kdc-modal"
        onClick={e => e.stopPropagation()}
        ref={containerRef}
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

        {/* Main kanji display */}
        <div className="kdc-body">
          {/* Result kanji (the combined character) */}
          <div className="kdc-result-section">
            <div className={`kdc-result-char ${resultKanji === '?' ? 'kdc-result-unknown' : ''}`}>
              {resultKanji}
            </div>
            <div className="kdc-result-info">
              {resultKanji !== '?' && resultKanji === kanjiCard.character && (
                <span className="kdc-result-label">{kanjiCard.sinoVietnamese} — {kanjiCard.meaning}</span>
              )}
              {resultKanji !== '?' && resultKanji !== kanjiCard.character && (
                <span className="kdc-result-label kdc-result-new">
                  {(() => {
                    const entry = getKanjiByRadical(radicals[0] || '')?.find(e => e.character === resultKanji);
                    return entry ? `${entry.sinoVietnamese} — ${entry.meaning}` : resultKanji;
                  })()}
                </span>
              )}
              {resultKanji === '?' && (
                <span className="kdc-result-label kdc-result-unknown-label">Không tìm thấy Kanji phù hợp</span>
              )}
            </div>
          </div>

          {/* Radical equation: r1 + r2 + ... = kanji */}
          <div className={`kdc-equation ${separated ? 'kdc-separated' : ''}`}>
            {radicals.length === 0 && (
              <div className="kdc-empty-msg">Chưa có bộ thủ — bấm + để thêm</div>
            )}
            {radicals.map((r, idx) => {
              const info = getRadicalInfo(r);
              const color = RADICAL_COLORS[idx % RADICAL_COLORS.length];
              const isDragging = dragState?.radicalIdx === idx;
              const dragTransform = isDragging
                ? `translate(${dragState.offsetX}px, ${dragState.offsetY}px) scale(1.1)`
                : '';

              return (
                <div key={`${r}-${idx}`} className="kdc-eq-item">
                  {idx > 0 && <span className="kdc-eq-plus">+</span>}
                  <div
                    className={`kdc-radical-card ${isDragging ? 'kdc-dragging' : ''} ${swapIdx === idx ? 'kdc-swapping' : ''}`}
                    style={{
                      background: color.bg,
                      borderColor: color.border,
                      transform: dragTransform,
                      zIndex: isDragging ? 10 : 1,
                    }}
                  >
                    {/* Draggable area — main content */}
                    <div
                      className="kdc-radical-drag-area"
                      onPointerDown={e => handlePointerDown(e, idx)}
                      title="Kéo để tách"
                    >
                      <span className="kdc-radical-char" style={{ color: color.text }}>{r}</span>
                      <span className="kdc-radical-name">{info?.vietnameseName || '?'}</span>
                      <span className="kdc-radical-meaning">{info?.meaning || ''}</span>
                    </div>
                    {/* Action buttons — outside drag area */}
                    <div className="kdc-radical-actions">
                      <button
                        className="kdc-radical-action-btn"
                        onClick={(e) => { e.stopPropagation(); setSwapIdx(swapIdx === idx ? null : idx); }}
                        title="Thay bộ thủ"
                        style={{ color: color.text }}
                      >
                        <Shuffle size={12} />
                      </button>
                      <button
                        className="kdc-radical-action-btn kdc-radical-remove-btn"
                        onClick={(e) => { e.stopPropagation(); handleRemoveRadical(idx); }}
                        title="Xoá bộ thủ"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <span className="kdc-eq-equals">=</span>
            <div className="kdc-eq-result">
              <span className={`kdc-eq-result-char ${resultKanji === '?' ? 'kdc-unknown' : ''}`}>
                {resultKanji}
              </span>
            </div>
            {/* Add radical button */}
            <div className="kdc-add-wrapper">
              <button
                className="kdc-add-btn"
                onClick={() => setShowPicker(!showPicker)}
                title="Thêm bộ thủ"
              >
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
                  {swapSuggestions.map((s, i) => {
                    const info = getRadicalInfo(s.radical);
                    return (
                      <button
                        key={i}
                        className="kdc-swap-item"
                        onClick={() => handleSwapRadical(swapIdx, s.radical)}
                        title={`${info?.vietnameseName || s.radical} → ${s.kanji} (${s.sinoVietnamese})`}
                      >
                        <div className="kdc-swap-radical">{s.radical}</div>
                        <div className="kdc-swap-arrow">→</div>
                        <div className="kdc-swap-kanji">{s.kanji}</div>
                        <div className="kdc-swap-info">
                          <span className="kdc-swap-hv">{s.sinoVietnamese}</span>
                          <span className="kdc-swap-meaning">{s.meaning}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="kdc-swap-empty">Không tìm thấy Kanji liên quan</div>
              )}
            </div>
          )}

          {/* Hint text */}
          <div className="kdc-hint">
            Kéo bộ thủ để tách · Bấm <Shuffle size={11} /> để thay thế · Bấm <Plus size={11} /> để thêm
          </div>
        </div>
      </div>
    </div>
  );
}
