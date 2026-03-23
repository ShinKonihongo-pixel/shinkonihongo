import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLearningPath } from '../use-learning-path';
import { LEARNING_PATHS } from '../../data/learning-path';

describe('useLearningPath', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to N5 level', () => {
    const { result } = renderHook(() => useLearningPath());
    expect(result.current.level).toBe('N5');
  });

  it('uses user JLPT level when provided and no saved progress', () => {
    const { result } = renderHook(() => useLearningPath('N3'));
    expect(result.current.level).toBe('N3');
  });

  it('has steps matching LEARNING_PATHS data', () => {
    const { result } = renderHook(() => useLearningPath());
    expect(result.current.steps).toEqual(LEARNING_PATHS['N5']);
  });

  it('starts at step index 0', () => {
    const { result } = renderHook(() => useLearningPath());
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.completedCount).toBe(0);
  });

  it('currentStep returns first step', () => {
    const { result } = renderHook(() => useLearningPath());
    expect(result.current.currentStep).toBe(LEARNING_PATHS['N5'][0]);
  });

  it('completeCurrentStep advances to next step', () => {
    const { result } = renderHook(() => useLearningPath());
    act(() => { result.current.completeCurrentStep(); });
    expect(result.current.currentStepIndex).toBe(1);
    expect(result.current.completedCount).toBe(1);
  });

  it('skipStep advances without completing', () => {
    const { result } = renderHook(() => useLearningPath());
    act(() => { result.current.skipStep(); });
    expect(result.current.currentStepIndex).toBe(1);
    expect(result.current.completedCount).toBe(0);
  });

  it('changeLevel resets progress', () => {
    const { result } = renderHook(() => useLearningPath());
    act(() => { result.current.completeCurrentStep(); });
    act(() => { result.current.changeLevel('N4'); });
    expect(result.current.level).toBe('N4');
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.completedCount).toBe(0);
  });

  it('progressPercent is 0 at start', () => {
    const { result } = renderHook(() => useLearningPath());
    expect(result.current.progressPercent).toBe(0);
  });

  it('progressPercent increases after completing a step', () => {
    const { result } = renderHook(() => useLearningPath());
    act(() => { result.current.completeCurrentStep(); });
    expect(result.current.progressPercent).toBeGreaterThan(0);
  });

  it('isStepCompleted tracks completed steps', () => {
    const { result } = renderHook(() => useLearningPath());
    const firstStepId = result.current.steps[0].id;
    expect(result.current.isStepCompleted(firstStepId)).toBe(false);
    act(() => { result.current.completeCurrentStep(); });
    expect(result.current.isStepCompleted(firstStepId)).toBe(true);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useLearningPath());
    act(() => { result.current.completeCurrentStep(); });

    const stored = localStorage.getItem('shinko_learning_path');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.completedSteps).toHaveLength(1);
  });
});
