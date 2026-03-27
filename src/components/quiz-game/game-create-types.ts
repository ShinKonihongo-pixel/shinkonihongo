/**
 * Shared types, constants, and role-limit helpers for GameCreate.
 */

import type { UserRole } from '../../types/user';
import type { GameDifficultyLevel } from '../../types/quiz-game';

export const JLPT_QUESTION_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export const DIFFICULTY_OPTIONS: { value: GameDifficultyLevel; label: string; color: string }[] = [
  { value: 'super_hard', label: 'Siêu khó', color: '#DC2626' },
  { value: 'hard', label: 'Khó', color: '#F59E0B' },
  { value: 'medium', label: 'Vừa', color: '#3B82F6' },
  { value: 'easy', label: 'Dễ', color: '#10B981' },
];

export const VIP_MAX_ROUNDS = 50;
export const VIP_MAX_PLAYERS = 50;

export function getMaxRounds(role?: UserRole): number {
  if (role === 'super_admin' || role === 'vip_user') return 50;
  return 20;
}

export function getMaxPlayers(role?: UserRole): number {
  if (role === 'super_admin' || role === 'vip_user') return 50;
  if (role === 'admin' || role === 'branch_admin' || role === 'director') return 20;
  return 10;
}
