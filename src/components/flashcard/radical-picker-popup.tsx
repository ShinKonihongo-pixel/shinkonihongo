// Searchable radical picker popup for adding radicals to kanji analysis
// Shows 214 Kangxi radicals + variants, grouped by stroke count

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { KANGXI_RADICALS, RADICAL_VARIANT_ENTRIES } from '../../data/radicals';

import './radical-picker-popup.css';

// Combine base radicals + variants into a single searchable list
interface PickerItem {
  character: string;
  vietnameseName: string;
  meaning: string;
  strokeCount: number;
  isVariant?: boolean;
  parentChar?: string; // Base radical character for variants
}

const ALL_ITEMS: PickerItem[] = [
  ...KANGXI_RADICALS.map(r => ({
    character: r.character,
    vietnameseName: r.vietnameseName,
    meaning: r.meaning,
    strokeCount: r.strokeCount,
  })),
  ...RADICAL_VARIANT_ENTRIES.map(v => {
    const parent = KANGXI_RADICALS.find(r => r.number === v.parentNumber);
    return {
      character: v.character,
      vietnameseName: v.vietnameseName,
      meaning: v.meaning,
      strokeCount: parent?.strokeCount ?? 0,
      isVariant: true,
      parentChar: parent?.character,
    };
  }),
];

// Group by stroke count
const STROKE_GROUPS = new Map<number, PickerItem[]>();
for (const item of ALL_ITEMS) {
  const list = STROKE_GROUPS.get(item.strokeCount) || [];
  list.push(item);
  STROKE_GROUPS.set(item.strokeCount, list);
}
const SORTED_STROKES = [...STROKE_GROUPS.keys()].sort((a, b) => a - b);

interface RadicalPickerPopupProps {
  onSelect: (character: string) => void;
  onClose: () => void;
  /** Characters already selected — shown as disabled */
  selectedRadicals?: string[];
}

export function RadicalPickerPopup({ onSelect, onClose, selectedRadicals = [] }: RadicalPickerPopupProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const selectedSet = useMemo(() => new Set(selectedRadicals), [selectedRadicals]);
  const q = query.trim().toLowerCase();

  // Filter items by search query — null means show grouped view
  const filteredItems = useMemo(() =>
    q
      ? ALL_ITEMS.filter(item =>
          item.character.includes(q) ||
          item.vietnameseName.toLowerCase().includes(q) ||
          item.meaning.toLowerCase().includes(q)
        )
      : null,
    [q]
  );

  return (
    <div className="rpk-popup" ref={popupRef}>
      {/* Header */}
      <div className="rpk-header">
        <div className="rpk-search-box">
          <Search size={14} className="rpk-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm bộ thủ..."
            className="rpk-search-input"
          />
          {query && (
            <button type="button" className="rpk-clear-btn" onClick={() => setQuery('')}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="rpk-body">
        {filteredItems ? (
          // Search results — flat list
          filteredItems.length === 0 ? (
            <div className="rpk-empty">Không tìm thấy</div>
          ) : (
            <div className="rpk-grid">
              {filteredItems.map(item => {
                const isSelected = selectedSet.has(item.character);
                return (
                  <button
                    key={item.character}
                    type="button"
                    className={`rpk-item ${isSelected ? 'rpk-item-selected' : ''} ${item.isVariant ? 'rpk-item-variant' : ''}`}
                    onClick={() => { if (!isSelected) onSelect(item.character); }}
                    disabled={isSelected}
                    title={`${item.vietnameseName} — ${item.meaning}${item.isVariant ? ` (biến thể của ${item.parentChar})` : ''}`}
                  >
                    <span className="rpk-item-char">{item.character}</span>
                    <span className="rpk-item-name">{item.vietnameseName}</span>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          // Grouped by stroke count
          SORTED_STROKES.map(stroke => {
            const items = STROKE_GROUPS.get(stroke)!;
            return (
              <div key={stroke} className="rpk-group">
                <div className="rpk-group-label">{stroke} nét</div>
                <div className="rpk-grid">
                  {items.map(item => {
                    const isSelected = selectedSet.has(item.character);
                    return (
                      <button
                        key={item.character}
                        type="button"
                        className={`rpk-item ${isSelected ? 'rpk-item-selected' : ''} ${item.isVariant ? 'rpk-item-variant' : ''}`}
                        onClick={() => { if (!isSelected) onSelect(item.character); }}
                        disabled={isSelected}
                        title={`${item.vietnameseName} — ${item.meaning}${item.isVariant ? ` (biến thể của ${item.parentChar})` : ''}`}
                      >
                        <span className="rpk-item-char">{item.character}</span>
                        <span className="rpk-item-name">{item.vietnameseName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
