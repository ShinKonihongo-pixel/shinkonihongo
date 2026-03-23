import { describe, it, expect } from 'vitest';
import { generateResults } from '../utils';
import type { PictureGuessGame, PictureGuessPlayer } from '../../../types/picture-guess';

// ---------- helpers ----------

function makePlayer(overrides: Partial<PictureGuessPlayer> = {}): PictureGuessPlayer {
  return {
    odinhId: 'player-' + Math.random().toString(36).slice(2),
    displayName: 'Test Player',
    avatar: '',
    score: 0,
    correctGuesses: 0,
    totalGuesses: 0,
    streak: 0,
    hintsUsed: 0,
    status: 'playing' as const,
    ...overrides,
  };
}

function makeGame(overrides: Partial<PictureGuessGame> = {}): PictureGuessGame {
  return {
    id: 'game-1',
    code: '123456',
    hostId: 'host',
    title: 'Test',
    settings: {} as PictureGuessGame['settings'],
    status: 'finished',
    players: {},
    puzzles: [],
    currentPuzzleIndex: 3,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------- generateResults ----------

describe('generateResults (picture-guess)', () => {
  it('returns empty array when no players', () => {
    const game = makeGame({ players: {} });
    expect(generateResults(game)).toEqual([]);
  });

  it('assigns sequential ranks starting at 1', () => {
    const p1 = makePlayer({ odinhId: 'p1', score: 300, correctGuesses: 3, totalGuesses: 3, streak: 2 });
    const p2 = makePlayer({ odinhId: 'p2', score: 100, correctGuesses: 1, totalGuesses: 2, streak: 0 });
    const game = makeGame({ players: { p1, p2 } });
    const results = generateResults(game);
    expect(results.map(r => r.rank)).toEqual([1, 2]);
  });

  it('sorts players by score descending', () => {
    const low = makePlayer({ odinhId: 'low', score: 50, correctGuesses: 1, totalGuesses: 2, streak: 0 });
    const high = makePlayer({ odinhId: 'high', score: 500, correctGuesses: 5, totalGuesses: 5, streak: 3 });
    const game = makeGame({ players: { low, high } });
    const results = generateResults(game);
    expect(results[0].odinhId).toBe('high');
    expect(results[1].odinhId).toBe('low');
  });

  it('calculates accuracy correctly (round to nearest int)', () => {
    const p = makePlayer({ odinhId: 'p', score: 200, correctGuesses: 3, totalGuesses: 4, streak: 0 });
    const game = makeGame({ players: { p } });
    const results = generateResults(game);
    expect(results[0].accuracy).toBe(75);
  });

  it('returns 0 accuracy when totalGuesses is 0', () => {
    const p = makePlayer({ odinhId: 'p', score: 0, correctGuesses: 0, totalGuesses: 0, streak: 0 });
    const game = makeGame({ players: { p } });
    const results = generateResults(game);
    expect(results[0].accuracy).toBe(0);
  });

  it('calculates averageTime correctly', () => {
    const p = makePlayer({ odinhId: 'p', score: 100, correctGuesses: 2, totalGuesses: 2, guessTime: 6000, streak: 0 });
    const game = makeGame({ players: { p } });
    const results = generateResults(game);
    expect(results[0].averageTime).toBe(3000);
  });

  it('returns 0 averageTime when guessTime is missing', () => {
    const p = makePlayer({ odinhId: 'p', score: 0, correctGuesses: 0, totalGuesses: 0, streak: 0 });
    const game = makeGame({ players: { p } });
    const results = generateResults(game);
    expect(results[0].averageTime).toBe(0);
  });

  it('each result has required fields', () => {
    const p = makePlayer({ odinhId: 'p', score: 150, correctGuesses: 2, totalGuesses: 3, streak: 1, hintsUsed: 2 });
    const game = makeGame({ players: { p } });
    const r = generateResults(game)[0];
    expect(r).toHaveProperty('odinhId');
    expect(r).toHaveProperty('displayName');
    expect(r).toHaveProperty('avatar');
    expect(r).toHaveProperty('rank');
    expect(r).toHaveProperty('score');
    expect(r).toHaveProperty('correctGuesses');
    expect(r).toHaveProperty('accuracy');
    expect(r).toHaveProperty('averageTime');
    expect(r).toHaveProperty('longestStreak');
    expect(r).toHaveProperty('hintsUsed');
  });

  it('preserves correct odinhId and displayName', () => {
    const p = makePlayer({ odinhId: 'abc123', displayName: 'Alice', score: 0, correctGuesses: 0, totalGuesses: 0, streak: 0 });
    const game = makeGame({ players: { p: { ...p, odinhId: 'abc123' } } });
    const results = generateResults(game);
    expect(results[0].odinhId).toBe('abc123');
    expect(results[0].displayName).toBe('Alice');
  });
});
