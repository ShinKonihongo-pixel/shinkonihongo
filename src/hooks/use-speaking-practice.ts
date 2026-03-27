// Hook for Speaking Practice feature - generates dialogues and evaluates pronunciation

import { useCallback } from 'react';
import type { JLPTLevel } from '../types/kaiwa';
import type {
  SpeakingTopicId,
  SpeakingSessionSummary,
} from '../types/speaking-practice';
import { useSpeakingDialogue } from './use-speaking-dialogue';
import { useSpeakingSession } from './use-speaking-session';
import { useSpeakingProgress } from './use-speaking-progress';

export interface UseSpeakingPracticeOptions {
  apiKey?: string;
}

export function useSpeakingPractice(options: UseSpeakingPracticeOptions = {}) {
  const dialogueHook = useSpeakingDialogue({ apiKey: options.apiKey });
  const sessionHook = useSpeakingSession({ dialogue: dialogueHook.dialogue });
  const progressHook = useSpeakingProgress();

  // Generate new dialogue and initialize session tracking
  const generateDialogue = useCallback(async (
    topicId: SpeakingTopicId,
    level: JLPTLevel
  ) => {
    const result = await dialogueHook.generateDialogue(topicId, level);
    if (result) {
      sessionHook.initSession();
    }
    return result;
  }, [dialogueHook, sessionHook]);

  // Complete session, persist progress, return summary
  const completeSession = useCallback((): SpeakingSessionSummary | null => {
    const summary = sessionHook.buildSummary();
    if (summary) {
      progressHook.persistProgress(summary);
    }
    return summary;
  }, [sessionHook, progressHook]);

  // Reset all state
  const resetSession = useCallback(() => {
    dialogueHook.resetDialogue();
    sessionHook.resetSession();
  }, [dialogueHook, sessionHook]);

  return {
    // State
    dialogue: dialogueHook.dialogue,
    isLoading: dialogueHook.isLoading,
    error: dialogueHook.error,
    progress: progressHook.progress,

    // Actions
    generateDialogue,
    startRecording: sessionHook.startRecording,
    evaluateLine: sessionHook.evaluateLine,
    completeSession,
    resetSession,
    clearError: dialogueHook.clearError,
    refreshProgress: progressHook.refreshProgress,
  };
}
