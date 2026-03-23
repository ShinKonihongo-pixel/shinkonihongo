import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDailyMissions } from '../use-daily-missions';

describe('useDailyMissions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates 4 missions for a given userId', () => {
    const { result } = renderHook(() => useDailyMissions('user123'));
    expect(result.current.missions).toHaveLength(4);
  });

  it('generates same missions for same userId on same day', () => {
    const { result: r1 } = renderHook(() => useDailyMissions('user123'));
    const { result: r2 } = renderHook(() => useDailyMissions('user123'));
    expect(r1.current.missions.map(m => m.type)).toEqual(r2.current.missions.map(m => m.type));
  });

  it('generates different missions for different userIds', () => {
    const { result: r1 } = renderHook(() => useDailyMissions('user123'));
    const { result: r2 } = renderHook(() => useDailyMissions('user456'));
    const types1 = r1.current.missions.map(m => m.type).sort();
    const types2 = r2.current.missions.map(m => m.type).sort();
    expect(types1).toHaveLength(4);
    expect(types2).toHaveLength(4);
  });

  it('starts with allCompleted = false', () => {
    const { result } = renderHook(() => useDailyMissions('user123'));
    expect(result.current.allCompleted).toBe(false);
  });

  it('updates mission progress', () => {
    const { result } = renderHook(() => useDailyMissions('user123'));
    const firstMission = result.current.missions[0];

    act(() => {
      result.current.updateMissionProgress(firstMission.type, 1);
    });

    const updated = result.current.missions.find(m => m.type === firstMission.type);
    expect(updated?.progress).toBeGreaterThanOrEqual(1);
  });

  it('marks mission as completed when progress reaches target', () => {
    const { result } = renderHook(() => useDailyMissions('user123'));
    const firstMission = result.current.missions[0];

    act(() => {
      result.current.updateMissionProgress(firstMission.type, firstMission.target);
    });

    const updated = result.current.missions.find(m => m.type === firstMission.type);
    expect(updated?.isCompleted).toBe(true);
  });

  it('detects allCompleted when all missions done', () => {
    const { result } = renderHook(() => useDailyMissions('user123'));

    act(() => {
      for (const mission of result.current.missions) {
        result.current.updateMissionProgress(mission.type, mission.target);
      }
    });

    expect(result.current.allCompleted).toBe(true);
  });

  it('persists state to localStorage', () => {
    const { result } = renderHook(() => useDailyMissions('user123'));
    const firstMission = result.current.missions[0];

    act(() => {
      result.current.updateMissionProgress(firstMission.type, 1);
    });

    const stored = localStorage.getItem('shinko_daily_missions');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.missions).toHaveLength(4);
  });
});
