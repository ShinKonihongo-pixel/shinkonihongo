// Kanji card list with expandable details + decomposer modal
import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2, ArrowRightLeft, Puzzle } from 'lucide-react';
import type { KanjiCard } from '../../types/kanji';
import { LEVEL_COLORS } from '../../constants/themes';
import { lazy, Suspense } from 'react';
import './kanji-card-list.css';

const KanjiDecomposerModal = lazy(() => import('./kanji-decomposer-modal').then(m => ({ default: m.KanjiDecomposerModal })));

interface KanjiCardListProps {
  cards: KanjiCard[];
  onEdit?: (card: KanjiCard) => void;
  onDelete?: (id: string) => void;
  onMove?: (cards: KanjiCard[]) => void;
  onUpdateCard?: (id: string, data: Partial<KanjiCard>) => void;
  canEdit?: boolean;
}

export function KanjiCardList({ cards, onEdit, onDelete, onMove, onUpdateCard, canEdit = false }: KanjiCardListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [decomposingId, setDecomposingId] = useState<string | null>(null);
  // Always get latest card data from cards prop (reflects Firestore updates)
  const decomposingCard = decomposingId ? cards.find(c => c.id === decomposingId) || null : null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedCards = cards.filter(c => selectedIds.has(c.id));

  if (cards.length === 0) {
    return <div className="kcl-empty">Chưa có thẻ kanji nào</div>;
  }

  return (
    <div className="kcl-list">
      {/* Batch move bar */}
      {canEdit && onMove && selectedIds.size > 0 && (
        <div className="kanji-batch-bar">
          <span>Đã chọn {selectedIds.size} chữ</span>
          <button className="btn btn-primary btn-sm" onClick={() => { onMove(selectedCards); setSelectedIds(new Set()); }}>
            <ArrowRightLeft size={14} /> Chuyển
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIds(new Set())}>Bỏ chọn</button>
        </div>
      )}

      {cards.map(card => (
        <div key={card.id} className="kcl-card" style={{ borderLeftColor: LEVEL_COLORS[card.jlptLevel] }}>
          <div className="kcl-header" onClick={() => setExpandedId(expandedId === card.id ? null : card.id)}>
            {canEdit && onMove && (
              <input
                type="checkbox"
                checked={selectedIds.has(card.id)}
                onChange={() => toggleSelect(card.id)}
                onClick={e => e.stopPropagation()}
                className="kcl-checkbox"
              />
            )}
            <span
              className="kcl-char"
              onClick={e => { e.stopPropagation(); setDecomposingId(card.id); }}
              title="Phân tích bộ thủ"
            >{card.character}</span>
            <div className="kcl-info">
              <span className="kcl-hv">{card.sinoVietnamese}</span>
              <span className="kcl-meaning">{card.meaning}</span>
            </div>
            <div className="kcl-actions">
              <button className="kcl-action-btn kcl-action-puzzle" title="Phân tích bộ thủ" onClick={e => { e.stopPropagation(); setDecomposingId(card.id); }}><Puzzle size={15} /></button>
              {canEdit && onMove && <button className="kcl-action-btn" title="Chuyển bài" onClick={e => { e.stopPropagation(); onMove([card]); }}><ArrowRightLeft size={14} /></button>}
              {canEdit && onEdit && <button className="kcl-action-btn" onClick={e => { e.stopPropagation(); onEdit(card); }}><Edit size={14} /></button>}
              {canEdit && onDelete && <button className="kcl-action-btn kcl-action-danger" onClick={e => { e.stopPropagation(); onDelete(card.id); }}><Trash2 size={14} /></button>}
              {expandedId === card.id ? <ChevronUp size={16} className="kcl-chevron" /> : <ChevronDown size={16} className="kcl-chevron" />}
            </div>
          </div>
          {expandedId === card.id && (
            <div className="kcl-details">
              {card.onYomi.length > 0 && <div className="kcl-detail-row"><span className="kcl-detail-label">音</span> {card.onYomi.join('、')}</div>}
              {card.kunYomi.length > 0 && <div className="kcl-detail-row"><span className="kcl-detail-label">訓</span> {card.kunYomi.join('、')}</div>}
              <div className="kcl-detail-row"><span className="kcl-detail-label">Nét</span> {card.strokeCount}</div>
              {card.radicals.length > 0 && <div className="kcl-detail-row"><span className="kcl-detail-label">Bộ thủ</span> {card.radicals.join(' · ')}</div>}
              {card.mnemonic && <div className="kcl-mnemonic">💡 {card.mnemonic}</div>}
              {card.sampleWords.length > 0 && (
                <div className="kcl-words">
                  {card.sampleWords.map((sw, i) => (
                    <div key={i} className="kcl-word">
                      <span className="kcl-word-text">{sw.word}</span>
                      <span className="kcl-word-reading">{sw.reading}</span>
                      <span className="kcl-word-meaning">{sw.meaning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {decomposingCard && (
        <Suspense fallback={null}>
          <KanjiDecomposerModal
            kanjiCard={decomposingCard}
            onClose={() => setDecomposingId(null)}
            onSaveRadicals={onUpdateCard ? (radicals) => onUpdateCard(decomposingCard.id, { radicals }) : undefined}
            onSaveMnemonic={onUpdateCard ? (mnemonic) => onUpdateCard(decomposingCard.id, { mnemonic }) : undefined}
            onSaveSampleWords={onUpdateCard ? (sampleWords) => onUpdateCard(decomposingCard.id, { sampleWords }) : undefined}
          />
        </Suspense>
      )}
    </div>
  );
}
