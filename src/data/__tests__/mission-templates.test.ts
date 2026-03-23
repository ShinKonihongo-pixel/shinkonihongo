import { describe, it, expect } from 'vitest';
import { MISSION_TEMPLATES, DAILY_MISSION_COUNT, ALL_COMPLETE_BONUS_XP } from '../mission-templates';

describe('Mission Templates', () => {
  it('has 8 templates', () => {
    expect(MISSION_TEMPLATES).toHaveLength(8);
  });

  it('all templates have unique types', () => {
    const types = MISSION_TEMPLATES.map(t => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('all templates have valid target ranges', () => {
    for (const t of MISSION_TEMPLATES) {
      expect(t.targetRange.min).toBeGreaterThan(0);
      expect(t.targetRange.max).toBeGreaterThanOrEqual(t.targetRange.min);
    }
  });

  it('all templates have positive XP reward', () => {
    for (const t of MISSION_TEMPLATES) {
      expect(t.xpReward).toBeGreaterThan(0);
    }
  });

  it('DAILY_MISSION_COUNT is 4', () => {
    expect(DAILY_MISSION_COUNT).toBe(4);
  });

  it('ALL_COMPLETE_BONUS_XP is 50', () => {
    expect(ALL_COMPLETE_BONUS_XP).toBe(50);
  });

  it('has enough templates to fill daily missions', () => {
    expect(MISSION_TEMPLATES.length).toBeGreaterThanOrEqual(DAILY_MISSION_COUNT);
  });
});
