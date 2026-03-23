import { describe, it, expect } from 'vitest';
import { generateGameCode, BOT_FIRST_JOIN_DELAY, BOT_SECOND_JOIN_DELAY } from '../utils';

describe('generateGameCode (bingo)', () => {
  it('returns a 6-digit numeric string', () => {
    const code = generateGameCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('returns value in range 100000–999999', () => {
    const code = parseInt(generateGameCode(), 10);
    expect(code).toBeGreaterThanOrEqual(100000);
    expect(code).toBeLessThanOrEqual(999999);
  });

  it('generates different codes on consecutive calls', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateGameCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('BOT_FIRST_JOIN_DELAY', () => {
  it('is a positive number', () => {
    expect(typeof BOT_FIRST_JOIN_DELAY).toBe('number');
    expect(BOT_FIRST_JOIN_DELAY).toBeGreaterThan(0);
  });

  it('is 10000ms (10 seconds)', () => {
    expect(BOT_FIRST_JOIN_DELAY).toBe(10000);
  });
});

describe('BOT_SECOND_JOIN_DELAY', () => {
  it('is a positive number greater than BOT_FIRST_JOIN_DELAY', () => {
    expect(BOT_SECOND_JOIN_DELAY).toBeGreaterThan(BOT_FIRST_JOIN_DELAY);
  });

  it('is 20000ms (20 seconds)', () => {
    expect(BOT_SECOND_JOIN_DELAY).toBe(20000);
  });
});
