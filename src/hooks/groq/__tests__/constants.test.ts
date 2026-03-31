import { describe, it, expect } from 'vitest';
import { GROQ_API_URL, MODEL, TOPIC_PROMPTS, LEVEL_CONFIG } from '../constants';

describe('GROQ_API_URL', () => {
  it('is a valid URL string', () => {
    expect(() => new URL(GROQ_API_URL)).not.toThrow();
  });

  it('uses https protocol', () => {
    expect(new URL(GROQ_API_URL).protocol).toBe('https:');
  });
});

describe('MODEL', () => {
  it('is defined and non-empty', () => {
    expect(MODEL).toBeDefined();
    expect(typeof MODEL).toBe('string');
    expect(MODEL.length).toBeGreaterThan(0);
  });
});

describe('TOPIC_PROMPTS', () => {
  const expectedTopics = [
    'free', 'greetings', 'self_intro', 'shopping', 'restaurant',
    'travel', 'work', 'hobbies', 'weather', 'directions',
  ];

  it('has all expected topic keys', () => {
    expectedTopics.forEach(topic => {
      expect(TOPIC_PROMPTS).toHaveProperty(topic);
    });
  });

  it('each topic prompt is a non-empty string', () => {
    Object.entries(TOPIC_PROMPTS).forEach(([key, value]) => {
      expect(typeof value).toBe('string');
      expect(value.length, `Prompt for "${key}" is empty`).toBeGreaterThan(0);
    });
  });

  it('has at least 10 topics', () => {
    expect(Object.keys(TOPIC_PROMPTS).length).toBeGreaterThanOrEqual(10);
  });
});

describe('LEVEL_CONFIG', () => {
  const expectedLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];

  it('has entries for N5 through N1', () => {
    expectedLevels.forEach(level => {
      expect(LEVEL_CONFIG).toHaveProperty(level);
    });
  });

  it('each level has maxSentences as a positive number', () => {
    expectedLevels.forEach(level => {
      expect(typeof LEVEL_CONFIG[level].maxSentences).toBe('number');
      expect(LEVEL_CONFIG[level].maxSentences).toBeGreaterThan(0);
    });
  });

  it('each level has responseGuidance as a non-empty string', () => {
    expectedLevels.forEach(level => {
      expect(typeof LEVEL_CONFIG[level].responseGuidance).toBe('string');
      expect(LEVEL_CONFIG[level].responseGuidance.length).toBeGreaterThan(0);
    });
  });

  it('each level has vocabGuidance as a non-empty string', () => {
    expectedLevels.forEach(level => {
      expect(typeof LEVEL_CONFIG[level].vocabGuidance).toBe('string');
      expect(LEVEL_CONFIG[level].vocabGuidance.length).toBeGreaterThan(0);
    });
  });

  it('maxSentences increases from N5 to N1', () => {
    const n5 = LEVEL_CONFIG['N5'].maxSentences;
    const n4 = LEVEL_CONFIG['N4'].maxSentences;
    const n3 = LEVEL_CONFIG['N3'].maxSentences;
    const n2 = LEVEL_CONFIG['N2'].maxSentences;
    const n1 = LEVEL_CONFIG['N1'].maxSentences;
    expect(n5).toBeLessThanOrEqual(n4);
    expect(n4).toBeLessThanOrEqual(n3);
    expect(n3).toBeLessThanOrEqual(n2);
    expect(n2).toBeLessThanOrEqual(n1);
  });
});
