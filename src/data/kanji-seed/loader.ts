// Lazy loader for kanji seed data — loads per JLPT level on demand
// Caches loaded levels in module-scope Map to avoid re-imports

import type { JLPTLevel } from '../../types/flashcard';
import type { KanjiSeed } from './n5';

// Module-scope cache for loaded seed data
const seedCache = new Map<JLPTLevel, KanjiSeed[]>();
let allLevelsLoaded = false;

// Dynamic import map for each level
const LEVEL_IMPORTERS: Record<JLPTLevel, () => Promise<{ default?: KanjiSeed[] } & Record<string, KanjiSeed[]>>> = {
  N5: () => import('./n5').then(m => ({ N5_KANJI: m.N5_KANJI })),
  N4: () => import('./n4').then(m => ({ N4_KANJI: m.N4_KANJI })),
  N3: () => import('./n3').then(m => ({ N3_KANJI: m.N3_KANJI })),
  N2: () => import('./n2').then(m => ({ N2_KANJI: m.N2_KANJI })),
  N1: () => import('./n1').then(m => ({ N1_KANJI: m.N1_KANJI })),
  BT: () => import('./bt').then(m => ({ BT_KANJI: m.BT_KANJI })),
};

// Level-to-export-name mapping
const LEVEL_EXPORT_NAMES: Record<JLPTLevel, string> = {
  N5: 'N5_KANJI', N4: 'N4_KANJI', N3: 'N3_KANJI',
  N2: 'N2_KANJI', N1: 'N1_KANJI', BT: 'BT_KANJI',
};

// Load seed data for a single JLPT level (cached)
export async function loadKanjiSeedByLevel(level: JLPTLevel): Promise<KanjiSeed[]> {
  const cached = seedCache.get(level);
  if (cached) return cached;

  const mod = await LEVEL_IMPORTERS[level]();
  const exportName = LEVEL_EXPORT_NAMES[level];
  const seeds = (mod as Record<string, KanjiSeed[]>)[exportName] || [];
  seedCache.set(level, seeds);
  return seeds;
}

// Load ALL levels (for cross-level operations like getSeedByCharacter)
export async function loadAllKanjiSeeds(): Promise<Record<JLPTLevel, KanjiSeed[]>> {
  if (allLevelsLoaded) {
    return Object.fromEntries(seedCache.entries()) as Record<JLPTLevel, KanjiSeed[]>;
  }

  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1', 'BT'];
  await Promise.all(levels.map(loadKanjiSeedByLevel));
  allLevelsLoaded = true;
  return Object.fromEntries(seedCache.entries()) as Record<JLPTLevel, KanjiSeed[]>;
}

// Synchronous access to cached data (returns empty if not loaded yet)
export function getCachedSeeds(level: JLPTLevel): KanjiSeed[] {
  return seedCache.get(level) || [];
}

// Check if all levels are loaded
export function isAllLoaded(): boolean {
  return allLevelsLoaded;
}
