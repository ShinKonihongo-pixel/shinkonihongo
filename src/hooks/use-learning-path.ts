// Hook for guided learning path progress tracking

import { useState, useCallback } from 'react';
import { LEARNING_PATHS, type PathStep } from '../data/learning-path';

const STORAGE_KEY = 'shinko_learning_path';

interface PathProgress {
  level: string;
  completedSteps: string[]; // step IDs
  currentStepIndex: number;
}

function loadProgress(): PathProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PathProgress;
  } catch { /* ignore */ }
  return { level: 'N5', completedSteps: [], currentStepIndex: 0 };
}

function saveProgress(progress: PathProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useLearningPath(userJlptLevel?: string) {
  const [progress, setProgress] = useState<PathProgress>(() => {
    const saved = loadProgress();
    // If user has JLPT level set and it's different from saved, use user's level
    if (userJlptLevel && saved.level !== userJlptLevel && saved.completedSteps.length === 0) {
      return { level: userJlptLevel, completedSteps: [], currentStepIndex: 0 };
    }
    return saved;
  });

  const steps: PathStep[] = LEARNING_PATHS[progress.level] || LEARNING_PATHS['N5'];
  const currentStep = steps[progress.currentStepIndex] || null;
  const totalSteps = steps.length;
  const completedCount = progress.completedSteps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const completeCurrentStep = useCallback(() => {
    setProgress(prev => {
      const step = (LEARNING_PATHS[prev.level] || [])[prev.currentStepIndex];
      if (!step) return prev;
      const completed = [...prev.completedSteps, step.id];
      const next: PathProgress = {
        ...prev,
        completedSteps: completed,
        currentStepIndex: Math.min(prev.currentStepIndex + 1, (LEARNING_PATHS[prev.level] || []).length - 1),
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const skipStep = useCallback(() => {
    setProgress(prev => {
      const maxIndex = (LEARNING_PATHS[prev.level] || []).length - 1;
      const next = { ...prev, currentStepIndex: Math.min(prev.currentStepIndex + 1, maxIndex) };
      saveProgress(next);
      return next;
    });
  }, []);

  const changeLevel = useCallback((level: string) => {
    const next: PathProgress = { level, completedSteps: [], currentStepIndex: 0 };
    setProgress(next);
    saveProgress(next);
  }, []);

  const isStepCompleted = useCallback((stepId: string) => {
    return progress.completedSteps.includes(stepId);
  }, [progress.completedSteps]);

  return {
    level: progress.level,
    steps,
    currentStep,
    currentStepIndex: progress.currentStepIndex,
    totalSteps,
    completedCount,
    progressPercent,
    completeCurrentStep,
    skipStep,
    changeLevel,
    isStepCompleted,
  };
}
