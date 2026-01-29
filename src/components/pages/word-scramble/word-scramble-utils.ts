// Word Scramble game utility functions
// Extracted from word-scramble-page.tsx for better maintainability

import type { Player, PlayerRole, ScrambleResult } from './word-scramble-types';
import { BOT_NAMES, BOT_AVATARS } from './word-scramble-constants';

/**
 * Scramble a word into random letter positions
 * Ensures the scrambled result is different from original
 */
export function scrambleWord(word: string): ScrambleResult {
  const letters = word.split('');
  const indices = letters.map((_, i) => i);

  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Ensure at least one position is different
  if (indices.every((val, idx) => val === idx) && letters.length > 1) {
    [indices[0], indices[1]] = [indices[1], indices[0]];
  }

  return {
    letters: indices.map(i => letters[i]),
    positions: indices
  };
}

/**
 * Calculate score based on time, streak, and penalties
 */
export function calculateScore(
  timeRemaining: number,
  totalTime: number,
  streak: number,
  autoFillPenalty: number = 0
): number {
  const baseScore = 100;
  const timeBonus = Math.round((timeRemaining / totalTime) * 100);
  const streakBonus = streak * 10;
  const totalBeforePenalty = baseScore + timeBonus + streakBonus;
  const penalty = Math.round(totalBeforePenalty * autoFillPenalty);
  return Math.max(0, totalBeforePenalty - penalty);
}

/**
 * Generate bot players for multiplayer simulation
 */
export function generateBots(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `bot-${i}`,
    name: BOT_NAMES[i % BOT_NAMES.length] + Math.floor(Math.random() * 100),
    avatar: BOT_AVATARS[i % BOT_AVATARS.length],
    score: 0,
    correctAnswers: 0,
    isCurrentUser: false,
    role: 'user' as PlayerRole,
  }));
}

/**
 * Get player name color based on role
 */
export function getPlayerNameColor(player: Player): string {
  const ROLE_COLORS: Record<PlayerRole, string> = {
    user: '#ffffff',
    vip: '#fbbf24',
    admin: '#60a5fa',
    super_admin: '#f472b6',
  };

  if (player.role && player.role !== 'user') {
    return ROLE_COLORS[player.role];
  }
  return '#ffffff';
}

/**
 * Generate initial hint state
 */
export function createInitialHintState() {
  return {
    hint1Shown: false,
    hint2Shown: false,
    hint3Shown: false,
    hint1Content: '',
    hint2Content: '',
    hint3Content: '',
  };
}
