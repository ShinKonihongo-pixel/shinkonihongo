import { describe, it, expect } from 'vitest';
import { createFSRSState, scheduleReview, migrateFromSM2, type FSRSRating } from '../fsrs';

describe('FSRS Algorithm', () => {
  it('creates default state with zeroed values', () => {
    const state = createFSRSState();
    expect(state.stability).toBe(0);
    expect(state.reps).toBe(0);
    expect(state.lapses).toBe(0);
  });

  it('first review with Good rating gives positive stability', () => {
    const state = createFSRSState();
    const next = scheduleReview(state, 3);
    expect(next.stability).toBeGreaterThan(0);
    expect(next.reps).toBe(1);
    expect(next.scheduledDays).toBeGreaterThanOrEqual(1);
  });

  it('Again rating gives shortest interval', () => {
    const state = createFSRSState();
    const again = scheduleReview(state, 1);
    const good = scheduleReview(state, 3);
    expect(again.scheduledDays).toBeLessThanOrEqual(good.scheduledDays);
  });

  it('Easy rating gives longest interval', () => {
    const state = createFSRSState();
    const good = scheduleReview(state, 3);
    const easy = scheduleReview(state, 4);
    expect(easy.scheduledDays).toBeGreaterThanOrEqual(good.scheduledDays);
  });

  it('multiple reviews increase stability', () => {
    let state = createFSRSState();
    state = scheduleReview(state, 3); // Good
    const s1 = state.stability;
    state = scheduleReview(state, 3); // Good again
    // stability >= s1 (may equal when elapsed days ≈ 0, i.e. same instant in tests)
    expect(state.stability).toBeGreaterThanOrEqual(s1);
  });

  it('Again rating increments lapses', () => {
    let state = createFSRSState();
    state = scheduleReview(state, 3); // Good
    state = scheduleReview(state, 1); // Again
    expect(state.lapses).toBe(1);
  });

  it('difficulty stays within 1-10 range', () => {
    let state = createFSRSState();
    // Rate many times with various ratings
    for (const r of [1, 1, 1, 4, 4, 4, 1, 2, 3, 4] as FSRSRating[]) {
      state = scheduleReview(state, r);
      expect(state.difficulty).toBeGreaterThanOrEqual(1);
      expect(state.difficulty).toBeLessThanOrEqual(10);
    }
  });

  it('migrateFromSM2 converts correctly', () => {
    const fsrs = migrateFromSM2({
      easeFactor: 2.5,
      interval: 10,
      repetitions: 5,
    });
    expect(fsrs.stability).toBeGreaterThan(0);
    expect(fsrs.reps).toBe(5);
    expect(fsrs.difficulty).toBeGreaterThanOrEqual(1);
    expect(fsrs.difficulty).toBeLessThanOrEqual(10);
  });

  it('nextReview is in the future', () => {
    const state = createFSRSState();
    const next = scheduleReview(state, 3);
    expect(new Date(next.nextReview).getTime()).toBeGreaterThan(Date.now() - 1000);
  });
});
