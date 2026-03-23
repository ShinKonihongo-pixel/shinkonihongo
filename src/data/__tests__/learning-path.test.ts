import { describe, it, expect } from 'vitest';
import { LEARNING_PATHS, STEP_TYPE_INFO } from '../learning-path';

describe('Learning Paths', () => {
  it('has paths for all 5 JLPT levels', () => {
    expect(Object.keys(LEARNING_PATHS)).toEqual(
      expect.arrayContaining(['N5', 'N4', 'N3', 'N2', 'N1']),
    );
  });

  it('N5 has the most steps (longest path)', () => {
    const n5 = LEARNING_PATHS['N5'].length;
    for (const [level, steps] of Object.entries(LEARNING_PATHS)) {
      if (level !== 'N5') {
        expect(n5).toBeGreaterThanOrEqual(steps.length);
      }
    }
  });

  it('all steps have unique IDs within each level', () => {
    for (const [level, steps] of Object.entries(LEARNING_PATHS)) {
      const ids = steps.map(s => s.id);
      expect(new Set(ids).size, `${level} has duplicate IDs`).toBe(ids.length);
    }
  });

  it('all steps have required fields', () => {
    for (const [level, steps] of Object.entries(LEARNING_PATHS)) {
      for (const step of steps) {
        expect(step.id, `${level} step missing id`).toBeTruthy();
        expect(step.type, `${level} step ${step.id} missing type`).toBeTruthy();
        expect(step.title, `${level} step ${step.id} missing title`).toBeTruthy();
        expect(step.page, `${level} step ${step.id} missing page`).toBeTruthy();
        expect(
          step.estimatedMinutes,
          `${level} step ${step.id} missing time`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('step types are valid', () => {
    const validTypes = Object.keys(STEP_TYPE_INFO);
    for (const steps of Object.values(LEARNING_PATHS)) {
      for (const step of steps) {
        expect(validTypes).toContain(step.type);
      }
    }
  });

  it('STEP_TYPE_INFO has icon and color for each type', () => {
    for (const [type, info] of Object.entries(STEP_TYPE_INFO)) {
      expect(info.icon, `${type} missing icon`).toBeTruthy();
      expect(info.color, `${type} missing color`).toBeTruthy();
    }
  });

  it('N5 path covers multiple skill types', () => {
    const types = new Set(LEARNING_PATHS['N5'].map(s => s.type));
    expect(types.size).toBeGreaterThanOrEqual(5); // at least 5 different types
  });
});
