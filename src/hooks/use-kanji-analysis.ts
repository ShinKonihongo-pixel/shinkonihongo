// Hook for fetching/generating Kanji character analysis
// readOnly=true → only reads from Firestore (for practice screens)
// readOnly=false → fetches + generates missing via AI (for management screens)
// Uses in-memory cache to ensure AI is called only once per character per session

import { useState, useEffect, useCallback } from 'react';
import type { KanjiCharacterAnalysis } from '../types/flashcard';
import { extractKanjiCharacters, generateKanjiCharacterAnalysis } from '../services/kanji-analysis-ai-service';
import { getMultipleKanjiAnalysis, saveMultipleKanjiAnalysis } from '../services/firestore';
import { getSeedRadicals } from '../utils/radical-kanji-index';
import { handleError } from '../utils/error-handler';

// Shared in-memory cache — persists across modal open/close within the same session
// Exported so kanji-analysis-editor can share the same cache instance
export const kanjiAnalysisCache = new Map<string, KanjiCharacterAnalysis>();

// Enrich analyses with seed radicals when:
// 1. Analysis has no radicals at all
// 2. Analysis has fewer radicals than static data (old incomplete data)
function enrichWithSeedRadicals(analyses: KanjiCharacterAnalysis[]): {
  enriched: KanjiCharacterAnalysis[];
  updated: KanjiCharacterAnalysis[];
} {
  const enriched: KanjiCharacterAnalysis[] = [];
  const updated: KanjiCharacterAnalysis[] = [];

  for (const a of analyses) {
    const seedR = getSeedRadicals(a.character);
    const currentLen = a.radicals?.length || 0;
    const seedLen = seedR?.length || 0;

    // Upgrade if: no radicals, OR static data has MORE components (improved decomposition)
    if (seedR && seedLen > currentLen) {
      const patched = { ...a, radicals: seedR };
      enriched.push(patched);
      updated.push(patched);
    } else {
      enriched.push(a);
    }
  }
  return { enriched, updated };
}

interface UseKanjiAnalysisOptions {
  readOnly?: boolean;
}

export function useKanjiAnalysis(kanjiText: string, options: UseKanjiAnalysisOptions = {}) {
  const { readOnly = false } = options;
  const characters = extractKanjiCharacters(kanjiText);

  // Sync cache check on mount — avoids loading flash when data is already cached
  const initialCached = () => {
    if (characters.length === 0) return { analyses: [] as KanjiCharacterAnalysis[], allCached: true };
    const cached: KanjiCharacterAnalysis[] = [];
    for (const c of characters) {
      const hit = kanjiAnalysisCache.get(c);
      if (hit) cached.push(hit);
      else return { analyses: [], allCached: false };
    }
    return { analyses: cached, allCached: true };
  };
  const init = initialCached();

  const [analyses, setAnalyses] = useState<KanjiCharacterAnalysis[]>(init.analyses);
  const [loading, setLoading] = useState(!init.allCached && characters.length > 0);
  const [error, setError] = useState<string | null>(null);

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

      // All characters already cached → enrich if needed, return immediately
      if (notInCache.length === 0) {
        const { enriched, updated } = enrichWithSeedRadicals(fromCache);
        if (updated.length > 0) {
          for (const a of updated) kanjiAnalysisCache.set(a.character, a);
          saveMultipleKanjiAnalysis(updated).catch(e => console.error('Enrich save error:', e));
        }
        enriched.sort((a, b) => chars.indexOf(a.character) - chars.indexOf(b.character));
        setAnalyses(enriched);
        return;
      }

      // 2. Fetch uncached characters from Firestore
      const fromFirestore = await getMultipleKanjiAnalysis(notInCache);

      // Enrich Firestore results with seed radicals if missing
      const { enriched: enrichedFirestore, updated: fsUpdated } = enrichWithSeedRadicals(fromFirestore);

      // Update cache with enriched Firestore results
      for (const a of enrichedFirestore) {
        kanjiAnalysisCache.set(a.character, a);
      }

      // Silently persist enriched docs back to Firestore (fire-and-forget)
      if (fsUpdated.length > 0) {
        saveMultipleKanjiAnalysis(fsUpdated).catch(e => console.error('Enrich save error:', e));
      }

      if (readOnly) {
        const all = [...fromCache, ...enrichedFirestore];
        all.sort((a, b) => chars.indexOf(a.character) - chars.indexOf(b.character));
        setAnalyses(all);
      } else {
        // 3. Determine which characters are still missing
        const foundChars = new Set([
          ...fromCache.map((a) => a.character),
          ...enrichedFirestore.map((a) => a.character),
        ]);
        const missingChars = chars.filter((c) => !foundChars.has(c));

        let allAnalyses = [...fromCache, ...enrichedFirestore];

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
