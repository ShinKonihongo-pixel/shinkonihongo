import { describe, it, expect } from 'vitest';
import { generateGameCode, generateId, createTeams, generateRandomTrap, shuffleArray } from '../utils';

describe('generateGameCode', () => {
  it('returns a 6-digit numeric string', () => {
    const code = generateGameCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('returns a number >= 100000', () => {
    const code = generateGameCode();
    expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000);
  });

  it('returns a number <= 999999', () => {
    const code = generateGameCode();
    expect(parseInt(code, 10)).toBeLessThanOrEqual(999999);
  });

  it('generates different codes on consecutive calls (probabilistic)', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateGameCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('generateId', () => {
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

describe('createTeams', () => {
  it('creates the correct number of teams', () => {
    const teams = createTeams(2);
    expect(Object.keys(teams).length).toBe(2);
  });

  it('creates 4 teams when count is 4', () => {
    const teams = createTeams(4);
    expect(Object.keys(teams).length).toBe(4);
  });

  it('each team has correct structure', () => {
    const teams = createTeams(2);
    Object.values(teams).forEach(team => {
      expect(team).toHaveProperty('id');
      expect(team).toHaveProperty('name');
      expect(team).toHaveProperty('colorKey');
      expect(team).toHaveProperty('emoji');
      expect(team).toHaveProperty('members');
      expect(team).toHaveProperty('totalDistance');
      expect(team).toHaveProperty('totalPoints');
      expect(Array.isArray(team.members)).toBe(true);
      expect(team.totalDistance).toBe(0);
      expect(team.totalPoints).toBe(0);
    });
  });

  it('team IDs follow "team-<colorKey>" pattern', () => {
    const teams = createTeams(3);
    Object.entries(teams).forEach(([id, team]) => {
      expect(id).toBe(`team-${team.colorKey}`);
    });
  });

  it('assigns the first color as red for count >= 1', () => {
    const teams = createTeams(1);
    expect(teams['team-red']).toBeDefined();
  });

  it('creates 0 teams when count is 0', () => {
    const teams = createTeams(0);
    expect(Object.keys(teams).length).toBe(0);
  });
});

describe('generateRandomTrap', () => {
  it('returns a trap with required fields', () => {
    const trap = generateRandomTrap();
    expect(trap).toHaveProperty('id');
    expect(trap).toHaveProperty('type');
    expect(trap).toHaveProperty('position');
    expect(trap).toHaveProperty('isActive');
    expect(trap.isActive).toBe(true);
  });

  it('trap type is one of the valid types', () => {
    const validTypes = ['imprisonment', 'freeze', 'sinkhole'];
    for (let i = 0; i < 20; i++) {
      const trap = generateRandomTrap();
      expect(validTypes).toContain(trap.type);
    }
  });

  it('position is >= default minPosition (20)', () => {
    for (let i = 0; i < 20; i++) {
      const trap = generateRandomTrap();
      expect(trap.position).toBeGreaterThanOrEqual(20);
    }
  });

  it('position is < 80 with default minPosition', () => {
    for (let i = 0; i < 20; i++) {
      const trap = generateRandomTrap();
      expect(trap.position).toBeLessThan(80);
    }
  });

  it('respects custom minPosition', () => {
    for (let i = 0; i < 20; i++) {
      const trap = generateRandomTrap(50);
      expect(trap.position).toBeGreaterThanOrEqual(50);
    }
  });
});

describe('shuffleArray (re-exported)', () => {
  it('returns an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr).length).toBe(arr.length);
  });

  it('contains all the same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual([...arr].sort());
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles single-element array', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});
