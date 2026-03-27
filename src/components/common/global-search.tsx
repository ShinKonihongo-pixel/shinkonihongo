import { useEffect, useRef, useState } from 'react';
import { Search, BookOpen, Languages, PenTool, FolderOpen, FileText, ArrowRight } from 'lucide-react';
import { useGlobalSearch, type SearchResult } from '../../hooks/use-global-search';
import type { Flashcard, Lesson } from '../../types/flashcard';
import type { GrammarCard } from '../../types/flashcard';
import type { KanjiCard } from '../../types/kanji';
import type { ReadingPassage } from '../../types/reading';
import './global-search.css';
import { ModalShell } from '../ui/modal-shell';

interface GlobalSearchProps {
  cards: Flashcard[];
  grammarCards: GrammarCard[];
  kanjiCards: KanjiCard[];
  lessons: Lesson[];
  readingPassages: ReadingPassage[];
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_ORDER: SearchResult['type'][] = ['vocab', 'grammar', 'kanji', 'lesson', 'reading'];

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  vocab: 'Từ vựng',
  grammar: 'Ngữ pháp',
  kanji: 'Chữ Hán',
  lesson: 'Bài học',
  reading: 'Đọc hiểu',
};

function TypeIcon({ type }: { type: SearchResult['type'] }) {
  const props = { size: 16 };
  switch (type) {
    case 'vocab':   return <BookOpen {...props} />;
    case 'grammar': return <Languages {...props} />;
    case 'kanji':   return <PenTool {...props} />;
    case 'lesson':  return <FolderOpen {...props} />;
    case 'reading': return <FileText {...props} />;
  }
}

export function GlobalSearch({
  cards, grammarCards, kanjiCards, lessons, readingPassages,
  onNavigate, isOpen, onClose,
}: GlobalSearchProps) {
  // Adapt Flashcard fields to hook shape
  const adaptedCards = cards.map(c => ({
    id: c.id,
    vocabulary: c.vocabulary,
    kanji: c.kanji,
    meaning: c.meaning,
  }));

  const adaptedGrammar = grammarCards.map(g => ({
    id: g.id,
    title: g.title,
    meaning: g.meaning,
  }));

  const adaptedKanji = kanjiCards.map(k => ({
    id: k.id,
    character: k.character,
    meaning: k.meaning,
    onYomi: k.onYomi,
    kunYomi: k.kunYomi,
  }));

  const adaptedPassages = readingPassages.map(r => ({
    id: r.id,
    title: r.title,
  }));

  const { query, setQuery, results } = useGlobalSearch(
    adaptedCards, adaptedGrammar, adaptedKanji, lessons, adaptedPassages,
  );

  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Reset active index when results change
  useEffect(() => { setActiveIndex(-1); }, [results]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, -1));
      }
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const r = results[activeIndex];
        if (r) handleSelect(r);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex, results]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLDivElement>('.gs-result-item');
    items[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function handleSelect(result: SearchResult) {
    onNavigate(result.page);
    onClose();
  }

  // Group results by type in order
  const grouped = TYPE_ORDER.map(type => ({
    type,
    items: results.filter(r => r.type === type),
  })).filter(g => g.items.length > 0);

  // Build a flat index mapping for keyboard nav
  const flatResults: SearchResult[] = grouped.flatMap(g => g.items);
  let itemCounter = 0;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidth={620} hideClose className="global-search-modal">
        <div className="global-search-input-wrapper">
          <Search size={20} />
          <input
            ref={inputRef}
            placeholder="Tìm kiếm từ vựng, ngữ pháp, chữ Hán..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd>ESC</kbd>
        </div>

        {grouped.length > 0 && (
          <div className="global-search-results" ref={listRef}>
            {grouped.map(group => (
              <div key={group.type}>
                <div className="gs-group-label">{TYPE_LABELS[group.type]}</div>
                {group.items.map(result => {
                  const idx = flatResults.indexOf(result);
                  const isActive = idx === activeIndex;
                  itemCounter++;
                  return (
                    <div
                      key={result.id + itemCounter}
                      className={`gs-result-item${isActive ? ' active' : ''}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <div className={`gs-result-icon type-${result.type}`}>
                        <TypeIcon type={result.type} />
                      </div>
                      <div className="gs-result-text">
                        <div className="gs-result-title">{result.title}</div>
                        {result.subtitle && (
                          <div className="gs-result-subtitle">{result.subtitle}</div>
                        )}
                      </div>
                      <ArrowRight size={14} className="gs-result-arrow" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="global-search-empty">Không tìm thấy kết quả</div>
        )}

        <div className="global-search-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> điều hướng</span>
          <span><kbd>Enter</kbd> chọn</span>
          <span><kbd>ESC</kbd> đóng</span>
        </div>
    </ModalShell>
  );
}
