// Radical-to-Kanji reverse index + kanji→radicals lookup
// Uses static decomposition map with seed `r` fallback
// Custom user entries persisted in Firestore (shared across devices)

import type { JLPTLevel } from '../types/flashcard';
import type { KanjiSeed } from '../data/kanji-seed/n5';
import { N5_KANJI } from '../data/kanji-seed/n5';
import { N4_KANJI } from '../data/kanji-seed/n4';
import { N3_KANJI } from '../data/kanji-seed/n3';
import { N2_KANJI } from '../data/kanji-seed/n2';
import { N1_KANJI } from '../data/kanji-seed/n1';
import { BT_KANJI } from '../data/kanji-seed/bt';
import { RADICAL_MAP, VARIANT_TO_BASE, BASE_TO_VARIANTS } from '../data/radicals';
import { getDecomposition } from '../data/kanji-decomposition';
import type { Radical } from '../types/kanji';

export interface RadicalKanjiEntry {
  character: string;
  sinoVietnamese: string;
  meaning: string;
  jlptLevel: JLPTLevel;
  isCustom?: boolean;
}

const SEEDS_BY_LEVEL: [JLPTLevel, KanjiSeed[]][] = [
  ['N5', N5_KANJI],
  ['N4', N4_KANJI],
  ['N3', N3_KANJI],
  ['N2', N2_KANJI],
  ['N1', N1_KANJI],
  ['BT', BT_KANJI],
];

// In-memory state
let _index: Map<string, RadicalKanjiEntry[]> | null = null;
let _customEntries: Map<string, RadicalKanjiEntry[]> = new Map();
let _customLoaded = false;

// Removed entries: radical → Set<character> (entries explicitly removed by user)
let _removedEntries: Map<string, Set<string>> = new Map();

/** Add entry to radical map with deduplication */
function addToMap(
  map: Map<string, RadicalKanjiEntry[]>,
  radical: string,
  entry: RadicalKanjiEntry,
  character: string,
): void {
  const list = map.get(radical);
  if (list) {
    if (!list.some(e => e.character === character)) list.push(entry);
  } else {
    map.set(radical, [entry]);
  }
}

function buildIndex(): Map<string, RadicalKanjiEntry[]> {
  const map = new Map<string, RadicalKanjiEntry[]>();

  for (const [level, seeds] of SEEDS_BY_LEVEL) {
    for (const seed of seeds) {
      const decomp = getDecomposition(seed.c);
      const radicals = decomp
        || (seed.r ? seed.r.split(',').map(s => s.trim()).filter(Boolean) : []);

      if (radicals.length === 0) continue;

      const entry: RadicalKanjiEntry = {
        character: seed.c,
        sinoVietnamese: seed.hv,
        meaning: seed.m,
        jlptLevel: level,
      };
      for (const r of radicals) {
        // Skip if user explicitly removed this entry
        if (_removedEntries.get(r)?.has(seed.c)) continue;

        // Register under the radical itself
        addToMap(map, r, entry, seed.c);

        // Also register under variant ↔ base forms for cross-referencing
        // If r is a variant (e.g. 亻), also register under base (人)
        const base = VARIANT_TO_BASE[r];
        if (base && !_removedEntries.get(base)?.has(seed.c)) {
          addToMap(map, base, entry, seed.c);
        }
        // If r is a base (e.g. 人), also register under its variants (亻)
        const variants = BASE_TO_VARIANTS[r];
        if (variants) {
          for (const v of variants) {
            if (!_removedEntries.get(v)?.has(seed.c)) {
              addToMap(map, v, entry, seed.c);
            }
          }
        }
      }
    }
  }

  // Merge custom entries (user-added)
  for (const [radical, entries] of _customEntries) {
    const existing = map.get(radical) || [];
    const existingChars = new Set(existing.map(e => e.character));
    for (const entry of entries) {
      if (!existingChars.has(entry.character)) {
        existing.push({ ...entry, isCustom: true });
        existingChars.add(entry.character);
      }
    }
    map.set(radical, existing);
  }

  return map;
}

function getIndex(): Map<string, RadicalKanjiEntry[]> {
  if (!_index) _index = buildIndex();
  return _index;
}

/** Get all kanji that contain the given radical */
export function getKanjiByRadical(radical: string): RadicalKanjiEntry[] {
  return getIndex().get(radical) || [];
}

/** Get Radical info from RADICAL_MAP (or null) */
export function getRadicalInfo(char: string): Radical | null {
  return RADICAL_MAP[char] || null;
}

/**
 * Get radicals for a kanji character.
 * Priority: decomposition map → seed `r` field → null
 */
export function getSeedRadicals(character: string): string[] | null {
  const decomp = getDecomposition(character);
  if (decomp) return decomp;

  for (const [, seeds] of SEEDS_BY_LEVEL) {
    const seed = seeds.find(s => s.c === character);
    if (seed?.r) {
      return seed.r.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  return null;
}

/** Set custom entries loaded from Firestore (call once on app init or on demand) */
export function setCustomEntries(entries: Map<string, RadicalKanjiEntry[]>): void {
  _customEntries = entries;
  _customLoaded = true;
  _index = null;
}

/** Whether custom entries have been loaded from Firestore */
export function isCustomLoaded(): boolean {
  return _customLoaded;
}

/** Get all current custom entries (for saving to Firestore) */
export function getCustomEntries(): Map<string, RadicalKanjiEntry[]> {
  return _customEntries;
}

/** Get removed entries (for saving to Firestore) */
export function getRemovedEntries(): Map<string, Set<string>> {
  return _removedEntries;
}

/** Set removed entries from Firestore */
export function setRemovedEntries(removed: Map<string, Set<string>>): void {
  _removedEntries = removed;
  _index = null;
}

/** Add a custom kanji entry to a radical's list (in-memory only, call save separately) */
export function addCustomRadicalKanji(radical: string, entry: RadicalKanjiEntry): void {
  const list = _customEntries.get(radical) || [];
  if (list.some(e => e.character === entry.character)) return;
  list.push({ ...entry, isCustom: true });
  _customEntries.set(radical, list);
  _index = null;
}

/** Remove a kanji entry from a radical's list (in-memory, both custom and static) */
export function removeRadicalKanji(radical: string, character: string): void {
  // Remove from custom entries if present
  const customList = _customEntries.get(radical);
  if (customList) {
    const filtered = customList.filter(e => e.character !== character);
    if (filtered.length === 0) _customEntries.delete(radical);
    else _customEntries.set(radical, filtered);
  }
  // Mark as removed for static entries
  if (!_removedEntries.has(radical)) _removedEntries.set(radical, new Set());
  _removedEntries.get(radical)!.add(character);
  _index = null;
}

/** Force rebuild the index */
export function rebuildRadicalIndex(): void {
  _index = null;
}
