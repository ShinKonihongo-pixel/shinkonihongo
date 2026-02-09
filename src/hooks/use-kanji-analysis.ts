// Hook for fetching/generating Kanji character analysis
// readOnly=true → only reads from Firestore (for practice screens)
// readOnly=false → fetches + generates missing via AI (for management screens)
// Uses in-memory cache to ensure AI is called only once per character per session

import { useState, useEffect, useCallback } from 'react';
import type { KanjiCharacterAnalysis } from '../types/flashcard';
import { extractKanjiCharacters, generateKanjiCharacterAnalysis } from '../services/kanji-analysis-ai-service';
import { getMultipleKanjiAnalysis, saveMultipleKanjiAnalysis } from '../services/firestore';

// Shared in-memory cache — persists across modal open/close within the same session
// Exported so kanji-analysis-editor can share the same cache instance
export const kanjiAnalysisCache = new Map<string, KanjiCharacterAnalysis>();

interface UseKanjiAnalysisOptions {
  readOnly?: boolean;
}

export function useKanjiAnalysis(kanjiText: string, options: UseKanjiAnalysisOptions = {}) {
  const { readOnly = false } = options;
  const [analyses, setAnalyses] = useState<KanjiCharacterAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characters = extractKanjiCharacters(kanjiText);

  const fetchAndGenerate = useCallback(async (chars: string[]) => {
    if (chars.length === 0) {
      setAnalyses([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Check in-memory cache first
      const fromCache: KanjiCharacterAnalysis[] = [];
      const notInCache: string[] = [];

      for (const c of chars) {
        const hit = kanjiAnalysisCache.get(c);
        if (hit) {
          fromCache.push(hit);
        } else {
          notInCache.push(c);
        }
      }

      // All characters already cached → return immediately, no network calls
      if (notInCache.length === 0) {
        fromCache.sort((a, b) => chars.indexOf(a.character) - chars.indexOf(b.character));
        setAnalyses(fromCache);
        return;
      }

      // 2. Fetch uncached characters from Firestore
      const fromFirestore = await getMultipleKanjiAnalysis(notInCache);

      // Update cache with Firestore results
      for (const a of fromFirestore) {
        kanjiAnalysisCache.set(a.character, a);
      }

      if (readOnly) {
        const all = [...fromCache, ...fromFirestore];
        all.sort((a, b) => chars.indexOf(a.character) - chars.indexOf(b.character));
        setAnalyses(all);
      } else {
        // 3. Determine which characters are still missing
        const foundChars = new Set([
          ...fromCache.map((a) => a.character),
          ...fromFirestore.map((a) => a.character),
        ]);
        const missingChars = chars.filter((c) => !foundChars.has(c));

        let allAnalyses = [...fromCache, ...fromFirestore];

        if (missingChars.length > 0) {
          // 4. Generate via AI only for truly missing characters
          const generated = await generateKanjiCharacterAnalysis(missingChars);

          // Await save to ensure Firestore persistence before returning
          try {
            await saveMultipleKanjiAnalysis(generated);
          } catch (saveErr) {
            console.error('Failed to save kanji analysis:', saveErr);
          }

          // Update in-memory cache so next open never calls AI again
          for (const a of generated) {
            kanjiAnalysisCache.set(a.character, a);
          }

          allAnalyses = [...allAnalyses, ...generated];
        }

        allAnalyses.sort((a, b) => chars.indexOf(a.character) - chars.indexOf(b.character));
        setAnalyses(allAnalyses);
      }
    } catch (err) {
      console.error('useKanjiAnalysis error:', err);
      setError(err instanceof Error ? err.message : 'Lỗi khi tải phân tích Kanji');
    } finally {
      setLoading(false);
    }
  }, [readOnly]);

  useEffect(() => {
    fetchAndGenerate(characters);
  }, [kanjiText, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const regenerate = useCallback(async () => {
    if (characters.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const generated = await generateKanjiCharacterAnalysis(characters);
      try {
        await saveMultipleKanjiAnalysis(generated);
      } catch (saveErr) {
        console.error('Failed to save kanji analysis:', saveErr);
      }
      for (const a of generated) {
        kanjiAnalysisCache.set(a.character, a);
      }
      setAnalyses(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo lại phân tích');
    } finally {
      setLoading(false);
    }
  }, [characters]);  

  return { analyses, loading, error, regenerate };
}
