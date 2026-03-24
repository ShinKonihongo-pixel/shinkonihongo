import { useState, useCallback, useMemo } from 'react';

export interface SearchResult {
  id: string;
  type: 'vocab' | 'grammar' | 'kanji' | 'lesson' | 'reading';
  title: string;
  subtitle?: string;
  page: string;
}

const MAX_PER_TYPE = 5;

export function useGlobalSearch(
  cards: Array<{ id: string; vocabulary?: string; kanji?: string; meaning?: string }>,
  grammarCards: Array<{ id: string; title?: string; meaning?: string }>,
  kanjiCards: Array<{ id: string; character?: string; meaning?: string; onYomi?: string[]; kunYomi?: string[] }>,
  lessons: Array<{ id: string; name: string }>,
  readingPassages: Array<{ id: string; title?: string }>,
) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo<SearchResult[]>(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    // Vocab cards
    let count = 0;
    for (const card of cards) {
      if (count >= MAX_PER_TYPE) break;
      if (
        card.vocabulary?.toLowerCase().includes(q) ||
        card.kanji?.toLowerCase().includes(q) ||
        card.meaning?.toLowerCase().includes(q)
      ) {
        out.push({ id: card.id, type: 'vocab', title: card.vocabulary || card.kanji || '', subtitle: card.meaning, page: 'study' });
        count++;
      }
    }

    // Grammar cards
    count = 0;
    for (const g of grammarCards) {
      if (count >= MAX_PER_TYPE) break;
      if (g.title?.toLowerCase().includes(q) || g.meaning?.toLowerCase().includes(q)) {
        out.push({ id: g.id, type: 'grammar', title: g.title || '', subtitle: g.meaning, page: 'grammar' });
        count++;
      }
    }

    // Kanji cards
    count = 0;
    for (const k of kanjiCards) {
      if (count >= MAX_PER_TYPE) break;
      const readingsMatch =
        k.onYomi?.some(r => r.toLowerCase().includes(q)) ||
        k.kunYomi?.some(r => r.toLowerCase().includes(q));
      if (k.character?.toLowerCase().includes(q) || k.meaning?.toLowerCase().includes(q) || readingsMatch) {
        out.push({ id: k.id, type: 'kanji', title: k.character || '', subtitle: k.meaning, page: 'kanji-study' });
        count++;
      }
    }

    // Lessons
    count = 0;
    for (const l of lessons) {
      if (count >= MAX_PER_TYPE) break;
      if (l.name.toLowerCase().includes(q)) {
        out.push({ id: l.id, type: 'lesson', title: l.name, page: 'study' });
        count++;
      }
    }

    // Reading passages
    count = 0;
    for (const r of readingPassages) {
      if (count >= MAX_PER_TYPE) break;
      if (r.title?.toLowerCase().includes(q)) {
        out.push({ id: r.id, type: 'reading', title: r.title || '', page: 'reading' });
        count++;
      }
    }

    return out;
  }, [query, cards, grammarCards, kanjiCards, lessons, readingPassages]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  return { query, setQuery, results, isOpen, open, close };
}
