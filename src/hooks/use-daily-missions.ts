// Hook for daily mission generation, progress tracking, and persistence

import { useState, useCallback, useEffect, useRef } from 'react';
import type { DailyMission, DailyMissionState, MissionType } from '../types/achievements';
import { MISSION_TEMPLATES, DAILY_MISSION_COUNT, ALL_COMPLETE_BONUS_XP } from '../data/mission-templates';

const STORAGE_KEY = 'shinko_daily_missions';

// Simple hash for seeded random
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Seeded random number generator
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Generate daily missions for a specific date + userId
function generateMissions(date: string, userId: string): DailyMission[] {
  const seed = hashCode(date + userId);
  const rng = seededRandom(seed);

  // Shuffle templates
  const shuffled = [...MISSION_TEMPLATES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick first DAILY_MISSION_COUNT
  return shuffled.slice(0, DAILY_MISSION_COUNT).map((template, idx) => {
    const target = template.targetRange.min +
      Math.floor(rng() * (template.targetRange.max - template.targetRange.min + 1));
    return {
      id: `${date}-${template.type}-${idx}`,
      type: template.type,
      title: template.titleTemplate.replace('{target}', String(target)),
      description: template.descriptionVi,
      target,
      progress: 0,
      xpReward: template.xpReward,
      isCompleted: false,
    };
  });
}

// Load state from localStorage
function loadState(): DailyMissionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save state to localStorage
function saveState(state: DailyMissionState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useDailyMissions(userId: string | null) {
  const [state, setState] = useState<DailyMissionState>(() => {
    const today = getTodayDate();
    const saved = loadState();

    // If saved state is for today, reuse it
    if (saved && saved.date === today) return saved;

    // Generate new missions (userId might be null on init)
    if (!userId) {
      return {
        date: today,
        missions: [],
        allCompleted: false,
        bonusXpClaimed: false,
        bonusXp: ALL_COMPLETE_BONUS_XP,
      };
    }

    const missions = generateMissions(today, userId);
    const newState: DailyMissionState = {
      date: today,
      missions,
      allCompleted: false,
      bonusXpClaimed: false,
      bonusXp: ALL_COMPLETE_BONUS_XP,
    };
    saveState(newState);
    return newState;
  });

  const [justCompletedAll, setJustCompletedAll] = useState(false);
  const prevAllCompleted = useRef(state.allCompleted);

  // Generate missions when userId becomes available or date changes
  useEffect(() => {
    if (!userId) return;
    const today = getTodayDate();
    if (state.date !== today || state.missions.length === 0) {
      const missions = generateMissions(today, userId);
      const newState: DailyMissionState = {
        date: today,
        missions,
        allCompleted: false,
        bonusXpClaimed: false,
        bonusXp: ALL_COMPLETE_BONUS_XP,
      };
      setState(newState);
      saveState(newState);
      prevAllCompleted.current = false;
    }
  }, [userId, state.date, state.missions.length]);

  // Update mission progress
  const updateMissionProgress = useCallback((type: MissionType, increment: number) => {
    setState(prev => {
      const missions = prev.missions.map(m => {
        if (m.type !== type || m.isCompleted) return m;
        const newProgress = Math.min(m.progress + increment, m.target);
        const isCompleted = newProgress >= m.target;
        return {
          ...m,
          progress: newProgress,
          isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
        };
      });

      const allCompleted = missions.length > 0 && missions.every(m => m.isCompleted);
      const newState: DailyMissionState = { ...prev, missions, allCompleted };
      saveState(newState);
      return newState;
    });
  }, []);

  // Detect all-complete transition for celebration
  useEffect(() => {
    if (state.allCompleted && !prevAllCompleted.current) {
      setJustCompletedAll(true);
    }
    prevAllCompleted.current = state.allCompleted;
  }, [state.allCompleted]);

  const dismissAllComplete = useCallback(() => setJustCompletedAll(false), []);

  // Claim bonus XP
  const claimBonus = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, bonusXpClaimed: true };
      saveState(newState);
      return newState;
    });
  }, []);

  return {
    missions: state.missions,
    allCompleted: state.allCompleted,
    bonusXpClaimed: state.bonusXpClaimed,
    bonusXp: state.bonusXp,
    justCompletedAll,
    updateMissionProgress,
    dismissAllComplete,
    claimBonus,
  };
}
