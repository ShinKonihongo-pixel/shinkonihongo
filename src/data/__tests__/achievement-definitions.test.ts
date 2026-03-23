import { describe, it, expect } from 'vitest';
import { ACHIEVEMENT_DEFINITIONS, getAchievementDef, getAchievementsByCategory } from '../achievement-definitions';

describe('Achievement Definitions', () => {
  it('has 20 achievements', () => {
    expect(ACHIEVEMENT_DEFINITIONS).toHaveLength(20);
  });

  it('all achievements have unique IDs', () => {
    const ids = ACHIEVEMENT_DEFINITIONS.map(a => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all achievements have 3 tiers', () => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(def.tiers).toHaveLength(3);
      expect(def.tiers.map(t => t.tier)).toEqual(['bronze', 'silver', 'gold']);
    }
  });

  it('tier thresholds are ascending', () => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const thresholds = def.tiers.map(t => t.threshold);
      expect(thresholds[0]).toBeLessThan(thresholds[1]);
      expect(thresholds[1]).toBeLessThan(thresholds[2]);
    }
  });

  it('all achievements have required fields', () => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(def.id).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.nameVi).toBeTruthy();
      expect(def.nameJp).toBeTruthy();
      expect(def.icon).toBeTruthy();
    }
  });

  it('getAchievementDef finds by ID', () => {
    const found = getAchievementDef('words_learned');
    expect(found).toBeDefined();
    expect(found?.nameVi).toBe('Nhà Từ Vựng');
  });

  it('getAchievementDef returns undefined for invalid ID', () => {
    expect(getAchievementDef('nonexistent')).toBeUndefined();
  });

  it('getAchievementsByCategory filters correctly', () => {
    const learning = getAchievementsByCategory('learning');
    expect(learning.length).toBeGreaterThan(0);
    expect(learning.every(a => a.category === 'learning')).toBe(true);
  });

  it('all categories have at least one achievement', () => {
    const categories = ['learning', 'streak', 'games', 'social', 'mastery', 'special'] as const;
    for (const cat of categories) {
      const items = getAchievementsByCategory(cat);
      expect(items.length, `Category ${cat} should have achievements`).toBeGreaterThan(0);
    }
  });
});
