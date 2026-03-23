import { describe, it, expect } from 'vitest';
import { generateId, generateGameCode, shuffleArray } from '../utils';

describe('generateId (quiz-game)', () => {
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

describe('generateGameCode (quiz-game)', () => {
  it('returns a non-empty string', () => {
    const code = generateGameCode();
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });

  it('returns a 6-character code', () => {
    // lib/game-utils generateGameCode returns 6 uppercase chars
    const code = generateGameCode();
    expect(code.length).toBe(6);
  });

  it('is uppercase alphanumeric', () => {
    const code = generateGameCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('generates different codes on consecutive calls', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateGameCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('shuffleArray (quiz-game)', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr).length).toBe(5);
  });

  it('contains the same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate original array', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });
});
