// Full modal showing all kanji sharing a given radical
// Supports: add/remove kanji, save to Firestore, refresh index

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw, X, Save, Search, BookOpen } from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import type { Radical } from '../../types/kanji';
import {
  getKanjiByRadical,
  addCustomRadicalKanji,
  removeRadicalKanji,
  rebuildRadicalIndex,
  getCustomEntries,
  getRemovedEntries,
  setCustomEntries,
  setRemovedEntries,
  isCustomLoaded,
  type RadicalKanjiEntry,
} from '../../utils/radical-kanji-index';
import {
  loadAllRadicalKanjiCustom,
  saveRadicalKanjiCustom,
} from '../../services/firestore';
import './radical-explorer-panel.css';

const JLPT_ORDER: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1', 'BT'];

const LEVEL_COLORS: Record<JLPTLevel, { bg: string; border: string; text: string }> = {
  N5: { bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.3)', text: '#34d399' },
  N4: { bg: 'rgba(96, 165, 250, 0.12)', border: 'rgba(96, 165, 250, 0.3)', text: '#60a5fa' },
  N3: { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24' },
  N2: { bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)', text: '#f97316' },
  N1: { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)', text: '#f43f5e' },
  BT: { bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.3)', text: '#a78bfa' },
};

interface RadicalExplorerPanelProps {
  radical: Radical;
  onBack: () => void;
  asModal?: boolean;
  readOnly?: boolean; // true = hide add/delete/save (study screen)
}

export function RadicalExplorerPanel({ radical, onBack, asModal = false, readOnly = false }: RadicalExplorerPanelProps) {
  const [entries, setEntries] = useState<RadicalKanjiEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addKanji, setAddKanji] = useState('');
  const [addHV, setAddHV] = useState('');
  const [addMeaning, setAddMeaning] = useState('');
  const [addLevel, setAddLevel] = useState<JLPTLevel>('N3');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load custom entries from Firestore on first open if not loaded yet
  useEffect(() => {
    if (!isCustomLoaded()) {
      loadAllRadicalKanjiCustom().then(customMap => {
        const added = new Map<string, RadicalKanjiEntry[]>();
        const removed = new Map<string, Set<string>>();
        for (const [rad, ents] of customMap) {
          if (rad.startsWith('_removed_')) {
            const actualRadical = rad.slice(9);
            removed.set(actualRadical, new Set(ents.map(e => e.character)));
          } else {
            added.set(rad, ents);
          }
        }
        setCustomEntries(added);
        setRemovedEntries(removed);
        rebuildRadicalIndex();
        setEntries(getKanjiByRadical(radical.character));
      });
    } else {
      setEntries(getKanjiByRadical(radical.character));
    }
  }, [radical.character]);

  const refresh = () => {
    rebuildRadicalIndex();
    setEntries(getKanjiByRadical(radical.character));
  };

  const handleAdd = () => {
    const char = addKanji.trim();
    if (!char) return;
    addCustomRadicalKanji(radical.character, {
      character: char,
      sinoVietnamese: addHV.trim().toUpperCase(),
      meaning: addMeaning.trim(),
      jlptLevel: addLevel,
      isCustom: true,
    });
    setEntries(getKanjiByRadical(radical.character));
    setAddKanji('');
    setAddHV('');
    setAddMeaning('');
    setShowAddForm(false);
    setDirty(true);
  };

  const handleRemove = (character: string) => {
    removeRadicalKanji(radical.character, character);
    setEntries(getKanjiByRadical(radical.character));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const customEnts = getCustomEntries().get(radical.character) || [];
      await saveRadicalKanjiCustom(radical.character, customEnts);

      const removedSet = getRemovedEntries().get(radical.character);
      if (removedSet && removedSet.size > 0) {
        const removedEntries: RadicalKanjiEntry[] = Array.from(removedSet).map(c => ({
          character: c, sinoVietnamese: '', meaning: '', jlptLevel: 'N5' as JLPTLevel,
        }));
        await saveRadicalKanjiCustom(`_removed_${radical.character}`, removedEntries);
      } else {
        await saveRadicalKanjiCustom(`_removed_${radical.character}`, []);
      }

      setDirty(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (err) {
      console.error('Save radical-kanji custom error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Filter by search query
  const filtered = searchQuery.trim()
    ? entries.filter(e =>
        e.character.includes(searchQuery) ||
        e.sinoVietnamese.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.meaning.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  // Group by JLPT level
  const grouped = new Map<JLPTLevel, RadicalKanjiEntry[]>();
  for (const entry of filtered) {
    const list = grouped.get(entry.jlptLevel);
    if (list) list.push(entry);
    else grouped.set(entry.jlptLevel, [entry]);
  }

  const content = (
    <div className="rep-panel">
      {/* Header bar */}
      <div className="rep-topbar">
        <button className="rep-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </button>
        {!readOnly && (
          <div className="rep-topbar-actions">
            {dirty && (
              <button className="rep-btn rep-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={13} className="rep-spin" /> : <Save size={13} />}
                <span>{savedMsg ? 'Đã lưu!' : 'Lưu'}</span>
              </button>
            )}
            {savedMsg && !dirty && (
              <span className="rep-saved-toast">Đã lưu!</span>
            )}
            <button className="rep-btn rep-btn-add" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={14} />
              <span>Thêm</span>
            </button>
          </div>
        )}
      </div>

      {/* Radical hero card */}
      <div className="rep-hero">
        <div className="rep-hero-char-wrap">
          <span className="rep-hero-char">{radical.character}</span>
        </div>
        <div className="rep-hero-info">
          <div className="rep-hero-name">{radical.vietnameseName}</div>
          <div className="rep-hero-meaning">{radical.meaning}</div>
          <div className="rep-hero-meta">
            <span className="rep-hero-meta-item">{radical.strokeCount} nét</span>
            <span className="rep-hero-meta-dot">·</span>
            <span className="rep-hero-meta-item">#{radical.number}</span>
          </div>
        </div>
        <div className="rep-hero-stats">
          <div className="rep-hero-stats-num">{entries.length}</div>
          <div className="rep-hero-stats-label">Kanji</div>
        </div>
      </div>

      {/* Search bar */}
      {entries.length > 6 && (
        <div className="rep-search">
          <Search size={14} className="rep-search-icon" />
          <input
            className="rep-search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kanji, hán việt, nghĩa..."
          />
          {searchQuery && (
            <button className="rep-search-clear" onClick={() => setSearchQuery('')}>
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Add kanji form (management only) */}
      {!readOnly && showAddForm && (
        <div className="rep-add-form">
          <div className="rep-add-title">
            <Plus size={14} />
            Thêm Kanji chứa bộ「{radical.character}」
          </div>
          <div className="rep-add-fields">
            <input
              className="rep-add-input rep-add-kanji"
              value={addKanji}
              onChange={e => setAddKanji(e.target.value)}
              placeholder="字"
              maxLength={1}
              autoFocus
            />
            <input
              className="rep-add-input rep-add-hv"
              value={addHV}
              onChange={e => setAddHV(e.target.value)}
              placeholder="Hán Việt"
            />
            <input
              className="rep-add-input rep-add-meaning"
              value={addMeaning}
              onChange={e => setAddMeaning(e.target.value)}
              placeholder="Nghĩa"
            />
            <select
              className="rep-add-input rep-add-level"
              value={addLevel}
              onChange={e => setAddLevel(e.target.value as JLPTLevel)}
            >
              {JLPT_ORDER.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button className="rep-add-submit" onClick={handleAdd} disabled={!addKanji.trim()}>
              <Plus size={13} /> Thêm
            </button>
          </div>
        </div>
      )}

      {/* Kanji grid grouped by JLPT */}
      {filtered.length === 0 ? (
        <div className="rep-empty">
          <BookOpen size={32} className="rep-empty-icon" />
          <div className="rep-empty-text">
            {searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Không tìm thấy Kanji nào chứa bộ thủ này.'}
          </div>
        </div>
      ) : (
        <div className="rep-groups">
          {JLPT_ORDER.map(level => {
            const group = grouped.get(level);
            if (!group || group.length === 0) return null;
            const colors = LEVEL_COLORS[level];
            return (
              <div key={level} className="rep-group">
                <div className="rep-group-header">
                  <span
                    className="rep-level-badge"
                    style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
                  >
                    {level}
                  </span>
                  <span className="rep-group-count">{group.length} chữ</span>
                  <div className="rep-group-line" style={{ background: colors.border }} />
                </div>
                <div className="rep-grid">
                  {group.map(k => (
                    <div
                      key={k.character}
                      className={`rep-tile${k.isCustom ? ' rep-tile-custom' : ''}`}
                    >
                      {!readOnly && (
                        <button
                          className="rep-tile-remove"
                          onClick={(e) => { e.stopPropagation(); handleRemove(k.character); }}
                          title="Xóa"
                        >
                          <X size={10} />
                        </button>
                      )}
                      <div className="rep-tile-char">{k.character}</div>
                      <div className="rep-tile-hv">{k.sinoVietnamese}</div>
                      <div className="rep-tile-meaning" title={k.meaning}>{k.meaning}</div>
                      <div
                        className="rep-tile-level"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!asModal) return content;

  return (
    <div className="rep-overlay" onClick={onBack}>
      <div className="rep-modal" onClick={e => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
