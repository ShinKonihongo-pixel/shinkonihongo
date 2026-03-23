import { describe, it, expect } from 'vitest';
import { createGoldenBellTeams, generateResults, generateTeamResults } from '../utils';
import type { GoldenBellGame, GoldenBellPlayer } from '../../../types/golden-bell';

// ---------- helpers ----------

function makePlayer(overrides: Partial<GoldenBellPlayer> = {}): GoldenBellPlayer {
  return {
    odinhId: 'player-' + Math.random().toString(36).slice(2),
    displayName: 'Test',
    avatar: '',
    status: 'alive',
    correctAnswers: 0,
    totalAnswers: 0,
    streak: 0,
    skills: [],
    ...overrides,
  };
}

function makeGame(overrides: Partial<GoldenBellGame> = {}): GoldenBellGame {
  return {
    id: 'game-1',
    code: '123456',
    hostId: 'host',
    title: 'Test',
    settings: {} as GoldenBellGame['settings'],
    status: 'finished',
    players: {},
    questions: [],
    currentQuestionIndex: 5,
    alivePlayers: 0,
    eliminatedThisRound: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------- createGoldenBellTeams ----------

describe('createGoldenBellTeams', () => {
  it('creates the specified number of teams', () => {
    const teams = createGoldenBellTeams(3);
    expect(Object.keys(teams).length).toBe(3);
  });

  it('creates 0 teams when teamCount is 0', () => {
    expect(Object.keys(createGoldenBellTeams(0)).length).toBe(0);
  });

  it('caps at 6 teams regardless of input', () => {
    const teams = createGoldenBellTeams(10);
    expect(Object.keys(teams).length).toBeLessThanOrEqual(6);
  });

  it('each team has required structure', () => {
    const teams = createGoldenBellTeams(2);
    Object.values(teams).forEach(team => {
      expect(team).toHaveProperty('id');
      expect(team).toHaveProperty('name');
      expect(team).toHaveProperty('colorKey');
      expect(team).toHaveProperty('emoji');
      expect(team).toHaveProperty('members');
      expect(team).toHaveProperty('aliveCount');
      expect(team).toHaveProperty('totalCorrect');
      expect(Array.isArray(team.members)).toBe(true);
      expect(team.aliveCount).toBe(0);
      expect(team.totalCorrect).toBe(0);
    });
  });

  it('team IDs follow "team-<colorKey>" pattern', () => {
    const teams = createGoldenBellTeams(4);
    Object.entries(teams).forEach(([id, team]) => {
      expect(id).toBe(`team-${team.colorKey}`);
    });
  });

  it('uses distinct colors for each team', () => {
    const teams = createGoldenBellTeams(6);
    const colorKeys = Object.values(teams).map(t => t.colorKey);
    expect(new Set(colorKeys).size).toBe(colorKeys.length);
  });
});

// ---------- generateResults ----------

describe('generateResults', () => {
  it('returns an empty array when there are no players', () => {
    const game = makeGame({ players: {} });
    expect(generateResults(game)).toEqual([]);
  });

  it('assigns sequential ranks starting at 1', () => {
    const p1 = makePlayer({ odinhId: 'p1', status: 'winner', correctAnswers: 5, totalAnswers: 5, streak: 5 });
    const p2 = makePlayer({ odinhId: 'p2', status: 'eliminated', correctAnswers: 2, totalAnswers: 4, streak: 0, eliminatedAt: 3 });
    const game = makeGame({ players: { p1, p2 } });
    const results = generateResults(game);
    expect(results.map(r => r.rank)).toEqual([1, 2]);
  });

  it('places winner/alive players before eliminated players', () => {
    const winner = makePlayer({ odinhId: 'w', status: 'winner', correctAnswers: 10, totalAnswers: 10, streak: 0 });
    const elim = makePlayer({ odinhId: 'e', status: 'eliminated', correctAnswers: 3, totalAnswers: 5, streak: 0, eliminatedAt: 2 });
    const game = makeGame({ players: { e: elim, w: winner } });
    const results = generateResults(game);
    expect(results[0].odinhId).toBe('w');
    expect(results[0].isWinner).toBe(true);
  });

  it('calculates accuracy correctly', () => {
    const player = makePlayer({ odinhId: 'p', status: 'alive', correctAnswers: 3, totalAnswers: 4, streak: 0 });
    const game = makeGame({ players: { p: player } });
    const results = generateResults(game);
    expect(results[0].accuracy).toBe(75);
  });

  it('returns 0 accuracy when totalAnswers is 0', () => {
    const player = makePlayer({ odinhId: 'p', status: 'eliminated', correctAnswers: 0, totalAnswers: 0, streak: 0 });
    const game = makeGame({ players: { p: player } });
    const results = generateResults(game);
    expect(results[0].accuracy).toBe(0);
  });

  it('each result has all required fields', () => {
    const player = makePlayer({ odinhId: 'p', status: 'alive', correctAnswers: 2, totalAnswers: 3, streak: 2 });
    const game = makeGame({ players: { p: player } });
    const results = generateResults(game);
    const r = results[0];
    expect(r).toHaveProperty('odinhId');
    expect(r).toHaveProperty('displayName');
    expect(r).toHaveProperty('avatar');
    expect(r).toHaveProperty('rank');
    expect(r).toHaveProperty('correctAnswers');
    expect(r).toHaveProperty('accuracy');
    expect(r).toHaveProperty('survivedRounds');
    expect(r).toHaveProperty('longestStreak');
    expect(r).toHaveProperty('isWinner');
  });

  it('survivedRounds uses eliminatedAt when set', () => {
    const player = makePlayer({ odinhId: 'p', status: 'eliminated', correctAnswers: 1, totalAnswers: 2, streak: 0, eliminatedAt: 4 });
    const game = makeGame({ players: { p: player }, currentQuestionIndex: 7 });
    const results = generateResults(game);
    expect(results[0].survivedRounds).toBe(4);
  });

  it('survivedRounds uses currentQuestionIndex + 1 when not eliminated', () => {
    const player = makePlayer({ odinhId: 'p', status: 'alive', correctAnswers: 5, totalAnswers: 5, streak: 0 });
    const game = makeGame({ players: { p: player }, currentQuestionIndex: 7 });
    const results = generateResults(game);
    expect(results[0].survivedRounds).toBe(8);
  });

  it('sorts eliminated players by eliminatedAt descending', () => {
    const early = makePlayer({ odinhId: 'early', status: 'eliminated', correctAnswers: 1, totalAnswers: 3, streak: 0, eliminatedAt: 2 });
    const late = makePlayer({ odinhId: 'late', status: 'eliminated', correctAnswers: 2, totalAnswers: 4, streak: 0, eliminatedAt: 5 });
    const game = makeGame({ players: { early, late } });
    const results = generateResults(game);
    expect(results[0].odinhId).toBe('late');
    expect(results[1].odinhId).toBe('early');
  });
});

// ---------- generateTeamResults ----------

describe('generateTeamResults', () => {
  it('returns empty array when game.teams is undefined', () => {
    const game = makeGame({ teams: undefined });
    expect(generateTeamResults(game)).toEqual([]);
  });

  it('returns empty array when game.teams is empty object', () => {
    const game = makeGame({ teams: {} });
    expect(generateTeamResults(game)).toEqual([]);
  });

  it('assigns sequential ranks starting at 1', () => {
    const p1 = makePlayer({ odinhId: 'p1', status: 'alive', correctAnswers: 5, totalAnswers: 5, streak: 0 });
    const p2 = makePlayer({ odinhId: 'p2', status: 'eliminated', correctAnswers: 1, totalAnswers: 3, streak: 0 });
    const game = makeGame({
      players: { p1, p2 },
      teams: {
        'team-red': { id: 'team-red', name: 'Đội Đỏ', colorKey: 'red', emoji: '🔴', members: ['p1'], aliveCount: 1, totalCorrect: 5 },
        'team-blue': { id: 'team-blue', name: 'Đội Xanh', colorKey: 'blue', emoji: '🔵', members: ['p2'], aliveCount: 0, totalCorrect: 1 },
      },
    });
    const results = generateTeamResults(game);
    expect(results.map(r => r.rank)).toEqual([1, 2]);
  });

  it('team with more alive members ranks higher', () => {
    const alive1 = makePlayer({ odinhId: 'a1', status: 'alive', correctAnswers: 3, totalAnswers: 5, streak: 0 });
    const alive2 = makePlayer({ odinhId: 'a2', status: 'alive', correctAnswers: 2, totalAnswers: 5, streak: 0 });
    const elim = makePlayer({ odinhId: 'e1', status: 'eliminated', correctAnswers: 1, totalAnswers: 3, streak: 0 });
    const game = makeGame({
      players: { a1: alive1, a2: alive2, e1: elim },
      teams: {
        'team-red': { id: 'team-red', name: 'Đội Đỏ', colorKey: 'red', emoji: '🔴', members: ['a1', 'a2'], aliveCount: 2, totalCorrect: 5 },
        'team-blue': { id: 'team-blue', name: 'Đội Xanh', colorKey: 'blue', emoji: '🔵', members: ['e1'], aliveCount: 0, totalCorrect: 1 },
      },
    });
    const results = generateTeamResults(game);
    expect(results[0].teamId).toBe('team-red');
  });

  it('each result has all required fields', () => {
    const p = makePlayer({ odinhId: 'p', status: 'alive', correctAnswers: 3, totalAnswers: 3, streak: 0 });
    const game = makeGame({
      players: { p },
      teams: {
        'team-red': { id: 'team-red', name: 'Đội Đỏ', colorKey: 'red', emoji: '🔴', members: ['p'], aliveCount: 1, totalCorrect: 3 },
      },
    });
    const results = generateTeamResults(game);
    const r = results[0];
    expect(r).toHaveProperty('teamId');
    expect(r).toHaveProperty('teamName');
    expect(r).toHaveProperty('colorKey');
    expect(r).toHaveProperty('emoji');
    expect(r).toHaveProperty('rank');
    expect(r).toHaveProperty('aliveMembers');
    expect(r).toHaveProperty('totalMembers');
    expect(r).toHaveProperty('totalCorrect');
  });
});
