import { describe, it, expect } from 'vitest';
import { generateId, generateGameCode, shuffleArray } from '../utils';

describe('generateId (kanji-battle)', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId()));
    expect(ids.size).toBe(20);
  });
});

describe('generateGameCode (kanji-battle)', () => {
  it('returns a 6-digit numeric string', () => {
    const code = generateGameCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('returns value in range 100000–999999', () => {
    const value = parseInt(generateGameCode(), 10);
    expect(value).toBeGreaterThanOrEqual(100000);
    expect(value).toBeLessThanOrEqual(999999);
  });

  it('generates different codes on consecutive calls', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateGameCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('shuffleArray (kanji-battle re-export)', () => {
  it('returns a new array with same length', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const result = shuffleArray(arr);
    expect(result.length).toBe(arr.length);
  });

  it('contains same elements as input', () => {
    const arr = ['a', 'b', 'c', 'd'];
    expect(shuffleArray(arr).sort()).toEqual([...arr].sort());
  });

  it('does not mutate the original array', () => {
    const arr = [10, 20, 30];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles single-element array', () => {
    expect(shuffleArray(['only'])).toEqual(['only']);
  });
});
