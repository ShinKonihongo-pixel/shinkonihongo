// KanjiTab - Search bar and search results panel

import { Copy, AlertTriangle, Puzzle, Edit2, ArrowRightLeft, Trash2 } from 'lucide-react';
import { SearchInput } from '../ui/search-input';
import type { KanjiCard } from '../../types/kanji';
import type { JLPTLevel } from './cards-management-types';
import { LEVEL_COLORS } from '../../constants/themes';

interface KanjiTabSearchProps {
  searchQuery: string;
  searchFilter: 'all' | 'duplicates' | 'no-mnemonic' | 'no-words';
  searchResults: KanjiCard[] | null;
  duplicateCount: number;
  noMnemonicCount: number;
  noWordsCount: number;
  isSuperAdmin: boolean;
  getLessonName: (lessonId: string) => string;
  getIsDuplicate: (character: string) => boolean;
  onSearchQueryChange: (q: string) => void;
  onSearchFilterChange: (f: 'all' | 'duplicates' | 'no-mnemonic' | 'no-words') => void;
  onClearSearch: () => void;
  onDecomposeCard: (card: KanjiCard) => void;
  onEditCard: (card: KanjiCard) => void;
  onMoveCard: (card: KanjiCard) => void;
  onDeleteCard: (id: string, character: string) => void;
}

export function KanjiTabSearch({
  searchQuery,
  searchFilter,
  searchResults,
  duplicateCount,
  noMnemonicCount,
  noWordsCount,
  isSuperAdmin,
  getLessonName,
  getIsDuplicate,
  onSearchQueryChange,
  onSearchFilterChange,
  onClearSearch,
  onDecomposeCard,
  onEditCard,
  onMoveCard,
  onDeleteCard,
}: KanjiTabSearchProps) {
  return (
    <>
      <div className="kanji-search-section">
        <SearchInput
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder="Tìm kanji, Hán Việt, nghĩa..."
          className="kanji-search-bar"
        />
        <div className="kanji-search-filters">
          <button
            className={`kanji-filter-chip ${searchFilter === 'duplicates' ? 'active danger' : ''}`}
            onClick={() => onSearchFilterChange(searchFilter === 'duplicates' ? 'all' : 'duplicates')}
          >
            <Copy size={12} /> Trùng {duplicateCount > 0 && <span className="kanji-filter-badge">{duplicateCount}</span>}
          </button>
          <button
            className={`kanji-filter-chip ${searchFilter === 'no-mnemonic' ? 'active warning' : ''}`}
            onClick={() => onSearchFilterChange(searchFilter === 'no-mnemonic' ? 'all' : 'no-mnemonic')}
          >
            <AlertTriangle size={12} /> Thiếu mẹo nhớ {noMnemonicCount > 0 && <span className="kanji-filter-badge">{noMnemonicCount}</span>}
          </button>
          <button
            className={`kanji-filter-chip ${searchFilter === 'no-words' ? 'active warning' : ''}`}
            onClick={() => onSearchFilterChange(searchFilter === 'no-words' ? 'all' : 'no-words')}
          >
            <AlertTriangle size={12} /> Thiếu từ mẫu {noWordsCount > 0 && <span className="kanji-filter-badge">{noWordsCount}</span>}
          </button>
        </div>
      </div>

      {searchResults && (
        <div className="kanji-search-results">
          <div className="kanji-search-results-header">
            <span>Tìm thấy {searchResults.length} kết quả</span>
            <button className="btn btn-secondary btn-sm" onClick={onClearSearch}>Đóng</button>
          </div>
          {searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>Không tìm thấy kết quả</div>
          ) : (
            <div className="kanji-search-results-list">
              {searchResults.map(card => (
                <div
                  key={card.id}
                  className="kanji-search-result-item"
                  style={{ borderLeft: `3px solid ${LEVEL_COLORS[card.jlptLevel as JLPTLevel]}` }}
                >
                  <span
                    className="kanji-result-char"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onDecomposeCard(card)}
                    title="Phân tích bộ thủ"
                  >
                    {card.character}
                  </span>
                  <div className="kanji-result-info">
                    <div className="kanji-result-main">
                      <span className="kanji-result-hv">{card.sinoVietnamese}</span>
                      <span className="kanji-result-meaning">{card.meaning}</span>
                    </div>
                    <div className="kanji-result-meta">
                      <span className="kanji-result-level">{card.jlptLevel}</span>
                      <span className="kanji-result-lesson">{getLessonName(card.lessonId)}</span>
                      {!card.mnemonic && <span className="kanji-result-tag warning">Thiếu mẹo nhớ</span>}
                      {(!card.sampleWords || card.sampleWords.length === 0) && <span className="kanji-result-tag warning">Thiếu từ mẫu</span>}
                      {getIsDuplicate(card.character) && <span className="kanji-result-tag danger">Trùng</span>}
                    </div>
                  </div>
                  <div className="kanji-result-actions">
                    <button className="btn btn-icon btn-sm" title="Phân tích bộ thủ" onClick={() => onDecomposeCard(card)} style={{ color: '#8b5cf6' }}>
                      <Puzzle size={14} />
                    </button>
                    {isSuperAdmin && (
                      <>
                        <button className="btn btn-icon btn-sm" title="Sửa" onClick={() => onEditCard(card)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-icon btn-sm" title="Di chuyển" onClick={() => onMoveCard(card)}>
                          <ArrowRightLeft size={14} />
                        </button>
                        <button
                          className="btn btn-icon btn-sm btn-danger"
                          title="Xoá"
                          onClick={() => { if (confirm(`Xóa "${card.character}"?`)) onDeleteCard(card.id, card.character); }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
