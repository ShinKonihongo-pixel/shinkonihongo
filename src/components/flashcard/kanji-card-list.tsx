// Kanji card list with expandable details
import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import type { KanjiCard } from '../../types/kanji';
import type { JLPTLevel } from '../../types/flashcard';

const LEVEL_COLORS: Record<JLPTLevel, string> = { BT: '#8b5cf6', N5: '#4CAF50', N4: '#2196F3', N3: '#FF9800', N2: '#9C27B0', N1: '#E34234' };

interface KanjiCardListProps {
  cards: KanjiCard[];
  onEdit?: (card: KanjiCard) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
}

export function KanjiCardList({ cards, onEdit, onDelete, canEdit = false }: KanjiCardListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (cards.length === 0) {
    return <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>Chưa có thẻ kanji nào</div>;
  }

  return (
    <div className="grammar-card-list">
      {cards.map(card => (
        <div key={card.id} className="grammar-card-item" style={{ borderLeft: `3px solid ${LEVEL_COLORS[card.jlptLevel]}` }}>
          <div className="card-item-header" onClick={() => setExpandedId(expandedId === card.id ? null : card.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.8rem', fontFamily: 'serif', minWidth: '2.5rem', textAlign: 'center' }}>{card.character}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#fbbf24' }}>{card.sinoVietnamese}</div>
              <div style={{ fontSize: '0.85rem', color: '#999' }}>{card.meaning}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {canEdit && onEdit && <button className="btn btn-icon btn-sm" onClick={e => { e.stopPropagation(); onEdit(card); }}><Edit size={14} /></button>}
              {canEdit && onDelete && <button className="btn btn-icon btn-sm btn-danger" onClick={e => { e.stopPropagation(); onDelete(card.id); }}><Trash2 size={14} /></button>}
              {expandedId === card.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          {expandedId === card.id && (
            <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.9rem' }}>
              {card.onYomi.length > 0 && <div><strong>音:</strong> {card.onYomi.join('、')}</div>}
              {card.kunYomi.length > 0 && <div><strong>訓:</strong> {card.kunYomi.join('、')}</div>}
              <div><strong>Số nét:</strong> {card.strokeCount}</div>
              {card.mnemonic && <div><strong>Mẹo nhớ:</strong> {card.mnemonic}</div>}
              {card.radicals.length > 0 && <div><strong>Bộ thủ:</strong> {card.radicals.join(', ')}</div>}
              {card.sampleWords.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Từ mẫu:</strong>
                  {card.sampleWords.map((sw, i) => <div key={i} style={{ paddingLeft: '1rem' }}>{sw.word} ({sw.reading}) - {sw.meaning}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
