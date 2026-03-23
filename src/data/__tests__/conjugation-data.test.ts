import { describe, it, expect } from 'vitest';
import { VERB_DATA, CONJUGATION_TYPES } from '../conjugation-data';

describe('Conjugation Data', () => {
  it('has 15+ verbs', () => {
    expect(VERB_DATA.length).toBeGreaterThanOrEqual(15);
  });

  it('has 10 conjugation types', () => {
    expect(CONJUGATION_TYPES).toHaveLength(10);
  });

  it('all conjugation types have unique type field', () => {
    const types = CONJUGATION_TYPES.map(t => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('all verbs have all conjugation types', () => {
    const typeKeys = CONJUGATION_TYPES.map(t => t.type);
    for (const verb of VERB_DATA) {
      for (const type of typeKeys) {
        expect(verb.conjugations[type], `${verb.dictionary} missing ${type}`).toBeTruthy();
      }
    }
  });

  it('all verbs have required fields', () => {
    for (const verb of VERB_DATA) {
      expect(verb.dictionary).toBeTruthy();
      expect(verb.reading).toBeTruthy();
      expect(verb.meaning).toBeTruthy();
      expect(['ichidan', 'godan', 'irregular']).toContain(verb.group);
    }
  });

  it('has all three verb groups', () => {
    const groups = new Set(VERB_DATA.map(v => v.group));
    expect(groups.has('ichidan')).toBe(true);
    expect(groups.has('godan')).toBe(true);
    expect(groups.has('irregular')).toBe(true);
  });

  it('する and 来る are irregular', () => {
    const suru = VERB_DATA.find(v => v.dictionary === 'する');
    const kuru = VERB_DATA.find(v => v.dictionary === '来る');
    expect(suru?.group).toBe('irregular');
    expect(kuru?.group).toBe('irregular');
  });

  it('te-form of 食べる is 食べて', () => {
    const taberu = VERB_DATA.find(v => v.dictionary === '食べる');
    expect(taberu?.conjugations['te-form']).toBe('食べて');
  });

  it('te-form of 書く is 書いて (godan く→いて)', () => {
    const kaku = VERB_DATA.find(v => v.dictionary === '書く');
    expect(kaku?.conjugations['te-form']).toBe('書いて');
  });

  it('行く irregular te-form is 行って', () => {
    const iku = VERB_DATA.find(v => v.dictionary === '行く');
    expect(iku?.conjugations['te-form']).toBe('行って');
  });

  it('conjugation types have JLPT levels', () => {
    for (const t of CONJUGATION_TYPES) {
      expect(['N5', 'N4', 'N3']).toContain(t.level);
    }
  });
});
