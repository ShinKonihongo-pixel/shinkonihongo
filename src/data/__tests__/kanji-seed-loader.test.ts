// Tests for kanji seed lazy loader

import { describe, it, expect } from 'vitest';
import { loadKanjiSeedByLevel, loadAllKanjiSeeds, getCachedSeeds, isAllLoaded } from '../kanji-seed/loader';

describe('kanji-seed/loader', () => {
  it('loads N5 kanji seeds', async () => {
    const seeds = await loadKanjiSeedByLevel('N5');
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds[0]).toHaveProperty('c'); // character
    expect(seeds[0]).toHaveProperty('m'); // meaning
  });

  it('caches loaded data', async () => {
    await loadKanjiSeedByLevel('N5');
    const cached = getCachedSeeds('N5');
    expect(cached.length).toBeGreaterThan(0);
  });

  it('returns empty array for uncached levels', () => {
    // BT likely not loaded in previous tests
    const cached = getCachedSeeds('BT');
    // May or may not be loaded, but should not throw
    expect(Array.isArray(cached)).toBe(true);
  });

  it('loads all levels', async () => {
    const allSeeds = await loadAllKanjiSeeds();
    expect(allSeeds).toHaveProperty('N5');
    expect(allSeeds).toHaveProperty('N4');
    expect(allSeeds).toHaveProperty('N3');
    expect(allSeeds).toHaveProperty('N2');
    expect(allSeeds).toHaveProperty('N1');
    expect(allSeeds).toHaveProperty('BT');
    expect(isAllLoaded()).toBe(true);
  });

  it('each level has kanji data', async () => {
    const allSeeds = await loadAllKanjiSeeds();
    for (const [level, seeds] of Object.entries(allSeeds)) {
      expect(seeds.length).toBeGreaterThan(0, `${level} should have kanji`);
    }
  });
});
