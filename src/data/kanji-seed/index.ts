// Kanji seed data index - combines all JLPT levels
// Converts compact seed format to KanjiCardFormData

import type { KanjiCardFormData } from '../../types/kanji';
import type { JLPTLevel } from '../../types/flashcard';
import type { KanjiSeed } from './n5';
import { N5_KANJI } from './n5';
import { N4_KANJI } from './n4';
import { N3_KANJI } from './n3';
import { N2_KANJI } from './n2';
import { N1_KANJI } from './n1';
import { BT_KANJI } from './bt';

// Map level to seed data
const SEED_BY_LEVEL: Record<JLPTLevel, KanjiSeed[]> = {
  N5: N5_KANJI,
  N4: N4_KANJI,
  N3: N3_KANJI,
  N2: N2_KANJI,
  N1: N1_KANJI,
  BT: BT_KANJI,
};

// Convert compact seed to full KanjiCardFormData
function seedToFormData(seed: KanjiSeed, level: JLPTLevel, lessonId: string): KanjiCardFormData {
  return {
    character: seed.c,
    onYomi: seed.on ? seed.on.split(',').map(s => s.trim()) : [],
    kunYomi: seed.kun ? seed.kun.split(',').map(s => s.trim()) : [],
    sinoVietnamese: seed.hv,
    meaning: seed.m,
    mnemonic: seed.mn || '',
    strokeCount: seed.s,
    radicals: seed.r ? seed.r.split(',').map(s => s.trim()) : [],
    jlptLevel: level,
    lessonId,
    sampleWords: seed.w
      ? seed.w.split(';').map(entry => {
          const [word, reading, meaning] = entry.split('|');
          return { word: word || '', reading: reading || '', meaning: meaning || '' };
        })
      : [],
  };
}

// Get seed data for a level, distributed across lesson IDs
export function getKanjiSeedForLevel(
  level: JLPTLevel,
  lessonIds: string[],
): KanjiCardFormData[] {
  const seeds = SEED_BY_LEVEL[level];
  if (!seeds || lessonIds.length === 0) return [];

  return seeds.map((seed, index) => {
    // BT: distribute by stroke count (lesson index = strokeCount - 1)
    // Other levels: distribute evenly across lessons
    const lessonIndex = level === 'BT'
      ? Math.min(seed.s - 1, lessonIds.length - 1)
      : index % lessonIds.length;
    return seedToFormData(seed, level, lessonIds[lessonIndex]);
  });
}

// Get count of seed kanji for a level
export function getKanjiSeedCount(level: JLPTLevel): number {
  return SEED_BY_LEVEL[level]?.length ?? 0;
}

export type { KanjiSeed };
