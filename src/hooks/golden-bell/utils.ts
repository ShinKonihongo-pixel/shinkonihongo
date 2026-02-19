// Golden Bell Game Utilities
// Shared utility functions for question generation and results calculation

import type {
  GoldenBellGame,
  GoldenBellQuestion,
  GoldenBellPlayerResult,
  QuestionDifficulty,
  QuestionCategory,
  GoldenBellTeam,
  GBTeamColorKey,
  GoldenBellTeamResult,
} from '../../types/golden-bell';
import { GB_TEAM_COLORS } from '../../types/golden-bell';
import type { Flashcard } from '../../types/flashcard';
import { generateId, shuffleArray } from '../../lib/game-utils';
import { generateMultipleChoiceOptions } from '../../lib/game-question-utils';

/**
 * Convert flashcards to Golden Bell questions
 */
export function convertFlashcardsToQuestions(
  cards: Flashcard[],
  count: number,
  timeLimit: number,
  difficultyProgression: boolean
): GoldenBellQuestion[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map((card, index) => {
    // Determine difficulty based on progression or random
    let difficulty: QuestionDifficulty;
    if (difficultyProgression) {
      if (index < count * 0.4) difficulty = 'easy';
      else if (index < count * 0.7) difficulty = 'medium';
      else difficulty = 'hard';
    } else {
      const rand = Math.random();
      if (rand < 0.4) difficulty = 'easy';
      else if (rand < 0.75) difficulty = 'medium';
      else difficulty = 'hard';
    }

    // Determine category based on card content
    let category: QuestionCategory = 'vocabulary';
    if (card.kanji && card.kanji.length > 0) category = 'kanji';

    // Generate multiple choice options
    const { options, correctIndex } = generateMultipleChoiceOptions(card, cards);

    return {
      id: generateId(),
      questionText: card.kanji || card.vocabulary,
      options,
      correctIndex,
      category,
      difficulty,
      timeLimit,
      explanation: card.sinoVietnamese ? `Hán Việt: ${card.sinoVietnamese}` : undefined,
    };
  });
}

/**
 * Create teams for team mode
 */
export function createGoldenBellTeams(teamCount: number): Record<string, GoldenBellTeam> {
  const colorKeys: GBTeamColorKey[] = ['red', 'blue', 'yellow', 'purple', 'green', 'orange'];
  const teams: Record<string, GoldenBellTeam> = {};

  for (let i = 0; i < Math.min(teamCount, colorKeys.length); i++) {
    const colorKey = colorKeys[i];
    const color = GB_TEAM_COLORS[colorKey];
    const teamId = `team-${colorKey}`;
    teams[teamId] = {
      id: teamId,
      name: `Đội ${color.name}`,
      colorKey,
      emoji: color.emoji,
      members: [],
      aliveCount: 0,
      totalCorrect: 0,
    };
  }

  return teams;
}

/**
 * Generate team rankings for team mode results
 */
export function generateTeamResults(game: GoldenBellGame): GoldenBellTeamResult[] {
  if (!game.teams) return [];

  const teamResults: GoldenBellTeamResult[] = Object.values(game.teams).map(team => {
    const members = team.members.map(mid => game.players[mid]).filter(Boolean);
    const aliveMemberCount = members.filter(m => m.status === 'alive' || m.status === 'winner').length;
    const totalCorrectCount = members.reduce((sum, m) => sum + m.correctAnswers, 0);

    // Find MVP (most correct answers)
    let mvp = members[0];
    members.forEach(m => {
      if (m.correctAnswers > (mvp?.correctAnswers || 0)) mvp = m;
    });

    return {
      teamId: team.id,
      teamName: team.name,
      colorKey: team.colorKey,
      emoji: team.emoji,
      rank: 0, // computed below
      aliveMembers: aliveMemberCount,
      totalMembers: team.members.length,
      totalCorrect: totalCorrectCount,
      mvpId: mvp?.odinhId,
      mvpName: mvp?.displayName,
    };
  });

  // Sort: most alive members first, then by total correct
  teamResults.sort((a, b) => {
    if (a.aliveMembers !== b.aliveMembers) return b.aliveMembers - a.aliveMembers;
    return b.totalCorrect - a.totalCorrect;
  });

  // Assign ranks
  teamResults.forEach((t, i) => { t.rank = i + 1; });

  return teamResults;
}

/**
 * Generate final game results with rankings
 */
export function generateResults(game: GoldenBellGame): GoldenBellPlayerResult[] {
  const players = Object.values(game.players);

  // Sort by: alive status, then by eliminatedAt (later = better), then by correctAnswers
  const sorted = players.sort((a, b) => {
    // Winners/alive first
    if (a.status === 'winner' || a.status === 'alive') return -1;
    if (b.status === 'winner' || b.status === 'alive') return 1;

    // Then by when they were eliminated (later is better)
    const aElim = a.eliminatedAt || 0;
    const bElim = b.eliminatedAt || 0;
    if (aElim !== bElim) return bElim - aElim;

    // Then by correct answers
    return b.correctAnswers - a.correctAnswers;
  });

  return sorted.map((player, index) => ({
    odinhId: player.odinhId,
    displayName: player.displayName,
    avatar: player.avatar,
    rank: index + 1,
    correctAnswers: player.correctAnswers,
    accuracy: player.totalAnswers > 0
      ? Math.round((player.correctAnswers / player.totalAnswers) * 100)
      : 0,
    survivedRounds: player.eliminatedAt
      ? player.eliminatedAt
      : game.currentQuestionIndex + 1,
    longestStreak: player.streak,
    isWinner: player.status === 'winner' || (player.status === 'alive' && index === 0),
  }));
}
